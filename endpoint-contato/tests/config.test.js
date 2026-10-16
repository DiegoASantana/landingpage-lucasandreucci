/**
 * Testes unitarios da checagem de configuracao fail-fast (task 10.1).
 *
 * Requisito 3.6; Design seccao Components item 3 (DD-05) e Error Handling
 * ("RESEND_API_KEY ausente => falha de inicializacao do servico, detectavel em
 * deploy/smoke test").
 *
 * Todos os casos usam um objeto de ambiente injetado — nenhum teste depende do
 * process.env da maquina nem do valor real de um segredo.
 */
import { describe, expect, it, vi } from "vitest";

import {
  ErroDeConfiguracao,
  VARIAVEIS_OBRIGATORIAS,
  estaDefinida,
  exigirConfiguracaoValida,
  relatorioConfiguracao,
  verificarConfiguracao
} from "../src/config.js";
import { iniciar, verificarComoComando } from "../src/inicializacao.js";

/** Ambiente minimo completo (valores ficticios, nenhum segredo real). */
const ENV_COMPLETO = Object.freeze({
  RESEND_API_KEY: "re_chave_ficticia",
  EMAIL_DESTINO_DR_LUCAS: "lucas@escritorio.com.br",
  EMAIL_REMETENTE: "contato@dominioverificado.com.br",
  SUPABASE_URL: "https://projeto-ficticio.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "chave_de_servico_ficticia",
  SUPABASE_TABELA_CONSENTIMENTOS: "consentimentos_lgpd",
  TIMEOUT_ENVIO_EMAIL_MS: "8000"
});

/** Log falso, para capturar o relatorio sem sujar a saida dos testes. */
function logFalso() {
  return { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("estaDefinida", () => {
  it("aceita apenas string com conteudo nao-branco", () => {
    expect(estaDefinida("x")).toBe(true);
    expect(estaDefinida("")).toBe(false);
    expect(estaDefinida("   ")).toBe(false);
    expect(estaDefinida(undefined)).toBe(false);
    expect(estaDefinida(null)).toBe(false);
    expect(estaDefinida(123)).toBe(false);
  });
});

describe("verificarConfiguracao — variaveis presentes", () => {
  it("aprova ambiente completo, sem ausentes e sem avisos", () => {
    const resultado = verificarConfiguracao({ ...ENV_COMPLETO });
    expect(resultado).toEqual({ ok: true, ausentes: [], avisos: [] });
  });

  it("aprova ambiente com apenas as obrigatorias, avisando dos padroes aplicados", () => {
    const resultado = verificarConfiguracao({
      RESEND_API_KEY: "re_chave_ficticia",
      EMAIL_DESTINO_DR_LUCAS: "lucas@escritorio.com.br",
      EMAIL_REMETENTE: "contato@dominioverificado.com.br",
      SUPABASE_URL: "https://projeto-ficticio.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "chave_de_servico_ficticia"
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.ausentes).toEqual([]);
    expect(resultado.avisos).toHaveLength(2);
    expect(resultado.avisos.join("\n")).toContain("SUPABASE_TABELA_CONSENTIMENTOS");
    expect(resultado.avisos.join("\n")).toContain("TIMEOUT_ENVIO_EMAIL_MS");
  });

  it("avisa quando TIMEOUT_ENVIO_EMAIL_MS esta definida com valor inutilizavel", () => {
    const resultado = verificarConfiguracao({ ...ENV_COMPLETO, TIMEOUT_ENVIO_EMAIL_MS: "abc" });
    expect(resultado.ok).toBe(true);
    expect(resultado.avisos.join("\n")).toContain("TIMEOUT_ENVIO_EMAIL_MS");
  });
});

describe("verificarConfiguracao — variaveis ausentes", () => {
  it("reprova ambiente vazio listando todas as obrigatorias", () => {
    const resultado = verificarConfiguracao({});
    expect(resultado.ok).toBe(false);
    expect(resultado.ausentes).toEqual([...VARIAVEIS_OBRIGATORIAS]);
  });

  it("reprova quando falta apenas RESEND_API_KEY", () => {
    const env = { ...ENV_COMPLETO };
    delete env.RESEND_API_KEY;

    const resultado = verificarConfiguracao(env);
    expect(resultado.ok).toBe(false);
    expect(resultado.ausentes).toEqual(["RESEND_API_KEY"]);
  });

  it("reprova quando falta apenas EMAIL_DESTINO_DR_LUCAS", () => {
    const env = { ...ENV_COMPLETO };
    delete env.EMAIL_DESTINO_DR_LUCAS;

    const resultado = verificarConfiguracao(env);
    expect(resultado.ok).toBe(false);
    expect(resultado.ausentes).toEqual(["EMAIL_DESTINO_DR_LUCAS"]);
  });
});

describe("verificarConfiguracao — variaveis em branco", () => {
  it("trata string vazia como ausencia", () => {
    const resultado = verificarConfiguracao({ ...ENV_COMPLETO, RESEND_API_KEY: "" });
    expect(resultado.ok).toBe(false);
    expect(resultado.ausentes).toEqual(["RESEND_API_KEY"]);
  });

  it("trata string so com espacos como ausencia", () => {
    const resultado = verificarConfiguracao({
      ...ENV_COMPLETO,
      EMAIL_DESTINO_DR_LUCAS: "   ",
      EMAIL_REMETENTE: "\t\n"
    });
    expect(resultado.ok).toBe(false);
    expect(resultado.ausentes).toEqual(["EMAIL_DESTINO_DR_LUCAS", "EMAIL_REMETENTE"]);
  });
});

describe("exigirConfiguracaoValida", () => {
  it("devolve o resultado quando o ambiente esta completo", () => {
    expect(exigirConfiguracaoValida({ ...ENV_COMPLETO }).ok).toBe(true);
  });

  it("lanca ErroDeConfiguracao nomeando as variaveis ausentes", () => {
    const env = { ...ENV_COMPLETO };
    delete env.RESEND_API_KEY;

    expect(() => exigirConfiguracaoValida(env)).toThrowError(ErroDeConfiguracao);

    try {
      exigirConfiguracaoValida(env);
      expect.unreachable("deveria ter lancado");
    } catch (erro) {
      expect(erro.ausentes).toEqual(["RESEND_API_KEY"]);
      expect(erro.message).toContain("RESEND_API_KEY");
    }
  });
});

describe("relatorioConfiguracao", () => {
  it("nunca expoe o valor de um segredo", () => {
    const env = {
      ...ENV_COMPLETO,
      RESEND_API_KEY: "re_segredo_que_nao_pode_vazar",
      SUPABASE_SERVICE_ROLE_KEY: "service_role_que_nao_pode_vazar"
    };
    const texto = relatorioConfiguracao(verificarConfiguracao(env), env).join("\n");

    expect(texto).not.toContain("re_segredo_que_nao_pode_vazar");
    expect(texto).not.toContain("service_role_que_nao_pode_vazar");
    expect(texto).toContain("RESEND_API_KEY: definida");
    expect(texto).toContain("SUPABASE_SERVICE_ROLE_KEY: definida");
  });

  it("marca como AUSENTE a variavel obrigatoria que falta", () => {
    const env = { ...ENV_COMPLETO, RESEND_API_KEY: "" };
    const texto = relatorioConfiguracao(verificarConfiguracao(env), env).join("\n");

    expect(texto).toContain("RESEND_API_KEY: AUSENTE");
  });
});

describe("iniciar (fail-fast de inicializacao)", () => {
  it("registra sucesso e nao lanca com ambiente completo", () => {
    const log = logFalso();
    const resultado = iniciar({ env: { ...ENV_COMPLETO }, log });

    expect(resultado.ok).toBe(true);
    expect(log.error).not.toHaveBeenCalled();
    expect(log.log).toHaveBeenCalledTimes(1);
  });

  it("falha de forma decidivel, e nao em silencio, quando RESEND_API_KEY falta", () => {
    const env = { ...ENV_COMPLETO };
    delete env.RESEND_API_KEY;
    const log = logFalso();

    expect(() => iniciar({ env, log })).toThrowError(ErroDeConfiguracao);
    expect(log.error).toHaveBeenCalled();

    const registrado = log.error.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(registrado).toContain("RESEND_API_KEY: AUSENTE");
    expect(registrado).not.toContain(ENV_COMPLETO.RESEND_API_KEY);
  });

  it("devolve codigo de saida 1 no modo comando quando falta configuracao", () => {
    expect(verificarComoComando({ env: {}, log: logFalso() })).toBe(1);
    expect(verificarComoComando({ env: { ...ENV_COMPLETO }, log: logFalso() })).toBe(0);
  });
});

describe("independencia do handler (DD-01)", () => {
  it("importar o handler nao exige ambiente configurado", async () => {
    const env = { ...process.env };
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_DESTINO_DR_LUCAS;
    delete process.env.EMAIL_REMETENTE;

    try {
      const mod = await import("../src/handler.js");
      expect(typeof mod.handler).toBe("function");
    } finally {
      process.env = env;
    }
  });
});
