/**
 * Registro do Consentimento_LGPD em tabela do Supabase (Postgres).
 *
 * Substitui o arquivo JSONL append-only usado antes (DD-03): em execucao
 * serverless nao existe disco persistente entre invocacoes, e o registro do
 * consentimento e prova legal que nao pode desaparecer com o container.
 * Cada chamada faz um INSERT — uma linha por consentimento, nada e lido,
 * atualizado ou apagado por este modulo.
 *
 * O contrato publico continua o mesmo (Requisito 2.4; Design Components item 4):
 * `registrarConsentimentoLGPD(registro)` resolve `true` em sucesso e LANCA em
 * falha, que o handler traduz em 502 `falha_registro` sem enviar o e-mail
 * (Requisito 2.5, DD-04). Nenhum outro modulo sabe onde o consentimento e
 * armazenado.
 *
 * Configuracao vem exclusivamente de process.env (DD-05) e e lida SEMPRE dentro
 * das funcoes, nunca no corpo do modulo: importar este arquivo nao depende de
 * ambiente configurado (o mesmo criterio de notificacaoEmail.js).
 *
 * SEGURANCA: SUPABASE_SERVICE_ROLE_KEY ignora as policies de RLS da tabela e
 * por isso existe SOMENTE como variavel de ambiente do processo server-side.
 * Jamais pode ser embutida em HTML/JS servido ao navegador, versionada ou
 * registrada em log — nem mesmo em mensagem de erro.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Tabela usada quando SUPABASE_TABELA_CONSENTIMENTOS nao esta definida.
 * Mesmo nome criado por supabase/consentimentos.sql.
 */
const TABELA_PADRAO = "consentimentos_lgpd";

/**
 * @typedef {Object} RegistroConsentimento
 * @property {string} dataHora   ISO 8601, UTC
 * @property {string} ip         IP de origem, conforme visto pelo servidor
 * @property {string} nome
 * @property {string} email
 * @property {string} telefone
 * @property {string} cpf
 */

/**
 * Le uma variavel de ambiente obrigatoria no momento do uso (nunca no import).
 * A mensagem cita apenas o NOME da variavel — nunca o valor, que pode ser
 * segredo.
 *
 * @param {string} nome
 * @returns {string}
 */
function lerEnvObrigatoria(nome) {
  const valor = process.env[nome];
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new Error(`Variavel de ambiente ausente ou vazia: ${nome}`);
  }
  return valor.trim();
}

/**
 * Nome da tabela de consentimentos, resolvido a cada chamada — para que a
 * configuracao do ambiente valha sem novo deploy de codigo.
 *
 * @returns {string}
 */
export function tabelaConsentimentos() {
  const configurado = process.env.SUPABASE_TABELA_CONSENTIMENTOS;
  return typeof configurado === "string" && configurado.trim() !== ""
    ? configurado.trim()
    : TABELA_PADRAO;
}

/**
 * Cria o cliente do Supabase para uso server-side, com a service role key.
 *
 * Sem sessao e sem refresh de token: nao existe usuario autenticado aqui, e
 * persistir sessao em ambiente serverless nao faz sentido.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function criarClienteSupabase() {
  const url = lerEnvObrigatoria("SUPABASE_URL");
  const chaveServico = lerEnvObrigatoria("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Monta a linha a ser inserida, com as colunas na ordem fixada pelo design
 * (dataHora, ip, nome, email, telefone, cpf). Os nomes de coluna seguem a
 * convencao do Postgres (snake_case), conforme supabase/consentimentos.sql.
 *
 * @param {RegistroConsentimento} registro
 * @returns {Record<string, string>}
 */
export function montarLinhaConsentimento(registro) {
  return {
    data_hora: registro.dataHora,
    ip: registro.ip,
    nome: registro.nome,
    email: registro.email,
    telefone: registro.telefone,
    cpf: registro.cpf
  };
}

/**
 * Insere exatamente uma linha de Consentimento_LGPD na tabela do Supabase.
 *
 * Rejeita (throw) quando a variavel de ambiente falta, quando o cliente lanca
 * (rede, DNS, timeout) e tambem quando o cliente devolve `{ error }` em vez de
 * lancar — o handler precisa de um unico caminho de falha (mesmo tratamento
 * dado ao SDK do Resend em notificacaoEmail.js).
 *
 * A escrita usa a API do cliente (query parametrizada no servidor do Supabase),
 * nunca concatenacao de SQL.
 *
 * @param {RegistroConsentimento} registro
 * @returns {Promise<true>}
 */
export async function registrarConsentimentoLGPD(registro) {
  const cliente = criarClienteSupabase();

  const { error } = await cliente
    .from(tabelaConsentimentos())
    .insert(montarLinhaConsentimento(registro));

  if (error) {
    const detalhe = error.message || error.code || String(error);
    throw new Error(`Supabase recusou o registro do Consentimento_LGPD: ${detalhe}`);
  }

  return true;
}
