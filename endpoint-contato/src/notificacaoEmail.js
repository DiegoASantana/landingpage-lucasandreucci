/**
 * Composicao e envio da Notificacao_por_Email via Provedor_de_Envio (Resend).
 *
 * Implementado na task 8.1 (Design seccao Components item 3; Requisitos 3.1,
 * 3.2, 3.6).
 *
 * Configuracao vem exclusivamente de process.env (DD-05): a chave de API nunca
 * e hardcoded em codigo versionado nem exposta em arquivo servido ao navegador.
 * A leitura do ambiente e sempre feita dentro das funcoes (lazy), nunca no
 * corpo do modulo — importar este arquivo nao depende de ambiente configurado.
 * A checagem fail-fast de RESEND_API_KEY na inicializacao e a task 10.1.
 */
import { Resend } from "resend";

/** Nome amigavel do remetente; o endereco vem de EMAIL_REMETENTE. */
const NOME_REMETENTE = "Site Dr. Lucas Andreucci";

/** Tempo limite padrao do envio, em ms, quando TIMEOUT_ENVIO_EMAIL_MS nao esta definido. */
const TIMEOUT_ENVIO_PADRAO_MS = 10000;

/**
 * @typedef {Object} NotificacaoEmail
 * @property {string} from
 * @property {string} to
 * @property {string} replyTo
 * @property {string} subject
 * @property {string} text
 */

/**
 * Le uma variavel de ambiente obrigatoria no momento do uso (nunca no import).
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
 * Remove tudo que nao for digito. Reimplementada aqui para manter este modulo
 * independente de validacao.js (que valida payload, nao formata exibicao).
 * @param {unknown} valor
 * @returns {string}
 */
function apenasDigitos(valor) {
  return (valor == null ? "" : String(valor)).replace(/\D/g, "");
}

/**
 * Formata telefone (10 ou 11 digitos) para leitura humana no corpo do e-mail.
 * Mesmo formato do `Masks.telefone` do site: (XX) XXXXX-XXXX / (XX) XXXX-XXXX.
 * Fora de 10/11 digitos, devolve os digitos sem formatacao — a funcao e total
 * e nunca perde informacao (Property 10).
 * @param {string} telefone
 * @returns {string}
 */
export function formatarTelefoneExibicao(telefone) {
  const d = apenasDigitos(telefone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

/**
 * Formata CPF (11 digitos) para leitura humana no corpo do e-mail:
 * XXX.XXX.XXX-XX. Fora de 11 digitos, devolve os digitos sem formatacao.
 * @param {string} cpf
 * @returns {string}
 */
export function formatarCpfExibicao(cpf) {
  const d = apenasDigitos(cpf);
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Monta o campo `from` a partir de EMAIL_REMETENTE. O endereco precisa usar um
 * dominio verificado no painel do Resend (pre-requisito de configuracao, fora
 * do codigo). Se EMAIL_REMETENTE ja vier no formato "Nome <a@b.com>", e usado
 * como esta; caso contrario recebe o nome amigavel do escritorio.
 * @returns {string}
 */
function montarRemetente() {
  const remetente = lerEnvObrigatoria("EMAIL_REMETENTE");
  if (remetente.includes("<")) return remetente;
  return `${NOME_REMETENTE} <${remetente}>`;
}

/**
 * Monta a Notificacao_por_Email a partir do payload validado. Funcao pura em
 * relacao aos dados; le apenas configuracao de process.env.
 *
 * @param {import("./validacao.js").PayloadContato} dados
 * @returns {NotificacaoEmail}
 */
export function montarNotificacaoEmail(dados) {
  return {
    from: montarRemetente(),
    to: lerEnvObrigatoria("EMAIL_DESTINO_DR_LUCAS"),
    replyTo: dados.email,
    subject: `Novo contato pelo site — ${dados.nome}`,
    text:
      `Nome: ${dados.nome}\n` +
      `E-mail: ${dados.email}\n` +
      `Telefone: ${formatarTelefoneExibicao(dados.telefone)}\n` +
      `CPF: ${formatarCpfExibicao(dados.cpf)}\n\n` +
      `Mensagem:\n${dados.mensagem || "(não informada)"}`
  };
}

/**
 * Tempo limite de envio configurado, em ms.
 * @returns {number}
 */
function lerTimeoutEnvioMs() {
  const bruto = process.env.TIMEOUT_ENVIO_EMAIL_MS;
  const valor = Number.parseInt(bruto ?? "", 10);
  return Number.isFinite(valor) && valor > 0 ? valor : TIMEOUT_ENVIO_PADRAO_MS;
}

/**
 * Envia a notificacao pelo Provedor_de_Envio. Rejeita (throw) em erro ou
 * timeout — o handler traduz isso em 502 `falha_envio`, sem desfazer o
 * registro de consentimento ja gravado (Requisito 3.5, DD-04).
 *
 * O SDK do Resend devolve `{ data, error }` em vez de lancar quando a API
 * responde erro; esse `error` e convertido em excecao aqui, para que o handler
 * tenha um unico caminho de falha.
 *
 * @param {NotificacaoEmail} notificacao
 * @returns {Promise<void>}
 */
export async function enviarNotificacaoEmail(notificacao) {
  const resend = new Resend(lerEnvObrigatoria("RESEND_API_KEY"));
  const timeoutMs = lerTimeoutEnvioMs();

  let timer;
  const expiracao = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timeout de ${timeoutMs}ms no envio da Notificacao_por_Email`)),
      timeoutMs
    );
  });

  try {
    const resultado = await Promise.race([resend.emails.send(notificacao), expiracao]);
    const erro = resultado && resultado.error;
    if (erro) {
      const detalhe = erro.message || erro.name || String(erro);
      throw new Error(`Provedor_de_Envio recusou a Notificacao_por_Email: ${detalhe}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
