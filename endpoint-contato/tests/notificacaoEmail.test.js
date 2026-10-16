/**
 * Testes unitarios da composicao e do envio da Notificacao_por_Email (task 8.1).
 *
 * Requisitos 3.1, 3.2, 3.6; Design seccao Components item 3 e Error Handling.
 * O SDK do Resend e mockado — nenhum e-mail real e enviado, nenhuma chamada de
 * rede acontece.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const enviarMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class ResendFalso {
    constructor(chave) {
      ResendFalso.ultimaChave = chave;
      this.emails = { send: enviarMock };
    }
  }
}));

const {
  formatarCpfExibicao,
  formatarTelefoneExibicao,
  montarNotificacaoEmail,
  enviarNotificacaoEmail
} = await import("../src/notificacaoEmail.js");

const { Resend } = await import("resend");

const DADOS = {
  nome: "Maria Souza",
  email: "maria@example.com",
  telefone: "11987654321",
  cpf: "52998224725",
  mensagem: "Preciso de orientação sobre um contrato.",
  consentimentoLGPD: true,
  _hp: ""
};

const ENV_ORIGINAL = { ...process.env };

beforeEach(() => {
  enviarMock.mockReset();
  process.env.EMAIL_REMETENTE = "contato@dominioverificado.com.br";
  process.env.EMAIL_DESTINO_DR_LUCAS = "lucas@escritorio.com.br";
  process.env.RESEND_API_KEY = "re_chave_de_teste";
  delete process.env.TIMEOUT_ENVIO_EMAIL_MS;
});

afterEach(() => {
  vi.useRealTimers();
  process.env = { ...ENV_ORIGINAL };
});

describe("formatarTelefoneExibicao", () => {
  it("formata celular de 11 digitos", () => {
    expect(formatarTelefoneExibicao("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata fixo de 10 digitos", () => {
    expect(formatarTelefoneExibicao("1132654321")).toBe("(11) 3265-4321");
  });

  it("devolve apenas os digitos quando o comprimento nao e 10 nem 11", () => {
    expect(formatarTelefoneExibicao("123")).toBe("123");
    expect(formatarTelefoneExibicao("")).toBe("");
  });
});

describe("formatarCpfExibicao", () => {
  it("formata CPF de 11 digitos", () => {
    expect(formatarCpfExibicao("52998224725")).toBe("529.982.247-25");
  });

  it("devolve apenas os digitos quando o comprimento nao e 11", () => {
    expect(formatarCpfExibicao("529982")).toBe("529982");
  });
});

describe("montarNotificacaoEmail", () => {
  it("monta from, to, replyTo, subject e text conforme o design (Req 3.1)", () => {
    const notificacao = montarNotificacaoEmail(DADOS);

    expect(notificacao.from).toBe(
      "Site Dr. Lucas Andreucci <contato@dominioverificado.com.br>"
    );
    expect(notificacao.to).toBe("lucas@escritorio.com.br");
    expect(notificacao.replyTo).toBe("maria@example.com");
    expect(notificacao.subject).toBe("Novo contato pelo site — Maria Souza");
    expect(notificacao.text).toBe(
      "Nome: Maria Souza\n" +
        "E-mail: maria@example.com\n" +
        "Telefone: (11) 98765-4321\n" +
        "CPF: 529.982.247-25\n\n" +
        "Mensagem:\nPreciso de orientação sobre um contrato."
    );
  });

  it("usa EMAIL_REMETENTE como esta quando ja traz nome amigavel", () => {
    process.env.EMAIL_REMETENTE = "Contato <contato@dominioverificado.com.br>";
    expect(montarNotificacaoEmail(DADOS).from).toBe(
      "Contato <contato@dominioverificado.com.br>"
    );
  });

  it("marca a mensagem como nao informada quando ela vem vazia", () => {
    const notificacao = montarNotificacaoEmail({ ...DADOS, mensagem: "" });
    expect(notificacao.text).toContain("Mensagem:\n(não informada)");
  });

  it("le o destino de process.env e falha de forma decidivel se estiver ausente (Req 3.6)", () => {
    delete process.env.EMAIL_DESTINO_DR_LUCAS;
    expect(() => montarNotificacaoEmail(DADOS)).toThrow(/EMAIL_DESTINO_DR_LUCAS/);
  });
});

describe("enviarNotificacaoEmail", () => {
  it("envia pelo Resend com a chave lida de process.env (Req 3.2, 3.6)", async () => {
    enviarMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
    const notificacao = montarNotificacaoEmail(DADOS);

    await expect(enviarNotificacaoEmail(notificacao)).resolves.toBeUndefined();

    expect(enviarMock).toHaveBeenCalledTimes(1);
    expect(enviarMock).toHaveBeenCalledWith(notificacao);
    expect(Resend.ultimaChave).toBe("re_chave_de_teste");
  });

  it("converte o objeto de erro do SDK em excecao (Req 3.4)", async () => {
    enviarMock.mockResolvedValue({
      data: null,
      error: { name: "application_error", message: "dominio nao verificado" }
    });

    await expect(enviarNotificacaoEmail(montarNotificacaoEmail(DADOS))).rejects.toThrow(
      /dominio nao verificado/
    );
  });

  it("propaga excecao lancada pelo SDK", async () => {
    enviarMock.mockRejectedValue(new Error("ECONNRESET"));

    await expect(enviarNotificacaoEmail(montarNotificacaoEmail(DADOS))).rejects.toThrow(
      /ECONNRESET/
    );
  });

  it("rejeita quando o provedor nao responde dentro do tempo limite (Req 3.4)", async () => {
    process.env.TIMEOUT_ENVIO_EMAIL_MS = "50";
    enviarMock.mockImplementation(() => new Promise(() => {}));

    await expect(enviarNotificacaoEmail(montarNotificacaoEmail(DADOS))).rejects.toThrow(
      /Timeout de 50ms/
    );
  });

  it("falha de forma decidivel quando RESEND_API_KEY esta ausente, sem chamar o SDK", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(enviarNotificacaoEmail(montarNotificacaoEmail(DADOS))).rejects.toThrow(
      /RESEND_API_KEY/
    );
    expect(enviarMock).not.toHaveBeenCalled();
  });
});
