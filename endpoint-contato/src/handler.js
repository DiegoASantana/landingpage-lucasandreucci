/**
 * Handler orquestrador do Endpoint_de_Envio (POST /api/contato).
 *
 * Implementado na task 9.1 (Design seccao Components item 3 e Error Handling;
 * Requisitos 2.4, 2.5, 3.2, 3.5, 3.7).
 *
 * Assinatura (req, res) deliberadamente agnostica de provedor (DD-01): e o
 * contrato comum de function serverless em Node e tambem o que `supertest`
 * exercita, sem prender o projeto a um provedor de hospedagem — a escolha do
 * provedor esta fora do escopo desta spec. Por isso tanto o corpo da requisicao
 * quanto a escrita da resposta sao tratados nos dois formatos possiveis: o
 * estilo Express/Vercel (`req.body` ja parseado, `res.status().json()`) e o
 * `http` puro do Node (corpo como stream, `res.writeHead()/res.end()`).
 *
 * Ordem fixa dos efeitos (DD-04):
 *   1. validar payload            — nenhum efeito colateral
 *   2. honeypot preenchido        — trata como payload invalido, sem diferenciar
 *   3. registrar consentimento    — ANTES do envio; falha aqui aborta o envio
 *   4. enviar notificacao         — falha aqui NAO desfaz o registro
 *
 * Respostas: 200 {ok:true} | 400 payload_invalido / consentimento_ausente |
 *            502 falha_registro / falha_envio
 *
 * Nenhum corpo de resposta expoe detalhe interno (mensagem de excecao, stack
 * trace, caminho de arquivo): apenas o codigo de erro estavel do contrato.
 */

import { validarPayloadContato } from "./validacao.js";
import { registrarConsentimentoLGPD } from "./registroConsentimento.js";
import { enviarNotificacaoEmail, montarNotificacaoEmail } from "./notificacaoEmail.js";

/** Valor gravado no registro quando o IP de origem nao pode ser determinado. */
const IP_DESCONHECIDO = "desconhecido";

/**
 * Limite de bytes lidos do corpo quando ele chega como stream. Acima disso a
 * requisicao e tratada como payload invalido, sem acumular memoria — o contrato
 * HTTP limita `mensagem` a 2000 caracteres, logo um corpo legitimo e muito
 * menor que este teto.
 */
const MAX_BYTES_CORPO = 64 * 1024;

/** Sentinela interna para "corpo ilegivel/nao-JSON" (Requisito 3.7). */
const CORPO_ILEGIVEL = Symbol("corpo_ilegivel");

/**
 * Escreve a resposta funcionando tanto com `res` estilo Express/Vercel quanto
 * com o `ServerResponse` puro do Node (DD-01).
 *
 * @param {import("node:http").ServerResponse & {
 *   status?: (codigo: number) => unknown, json?: (corpo: unknown) => unknown
 * }} res
 * @param {number} codigo
 * @param {Record<string, unknown>} corpo
 * @returns {void}
 */
function responder(res, codigo, corpo) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(codigo).json(corpo);
    return;
  }

  const conteudo = JSON.stringify(corpo);
  if (typeof res.writeHead === "function") {
    res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8" });
  } else {
    res.statusCode = codigo;
  }
  res.end(conteudo);
}

/**
 * Converte string/Buffer em objeto JSON. Devolve CORPO_ILEGIVEL quando o texto
 * nao e JSON valido — o handler traduz isso em 400 `payload_invalido`, sem
 * nenhum efeito colateral (Requisito 3.7).
 *
 * @param {string} texto
 * @returns {unknown}
 */
function interpretarJSON(texto) {
  if (texto.trim() === "") return CORPO_ILEGIVEL;
  try {
    return JSON.parse(texto);
  } catch {
    return CORPO_ILEGIVEL;
  }
}

/**
 * Le o corpo cru quando ele chega como stream (Node `http` puro, sem body
 * parser). Nunca lanca: erro de stream e corpo acima do limite viram
 * CORPO_ILEGIVEL.
 *
 * @param {import("node:http").IncomingMessage} req
 * @returns {Promise<unknown>}
 */
function lerCorpoDoStream(req) {
  return new Promise((resolve) => {
    let bruto = "";
    let bytes = 0;
    let encerrado = false;

    const encerrar = (valor) => {
      if (encerrado) return;
      encerrado = true;
      resolve(valor);
    };

    req.on("data", (parte) => {
      bytes += parte.length;
      if (bytes > MAX_BYTES_CORPO) {
        encerrar(CORPO_ILEGIVEL);
        if (typeof req.destroy === "function") req.destroy();
        return;
      }
      bruto += parte.toString("utf8");
    });
    req.on("end", () => encerrar(interpretarJSON(bruto)));
    req.on("error", () => encerrar(CORPO_ILEGIVEL));
    req.on("aborted", () => encerrar(CORPO_ILEGIVEL));
  });
}

/**
 * Resolve o corpo da requisicao como valor JavaScript, aceitando as tres formas
 * em que ele pode chegar dependendo do provedor: objeto ja parseado, texto/
 * Buffer com JSON, ou stream ainda nao lido.
 *
 * @param {import("node:http").IncomingMessage & { body?: unknown }} req
 * @returns {Promise<unknown>}
 */
async function resolverCorpo(req) {
  const corpo = req && req.body;

  if (typeof corpo === "string") return interpretarJSON(corpo);
  if (Buffer.isBuffer(corpo)) return interpretarJSON(corpo.toString("utf8"));
  if (corpo !== undefined && corpo !== null) return corpo;

  if (req && typeof req.on === "function") return lerCorpoDoStream(req);
  return CORPO_ILEGIVEL;
}

/**
 * Extrai o IP de origem da requisicao conforme visto pelo servidor.
 *
 * Tolera cabecalhos de proxy (`x-forwarded-for`, com lista de IPs separados por
 * virgula, onde o primeiro e o cliente original; `x-real-ip`) e cai para o
 * socket da conexao quando nenhum deles esta presente. Nunca lanca: sem
 * nenhuma fonte disponivel, devolve "desconhecido", para que a ausencia do IP
 * jamais impeca o registro do consentimento (Requisito 2.4).
 *
 * @param {import("node:http").IncomingMessage} req
 * @returns {string}
 */
export function obterIP(req) {
  const cabecalhos = (req && req.headers) || {};

  const encaminhado = cabecalhos["x-forwarded-for"];
  const listaEncaminhada = Array.isArray(encaminhado) ? encaminhado.join(",") : encaminhado;
  if (typeof listaEncaminhada === "string") {
    const primeiro = listaEncaminhada.split(",")[0].trim();
    if (primeiro !== "") return primeiro;
  }

  const real = cabecalhos["x-real-ip"];
  const ipReal = Array.isArray(real) ? real[0] : real;
  if (typeof ipReal === "string" && ipReal.trim() !== "") return ipReal.trim();

  const socket = (req && (req.socket || req.connection)) || {};
  if (typeof socket.remoteAddress === "string" && socket.remoteAddress.trim() !== "") {
    return socket.remoteAddress.trim();
  }

  return IP_DESCONHECIDO;
}

/**
 * Registra em log de servidor o motivo tecnico de uma falha, para que ela seja
 * diagnosticavel sem nunca ser devolvida ao Visitante (secao Error Handling).
 *
 * @param {string} etapa
 * @param {unknown} erro
 * @returns {void}
 */
function registrarFalha(etapa, erro) {
  const detalhe = erro instanceof Error ? erro.message : String(erro);
  console.error(`[endpoint-contato] falha em ${etapa}: ${detalhe}`);
}

/**
 * Pipeline do Endpoint_de_Envio.
 *
 * @param {import("node:http").IncomingMessage & { body?: unknown }} req
 * @param {import("node:http").ServerResponse} res
 * @returns {Promise<void>}
 */
export async function handler(req, res) {
  // 1) Validacao de forma e conteudo — Req 3.7. Nenhum efeito colateral ate aqui.
  const corpo = await resolverCorpo(req);
  if (corpo === CORPO_ILEGIVEL) {
    return responder(res, 400, { ok: false, erro: "payload_invalido" });
  }

  const validacao = validarPayloadContato(corpo);
  if (!validacao.ok) {
    return responder(res, 400, { ok: false, erro: validacao.erro });
  }
  const dados = validacao.dados;

  // 2) Honeypot preenchido => mesma resposta generica de payload invalido, sem
  //    diferenciar (DD-08): nao dar dica a quem esta calibrando o bot.
  if (dados._hp !== "") {
    return responder(res, 400, { ok: false, erro: "payload_invalido" });
  }

  // 3) Registro do consentimento ANTES do envio — Req 2.4, DD-04.
  try {
    await registrarConsentimentoLGPD({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      cpf: dados.cpf,
      ip: obterIP(req),
      dataHora: new Date().toISOString()
    });
  } catch (e) {
    registrarFalha("registro do Consentimento_LGPD", e);
    // Req 2.5 — o e-mail NAO e enviado quando o registro falha.
    return responder(res, 502, { ok: false, erro: "falha_registro" });
  }

  // 4) Envio da notificacao — Req 3.2. Falha aqui NAO desfaz o registro do
  //    passo 3 (Req 3.5, DD-04): nao existe rollback nesta funcao.
  try {
    await enviarNotificacaoEmail(montarNotificacaoEmail(dados));
  } catch (e) {
    registrarFalha("envio da Notificacao_por_Email", e);
    return responder(res, 502, { ok: false, erro: "falha_envio" });
  }

  return responder(res, 200, { ok: true });
}

export default handler;
