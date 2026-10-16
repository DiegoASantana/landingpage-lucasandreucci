# Endpoint_de_Envio — formulário público de contato

Serviço Node.js que recebe a submissão do formulário de `site-lucas-andreucci.html`, registra o Consentimento_LGPD em tabela do Supabase e notifica o Dr. Lucas por e-mail via Resend.

Spec: `.kiro/specs/landing-page-contatos/` (Fase 1 — Requisitos 1, 2 e 3).

## Variáveis de ambiente

Toda a configuração vem exclusivamente de `process.env` (DD-05 / Requisito 3.6). Nada é hardcoded em código versionado e nada aparece em arquivo servido ao navegador. Copie `.env.example` para `.env` (não versionado) e preencha.

| Variável | Obrigatória | Padrão | Papel |
|---|---|---|---|
| `RESEND_API_KEY` | Sim | — | Chave de API do Resend. Segredo: nunca versionado, nunca registrado em log |
| `EMAIL_DESTINO_DR_LUCAS` | Sim | — | Destinatário da Notificacao_por_Email |
| `EMAIL_REMETENTE` | Sim | — | Remetente; precisa usar domínio verificado no painel do Resend |
| `SUPABASE_URL` | Sim | — | URL do projeto Supabase que guarda o Consentimento_LGPD (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | — | Service role key do Supabase. Segredo **server-side**: ignora RLS, nunca vai para o navegador, nunca é versionada nem registrada em log |
| `TIMEOUT_ENVIO_EMAIL_MS` | Não | `10000` | Tempo limite do envio. Valor não numérico ou ≤ 0 cai no padrão, com aviso |
| `SUPABASE_TABELA_CONSENTIMENTOS` | Não | `consentimentos_lgpd` | Tabela do Consentimento_LGPD, criada por `supabase/consentimentos.sql` |

Uma variável definida como string vazia ou apenas espaços conta como **ausente** — mesmo critério usado na leitura em tempo de execução.

`EMAIL_REMETENTE` entra na lista de obrigatórias porque `src/notificacaoEmail.js` já a lê como obrigatória: sem ela, o primeiro visitante receberia `502 falha_envio`. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` entram pelo mesmo motivo em `src/registroConsentimento.js`: sem elas o visitante receberia `502 falha_registro`. As duas opcionais são as que os módulos já tratam com padrão (tabela de consentimentos e timeout de envio).

## Armazenamento do Consentimento_LGPD

Uma linha por consentimento na tabela `consentimentos_lgpd` do Supabase, gravada com `INSERT` via `@supabase/supabase-js`. O endpoint apenas insere: nunca lê, atualiza ou apaga.

Antes do primeiro deploy, rode `supabase/consentimentos.sql` no SQL Editor do projeto. O script cria a tabela e habilita RLS **sem nenhuma policy**, o que bloqueia leitura e escrita pelas chaves públicas (`anon`/`authenticated`); o endpoint acessa com a service role key, que roda como `service_role` e por definição ignora RLS.

Colunas: `data_hora`, `ip`, `nome`, `email`, `telefone`, `cpf` (snake_case no banco, mapeadas a partir dos campos `dataHora`, `ip`, `nome`, `email`, `telefone`, `cpf` do registro). Só `src/registroConsentimento.js` conhece esse mapeamento — o handler continua sem saber onde o consentimento é armazenado.

## Fail-fast de configuração

Configuração incompleta falha na inicialização, de forma decidível, nunca em silêncio (Design — Error Handling):

- `npm run verificar-config` — smoke test de deploy. Sai com código `1` e lista as variáveis ausentes; código `0` quando está tudo definido. Rode isso no pipeline de deploy antes de liberar tráfego.
- `import "./src/index.js"` — ponto de entrada de deploy. Chama `iniciar()` no carregamento do módulo (cold start) e lança `ErroDeConfiguracao` se faltar alguma obrigatória, antes de qualquer requisição ser atendida.

O log de inicialização é sempre emitido (sucesso, avisos ou falha) e contém apenas **nomes** de variáveis e o estado `definida`/`AUSENTE`. Nenhum valor é registrado.

`src/handler.js` continua sem depender da checagem: o contrato `(req, res)` permanece agnóstico de provedor (DD-01) e importá-lo em teste não exige ambiente configurado. Aponte o provedor de hospedagem para `src/index.js` quando quiser fail-fast no cold start, ou para `src/handler.js` quando o boot do provedor já rodar `verificar-config`.

## Módulos

| Arquivo | Papel |
|---|---|
| `src/handler.js` | Pipeline HTTP: validação → honeypot → registro do consentimento → envio do e-mail |
| `src/validacao.js` | Validação server-side do payload (CPF, telefone, obrigatoriedade, limites) |
| `src/registroConsentimento.js` | `INSERT` do Consentimento_LGPD na tabela do Supabase |
| `src/notificacaoEmail.js` | Composição e envio da Notificacao_por_Email via Resend |
| `src/config.js` | Verificação de configuração de ambiente (funções puras, sem efeito colateral) |
| `src/inicializacao.js` | `iniciar()` / smoke test executável da configuração |
| `src/index.js` | Ponto de entrada de deploy com fail-fast no cold start |

## Testes

```
npm test          # suíte completa (Vitest, execução única)
npm run test:prop # apenas testes de propriedade
```

Nenhum teste envia e-mail real, toca o banco ou depende de segredo: os SDKs do Resend e do Supabase são mockados e a checagem de configuração recebe o ambiente por parâmetro.
