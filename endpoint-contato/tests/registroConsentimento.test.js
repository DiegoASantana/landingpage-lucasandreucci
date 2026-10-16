/**
 * Testes do registro do Consentimento_LGPD em tabela do Supabase.
 *
 * O cliente do Supabase e mockado por completo: nenhum teste toca a rede, o
 * disco ou um projeto real, e nenhum depende de segredo. O que importa aqui e o
 * contrato usado pelo handler (Requisito 2.4; Design Data Models —
 * RegistroConsentimento):
 *   - sucesso  => resolve `true` e grava exatamente os 6 campos do registro
 *   - `{ error }` devolvido pelo cliente => LANCA (handler responde 502 falha_registro)
 *   - excecao lancada pelo cliente        => propaga
 *   - variavel de ambiente ausente        => falha de forma decidivel, sem chamar o cliente
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Estado do duble do SDK. `vi.hoisted` porque a factory de `vi.mock` e movida
 * para o topo do arquivo e nao pode ler variaveis declaradas depois.
 */
const supabaseFalso = vi.hoisted(() => ({
  /** @type {{url: string, chave: string, opcoes: unknown}[]} */
  clientesCriados: [],
  /** @type {{tabela: string, linha: unknown}[]} */
  insercoes: [],
  /** Resultado devolvido pelo insert (estilo `{ error }` do SDK). */
  resultadoInsert: { error: null },
  /** Quando definido, `insert` lanca este erro em vez de devolver resultado. */
  /** @type {Error | null} */
  erroLancado: null
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (url, chave, opcoes) => {
    supabaseFalso.clientesCriados.push({ url, chave, opcoes });
    return {
      from: (tabela) => ({
        insert: async (linha) => {
          supabaseFalso.insercoes.push({ tabela, linha });
          if (supabaseFalso.erroLancado) throw supabaseFalso.erroLancado;
          return supabaseFalso.resultadoInsert;
        }
      })
    };
  }
}));

const {
  registrarConsentimentoLGPD,
  montarLinhaConsentimento,
  tabelaConsentimentos
} = await import("../src/registroConsentimento.js");

const ENV_ORIGINAL = { ...process.env };

function registroExemplo(sufixo = "") {
  return {
    dataHora: "2026-02-19T13:45:00.000Z",
    ip: "203.0.113.42",
    nome: `Maria Silva${sufixo}`,
    email: `maria${sufixo}@example.com`,
    telefone: "11987654321",
    cpf: "52998224725"
  };
}

beforeEach(() => {
  supabaseFalso.clientesCriados = [];
  supabaseFalso.insercoes = [];
  supabaseFalso.resultadoInsert = { error: null };
  supabaseFalso.erroLancado = null;

  process.env.SUPABASE_URL = "https://projeto-ficticio.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "chave_de_servico_ficticia";
  delete process.env.SUPABASE_TABELA_CONSENTIMENTOS;
});

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe("registrarConsentimentoLGPD — sucesso", () => {
  it("insere exatamente uma linha com os 6 campos do registro", async () => {
    const resultado = await registrarConsentimentoLGPD(registroExemplo());

    expect(resultado).toBe(true);
    expect(supabaseFalso.insercoes).toHaveLength(1);
    expect(supabaseFalso.insercoes[0].linha).toEqual({
      data_hora: "2026-02-19T13:45:00.000Z",
      ip: "203.0.113.42",
      nome: "Maria Silva",
      email: "maria@example.com",
      telefone: "11987654321",
      cpf: "52998224725"
    });
  });

  it("usa a tabela padrao e cria o cliente com a configuracao do ambiente", async () => {
    await registrarConsentimentoLGPD(registroExemplo());

    expect(supabaseFalso.insercoes[0].tabela).toBe("consentimentos_lgpd");
    expect(supabaseFalso.clientesCriados).toHaveLength(1);
    expect(supabaseFalso.clientesCriados[0].url).toBe("https://projeto-ficticio.supabase.co");
    expect(supabaseFalso.clientesCriados[0].chave).toBe("chave_de_servico_ficticia");
  });

  it("insere uma linha por chamada, sem reescrever a anterior", async () => {
    await registrarConsentimentoLGPD(registroExemplo("-1"));
    await registrarConsentimentoLGPD(registroExemplo("-2"));

    expect(supabaseFalso.insercoes).toHaveLength(2);
    expect(supabaseFalso.insercoes[0].linha.nome).toBe("Maria Silva-1");
    expect(supabaseFalso.insercoes[1].linha.nome).toBe("Maria Silva-2");
  });

  it("resolve a tabela pela variavel de ambiente a cada chamada", async () => {
    process.env.SUPABASE_TABELA_CONSENTIMENTOS = "consentimentos_homologacao";
    expect(tabelaConsentimentos()).toBe("consentimentos_homologacao");

    await registrarConsentimentoLGPD(registroExemplo());
    expect(supabaseFalso.insercoes[0].tabela).toBe("consentimentos_homologacao");

    process.env.SUPABASE_TABELA_CONSENTIMENTOS = "   ";
    expect(tabelaConsentimentos()).toBe("consentimentos_lgpd");
  });

  it("mantem a ordem de campos fixada pelo design", () => {
    expect(Object.keys(montarLinhaConsentimento(registroExemplo()))).toEqual([
      "data_hora",
      "ip",
      "nome",
      "email",
      "telefone",
      "cpf"
    ]);
  });
});

describe("registrarConsentimentoLGPD — falhas", () => {
  it("lanca quando o cliente devolve erro em vez de lancar", async () => {
    supabaseFalso.resultadoInsert = {
      error: { message: "duplicate key value violates unique constraint", code: "23505" }
    };

    await expect(registrarConsentimentoLGPD(registroExemplo())).rejects.toThrow(
      /Consentimento_LGPD/
    );
  });

  it("lanca mesmo quando o erro do cliente nao tem mensagem", async () => {
    supabaseFalso.resultadoInsert = { error: { code: "PGRST301" } };

    await expect(registrarConsentimentoLGPD(registroExemplo())).rejects.toThrow(/PGRST301/);
  });

  it("propaga a excecao lancada pelo cliente (rede, DNS, timeout)", async () => {
    supabaseFalso.erroLancado = new Error("fetch failed");

    await expect(registrarConsentimentoLGPD(registroExemplo())).rejects.toThrow("fetch failed");
  });
});

describe("registrarConsentimentoLGPD — configuracao ausente", () => {
  it("falha nomeando SUPABASE_URL, sem chegar a chamar o cliente", async () => {
    delete process.env.SUPABASE_URL;

    await expect(registrarConsentimentoLGPD(registroExemplo())).rejects.toThrow("SUPABASE_URL");
    expect(supabaseFalso.clientesCriados).toHaveLength(0);
    expect(supabaseFalso.insercoes).toHaveLength(0);
  });

  it("falha nomeando SUPABASE_SERVICE_ROLE_KEY quando ela esta em branco", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "   ";

    await expect(registrarConsentimentoLGPD(registroExemplo())).rejects.toThrow(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    expect(supabaseFalso.clientesCriados).toHaveLength(0);
    expect(supabaseFalso.insercoes).toHaveLength(0);
  });

  it("nunca expoe o valor da service role key na mensagem de erro", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave_secreta_que_nao_pode_vazar";
    supabaseFalso.resultadoInsert = { error: { message: "permission denied" } };

    await expect(registrarConsentimentoLGPD(registroExemplo())).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("chave_secreta_que_nao_pode_vazar")
      })
    );
  });
});
