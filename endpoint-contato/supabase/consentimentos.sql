-- Tabela do Consentimento_LGPD (Requisito 2.4).
-- Rode este script no SQL Editor do projeto Supabase antes do primeiro deploy.
--
-- Uma linha por consentimento coletado no formulario publico. O endpoint apenas
-- INSERE (src/registroConsentimento.js); nao le, nao atualiza e nao apaga.

create table if not exists public.consentimentos_lgpd (
  id         bigint generated always as identity primary key,
  data_hora  timestamptz not null,               -- ISO 8601 enviado pelo endpoint
  ip         text        not null,               -- IP de origem ou "desconhecido"
  nome       text        not null,
  email      text        not null,
  telefone   text        not null,               -- somente digitos
  cpf        text        not null,               -- somente digitos
  criado_em  timestamptz not null default now()  -- carimbo do proprio banco
);

-- Consulta tipica (auditoria/LGPD): consentimentos mais recentes primeiro.
create index if not exists consentimentos_lgpd_data_hora_idx
  on public.consentimentos_lgpd (data_hora desc);

-- RLS habilitada e NENHUMA policy criada: com RLS ligada e sem policy, os
-- papeis `anon` e `authenticated` (as chaves publicas, que podem aparecer no
-- navegador) nao conseguem ler nem escrever nada nesta tabela.
--
-- O acesso do endpoint e feito no servidor com a SUPABASE_SERVICE_ROLE_KEY, que
-- usa o papel `service_role` e por definicao ignora RLS. Essa chave existe
-- apenas como variavel de ambiente do processo server-side — nunca em codigo
-- versionado, nunca em arquivo servido ao navegador.
alter table public.consentimentos_lgpd enable row level security;

-- Dados pessoais (nome, e-mail, telefone, CPF, IP): qualquer acesso adicional
-- (ex.: painel de auditoria) precisa de policy explicita, criada em task propria
-- e aprovada pelo Arquiteto — nao adicione policy permissiva aqui.
