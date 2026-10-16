/**
 * Verificacao de configuracao de ambiente do Endpoint_de_Envio (fail-fast).
 *
 * Implementado na task 10.1 (Requisito 3.6; Design seccao Components item 3 —
 * DD-05 — e Error Handling: "RESEND_API_KEY ausente na configuracao do ambiente
 * => falha de inicializacao do servico, detectavel em deploy/smoke test").
 *
 * Toda a configuracao vem exclusivamente de process.env (DD-05): nenhum valor
 * e hardcoded em codigo versionado nem exposto em arquivo servido ao navegador.
 * Este modulo nao le process.env no corpo do arquivo — o ambiente e recebido por
 * parametro (com process.env como padrao), o que mantem as funcoes puras e o
 * import livre de efeito colateral.
 *
 * Nenhuma funcao daqui devolve ou registra o *valor* de uma variavel: o
 * relatorio fala apenas de nomes e do estado "definida"/"ausente", para que um
 * log de deploy nunca vaze a RESEND_API_KEY.
 *
 * Politica (consistente com o que os modulos ja implementados exigem em tempo
 * de execucao):
 *   - Obrigatorias, sem padrao possivel: RESEND_API_KEY, EMAIL_DESTINO_DR_LUCAS
 *     e EMAIL_REMETENTE (lidas por `lerEnvObrigatoria` em notificacaoEmail.js),
 *     mais SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (lidas do mesmo jeito em
 *     registroConsentimento.js). Todas lancam quando faltam: sem as de e-mail a
 *     primeira submissao viraria 502 `falha_envio`; sem as do Supabase viraria
 *     502 `falha_registro`. A checagem aqui antecipa essa falha para o deploy.
 *   - Opcionais, com padrao documentado: SUPABASE_TABELA_CONSENTIMENTOS
 *     (registroConsentimento.js cai para "consentimentos_lgpd") e
 *     TIMEOUT_ENVIO_EMAIL_MS (notificacaoEmail.js cai para 10000 ms). Ausencia
 *     nao impede a inicializacao, mas gera aviso explicito — nunca silencio.
 */

/**
 * Variaveis sem as quais o servico nao pode funcionar. A ordem e a usada no
 * relatorio de inicializacao.
 * @type {readonly string[]}
 */
export const VARIAVEIS_OBRIGATORIAS = Object.freeze([
  "RESEND_API_KEY",
  "EMAIL_DESTINO_DR_LUCAS",
  "EMAIL_REMETENTE",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
]);

/**
 * Variaveis opcionais e o padrao aplicado quando ausentes.
 * @type {readonly {nome: string, padrao: string}[]}
 */
export const VARIAVEIS_OPCIONAIS = Object.freeze([
  Object.freeze({ nome: "SUPABASE_TABELA_CONSENTIMENTOS", padrao: "consentimentos_lgpd" }),
  Object.freeze({ nome: "TIMEOUT_ENVIO_EMAIL_MS", padrao: "10000" })
]);

/**
 * Variaveis cujo valor e segredo e por isso nunca aparece em log ou relatorio.
 * @type {readonly string[]}
 */
export const VARIAVEIS_SECRETAS = Object.freeze([
  "RESEND_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
]);

/**
 * @typedef {Object} ResultadoConfiguracao
 * @property {boolean} ok        true quando nenhuma obrigatoria esta ausente
 * @property {string[]} ausentes nomes das obrigatorias ausentes ou em branco
 * @property {string[]} avisos   pontos de atencao que nao impedem a inicializacao
 */

/**
 * Uma variavel de ambiente conta como definida somente se for string com algum
 * caractere nao-branco. Mesmo critério do `lerEnvObrigatoria` de
 * notificacaoEmail.js: `RESEND_API_KEY=""` ou `RESEND_API_KEY="   "` sao
 * ausencia, nao configuracao.
 *
 * @param {unknown} valor
 * @returns {boolean}
 */
export function estaDefinida(valor) {
  return typeof valor === "string" && valor.trim() !== "";
}

/**
 * Verifica a configuracao do ambiente sem lancar. Funcao total: qualquer objeto
 * de ambiente produz um resultado decidivel.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {ResultadoConfiguracao}
 */
export function verificarConfiguracao(env = process.env) {
  const ambiente = env || {};

  const ausentes = VARIAVEIS_OBRIGATORIAS.filter((nome) => !estaDefinida(ambiente[nome]));

  const avisos = [];
  for (const { nome, padrao } of VARIAVEIS_OPCIONAIS) {
    if (!estaDefinida(ambiente[nome])) {
      avisos.push(`${nome} nao definida — usando o padrao (${padrao})`);
    }
  }

  const timeout = ambiente.TIMEOUT_ENVIO_EMAIL_MS;
  if (estaDefinida(timeout)) {
    const numero = Number.parseInt(timeout, 10);
    if (!Number.isFinite(numero) || numero <= 0) {
      avisos.push(
        `TIMEOUT_ENVIO_EMAIL_MS nao e um numero de milissegundos positivo — usando o padrao (${VARIAVEIS_OPCIONAIS[1].padrao})`
      );
    }
  }

  return { ok: ausentes.length === 0, ausentes, avisos };
}

/** Erro de configuracao de ambiente: identifica exatamente o que falta. */
export class ErroDeConfiguracao extends Error {
  /**
   * @param {string[]} ausentes
   */
  constructor(ausentes) {
    super(
      "Configuracao de ambiente incompleta no Endpoint_de_Envio. " +
        `Variaveis obrigatorias ausentes: ${ausentes.join(", ")}. ` +
        "Defina-as no ambiente do servidor (ver .env.example) — nunca em codigo versionado."
    );
    this.name = "ErroDeConfiguracao";
    /** @type {string[]} */
    this.ausentes = [...ausentes];
  }
}

/**
 * Igual a `verificarConfiguracao`, mas lanca `ErroDeConfiguracao` quando falta
 * alguma variavel obrigatoria. E a forma decidivel de falhar exigida pelo
 * design: o processo nao segue adiante mal configurado, e o motivo aparece com
 * nome de variavel — nunca com valor.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {ResultadoConfiguracao}
 */
export function exigirConfiguracaoValida(env = process.env) {
  const resultado = verificarConfiguracao(env);
  if (!resultado.ok) throw new ErroDeConfiguracao(resultado.ausentes);
  return resultado;
}

/**
 * Monta as linhas do relatorio de configuracao. Contem apenas nomes de
 * variaveis e o estado "definida"/"AUSENTE" — jamais um valor, secreto ou nao.
 *
 * @param {ResultadoConfiguracao} resultado
 * @param {Record<string, string | undefined>} [env]
 * @returns {string[]}
 */
export function relatorioConfiguracao(resultado, env = process.env) {
  const ambiente = env || {};
  const linhas = VARIAVEIS_OBRIGATORIAS.map((nome) => {
    const estado = estaDefinida(ambiente[nome]) ? "definida" : "AUSENTE";
    const marca = VARIAVEIS_SECRETAS.includes(nome) ? " (segredo, valor nao registrado)" : "";
    return `${nome}: ${estado}${marca}`;
  });

  return [...linhas, ...resultado.avisos];
}
