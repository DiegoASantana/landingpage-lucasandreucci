/**
 * Testes unitarios do handler orquestrador do Endpoint_de_Envio (task 9.1).
 *
 * Requisitos 2.4, 2.5, 3.2, 3.5, 3.7; Design seccao Components item 3 e
 * Error Handling.
 *
 * Efeitos externos mockados: o registro do Consentimento_LGPD (nenhuma escrita
 * em disco) e o SDK do Resend (nenhuma chamada de rede). A composicao da
 * notificacao roda de verdade, para que a ordem dos efeitos seja exercitada
 * exatamente como em producao.
 */
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registrarMock = vi.fn();
const enviarResendMock = vi.fn();

vi.mock("../src/registroConsentimento.js", () => ({
  registrarConsentimentoLGPD: (...args) => registrarMock(...args)
}));

vi.mock("resend", () => ({
  Resend: class ResendFalso {
    constructor(chave) {
      ResendFalso.ultimaChave = chave;
      this.emails = { send: enviarResendMock };
    }
  }
}));

const { handler, obterIP } = await import("../src/handler.js");

const PAYLOAD_VALIDO = Object.freeze({
  nome: "Maria Souza",
  email: "maria@example.com",
  telefone: "11987654321",
  cpf: "52998224725",
  mensagem: "Preciso de orientação sobre um contrato.",
  consentimentoLGPD: true,
  _hp: ""
});

const ENV_ORIGINAL = { ...process.env };

/** `res` estilo Express/Vercel, que registra o que foi respondido. */
function criarRes() {
  return {
    codigo: undefined,
    corpo: undefined,
    status(codigo) {
      this.codigo = codigo;
      return this;
    },
    json(corpo) {
      this.corpo = corpo;
      return this;
    }
  };
}

/** `req` com corpo ja parseado pelo provedor. */
function criarReq(body, cabecalhos = {}) {
  return { method: "POST", headers: cabecalhos, body, socket: { remoteAddress: "203.0.113.9" } };
}

beforeEach(() => {
  registrarMock.mockReset();
  registrarMock.mockResolvedValue(true);
  enviarResendMock.mockReset();
  enviarResendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });

  process.env.EMAIL_REMETENTE = "contato@dominioverificado.com.br";
  process.env.EMAIL_DESTINO_DR_LUCAS = "lucas@escritorio.com.br";
  process.env.RESEND_API_KEY = "re_chave_de_teste";
  delete process.env.TIMEOUT_ENVIO_EMAIL_MS;

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ENV_ORIGINAL };
});

describe("caminho de sucesso", () => {
  it("registra o consentimento antes de enviar e responde 200 (Req 2.4, 3.2)", async () => {
    const ordem = [];
    registrarMock.mockImplementation(async () => {
      ordem.push("registro");
      return true;
    });
    enviarResendMock.mockImplementation(async () => {
      ordem.push("envio");
      return { data: { id: "email_1" }, error: null };
    });

    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO }), res);

    expect(res.codigo).toBe(200);
    expect(res.corpo).toEqual({ ok: true });
    expect(ordem).toEqual(["registro", "envio"]);
  });

  it("grava no registro os dados normalizados, o IP e a data/hora (Req 2.4)", async () => {
    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO }, { "x-forwarded-for": "198.51.100.7, 10.0.0.1" }), res);

    expect(res.codigo).toBe(200);
    expect(registrarMock).toHaveBeenCalledTimes(1);
    const registro = registrarMock.mock.calls[0][0];
    expect(registro).toMatchObject({
      nome: "Maria Souza",
      email: "maria@example.com",
      telefone: "11987654321",
      cpf: "52998224725",
      ip: "198.51.100.7"
    });
    expect(new Date(registro.dataHora).toISOString()).toBe(registro.dataHora);
  });

  it("envia a notificacao com os dados do payload (Req 3.1, 3.2)", async () => {
    await handler(criarReq({ ...PAYLOAD_VALIDO }), criarRes());

    expect(enviarResendMock).toHaveBeenCalledTimes(1);
    const notificacao = enviarResendMock.mock.calls[0][0];
    expect(notificacao.to).toBe("lucas@escritorio.com.br");
    expect(notificacao.replyTo).toBe("maria@example.com");
    expect(notificacao.text).toContain("(11) 98765-4321");
    expect(notificacao.text).toContain("529.982.247-25");
  });

  it("aceita corpo cru em stream, sem body parser (Node http puro)", async () => {
    const req = Readable.from([JSON.stringify(PAYLOAD_VALIDO)]);
    req.method = "POST";
    req.headers = {};

    const res = criarRes();
    await handler(req, res);

    expect(res.codigo).toBe(200);
    expect(registrarMock).toHaveBeenCalledTimes(1);
  });
});

describe("rejeicoes sem efeito colateral (Req 3.7)", () => {
  it("responde 400 payload_invalido para corpo que nao e JSON valido", async () => {
    const res = criarRes();
    await handler(criarReq("{nome: sem aspas"), res);

    expect(res.codigo).toBe(400);
    expect(res.corpo).toEqual({ ok: false, erro: "payload_invalido" });
    expect(registrarMock).not.toHaveBeenCalled();
    expect(enviarResendMock).not.toHaveBeenCalled();
  });

  it("responde 400 payload_invalido para corpo ausente", async () => {
    const res = criarRes();
    await handler({ method: "POST", headers: {} }, res);

    expect(res.codigo).toBe(400);
    expect(res.corpo).toEqual({ ok: false, erro: "payload_invalido" });
    expect(registrarMock).not.toHaveBeenCalled();
    expect(enviarResendMock).not.toHaveBeenCalled();
  });

  it("responde 400 payload_invalido para CPF com digito verificador invalido", async () => {
    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO, cpf: "52998224726" }), res);

    expect(res.codigo).toBe(400);
    expect(res.corpo).toEqual({ ok: false, erro: "payload_invalido" });
    expect(registrarMock).not.toHaveBeenCalled();
    expect(enviarResendMock).not.toHaveBeenCalled();
  });

  it("responde 400 consentimento_ausente quando o consentimento nao vem marcado", async () => {
    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO, consentimentoLGPD: false }), res);

    expect(res.codigo).toBe(400);
    expect(res.corpo).toEqual({ ok: false, erro: "consentimento_ausente" });
    expect(registrarMock).not.toHaveBeenCalled();
    expect(enviarResendMock).not.toHaveBeenCalled();
  });

  it("trata honeypot preenchido como payload invalido, sem diferenciar (DD-08)", async () => {
    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO, _hp: "sou-um-bot" }), res);

    expect(res.codigo).toBe(400);
    expect(res.corpo).toEqual({ ok: false, erro: "payload_invalido" });
    expect(registrarMock).not.toHaveBeenCalled();
    expect(enviarResendMock).not.toHaveBeenCalled();
  });
});

describe("falhas de efeito colateral (Req 2.5, 3.5)", () => {
  it("responde 502 falha_registro e nao envia e-mail quando o registro falha (Req 2.5)", async () => {
    registrarMock.mockRejectedValue(new Error("EACCES: /var/dados/consentimentos.jsonl"));

    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO }), res);

    expect(res.codigo).toBe(502);
    expect(res.corpo).toEqual({ ok: false, erro: "falha_registro" });
    expect(enviarResendMock).not.toHaveBeenCalled();
  });

  it("responde 502 falha_envio mantendo o registro ja feito (Req 3.5)", async () => {
    enviarResendMock.mockResolvedValue({
      data: null,
      error: { name: "application_error", message: "dominio nao verificado" }
    });

    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO }), res);

    expect(res.codigo).toBe(502);
    expect(res.corpo).toEqual({ ok: false, erro: "falha_envio" });
    expect(registrarMock).toHaveBeenCalledTimes(1); // registro feito e nunca desfeito
  });

  it("nao expoe detalhe interno no corpo de erro", async () => {
    registrarMock.mockRejectedValue(new Error("EACCES: /var/dados/consentimentos.jsonl"));

    const res = criarRes();
    await handler(criarReq({ ...PAYLOAD_VALIDO }), res);

    expect(Object.keys(res.corpo).sort()).toEqual(["erro", "ok"]);
    expect(JSON.stringify(res.corpo)).not.toContain("/var/dados");
  });
});

describe("obterIP", () => {
  it("usa o primeiro IP de x-forwarded-for", () => {
    expect(obterIP({ headers: { "x-forwarded-for": " 198.51.100.7 , 10.0.0.1 " } })).toBe(
      "198.51.100.7"
    );
  });

  it("cai para x-real-ip quando x-forwarded-for nao existe", () => {
    expect(obterIP({ headers: { "x-real-ip": "198.51.100.8" } })).toBe("198.51.100.8");
  });

  it("cai para o socket quando nao ha cabecalho de proxy", () => {
    expect(obterIP({ headers: {}, socket: { remoteAddress: "203.0.113.9" } })).toBe(
      "203.0.113.9"
    );
  });

  it("nao quebra sem cabecalhos nem socket", () => {
    expect(obterIP({})).toBe("desconhecido");
    expect(obterIP(undefined)).toBe("desconhecido");
  });
});
