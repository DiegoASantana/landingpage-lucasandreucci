/**
 * Smoke test de estrutura do projeto (task 1.2).
 *
 * Nao valida regra de negocio nenhuma: confirma apenas que o executor de testes
 * roda e que os quatro modulos previstos existem e expoem as funcoes que as
 * tasks 6.1, 7.1, 8.1 e 9.1 vao implementar. Serve como rede de seguranca
 * contra renomear/remover um modulo por acidente.
 */
import { describe, expect, it } from "vitest";

describe("estrutura de modulos do Endpoint_de_Envio", () => {
  it("expoe as funcoes de validacao server-side", async () => {
    const validacao = await import("../src/validacao.js");
    expect(typeof validacao.validarPayloadContato).toBe("function");
    expect(typeof validacao.apenasDigitos).toBe("function");
    expect(typeof validacao.ehEmBranco).toBe("function");
    expect(typeof validacao.cpfValido).toBe("function");
    expect(typeof validacao.telefoneValido).toBe("function");
  });

  it("expoe o registro append-only do Consentimento_LGPD", async () => {
    const registro = await import("../src/registroConsentimento.js");
    expect(typeof registro.registrarConsentimentoLGPD).toBe("function");
  });

  it("expoe a composicao e o envio da Notificacao_por_Email", async () => {
    const email = await import("../src/notificacaoEmail.js");
    expect(typeof email.montarNotificacaoEmail).toBe("function");
    expect(typeof email.enviarNotificacaoEmail).toBe("function");
  });

  it("expoe o handler orquestrador", async () => {
    const mod = await import("../src/handler.js");
    expect(typeof mod.handler).toBe("function");
    expect(mod.default).toBe(mod.handler);
  });
});
