/**
 * Testes unitarios da validacao server-side (task 6.1).
 *
 * Cobrem exemplos concretos e fronteiras do contrato HTTP do design
 * (seccao Components item 3) e do Requisito 3.7. Os testes de propriedade
 * correspondentes (Properties 1, 4 e 5 replicadas no servidor) sao a task 6.2.
 */
import { describe, expect, it } from "vitest";
import {
  apenasDigitos,
  cpfValido,
  ehEmBranco,
  telefoneValido,
  validarPayloadContato
} from "../src/validacao.js";

const CPF_VALIDO = "11144477735";

function payloadValido(sobrescritas = {}) {
  return {
    nome: "Maria Andreucci",
    email: "maria@exemplo.com.br",
    telefone: "11987654321",
    cpf: CPF_VALIDO,
    mensagem: "Preciso de orientacao sobre um contrato.",
    consentimentoLGPD: true,
    _hp: "",
    ...sobrescritas
  };
}

describe("apenasDigitos", () => {
  it("mantem apenas digitos, na ordem em que aparecem", () => {
    expect(apenasDigitos("111.444.777-35")).toBe("11144477735");
    expect(apenasDigitos("(11) 98765-4321")).toBe("11987654321");
  });

  it("retorna string vazia para entradas sem digitos ou nao-string", () => {
    expect(apenasDigitos("abc-.")).toBe("");
    expect(apenasDigitos(undefined)).toBe("");
    expect(apenasDigitos(null)).toBe("");
    expect(apenasDigitos(11144477735)).toBe("");
  });
});

describe("ehEmBranco", () => {
  it("trata vazio, espacos e tabs como em branco", () => {
    expect(ehEmBranco("")).toBe(true);
    expect(ehEmBranco("   ")).toBe(true);
    expect(ehEmBranco("\t\n ")).toBe(true);
  });

  it("trata ausencia e tipo errado como em branco", () => {
    expect(ehEmBranco(undefined)).toBe(true);
    expect(ehEmBranco(null)).toBe(true);
    expect(ehEmBranco(42)).toBe(true);
  });

  it("nao considera em branco valor com conteudo", () => {
    expect(ehEmBranco(" a ")).toBe(false);
  });
});

describe("cpfValido", () => {
  it("aceita CPF com digitos verificadores corretos, com ou sem mascara", () => {
    expect(cpfValido(CPF_VALIDO)).toBe(true);
    expect(cpfValido("111.444.777-35")).toBe(true);
  });

  it("rejeita digito verificador incorreto", () => {
    expect(cpfValido("11144477734")).toBe(false); // segundo digito alterado
    expect(cpfValido("11144477725")).toBe(false); // primeiro digito alterado
  });

  it("rejeita sequencias de 11 digitos iguais", () => {
    expect(cpfValido("00000000000")).toBe(false);
    expect(cpfValido("11111111111")).toBe(false);
    expect(cpfValido("99999999999")).toBe(false);
  });

  it("rejeita quantidade de digitos diferente de 11", () => {
    expect(cpfValido("1114447773")).toBe(false);
    expect(cpfValido("111444777350")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });
});

describe("telefoneValido", () => {
  it("aceita exatamente 10 ou 11 digitos, ignorando mascara", () => {
    expect(telefoneValido("1132654321")).toBe(true);
    expect(telefoneValido("(11) 3265-4321")).toBe(true);
    expect(telefoneValido("11987654321")).toBe(true);
    expect(telefoneValido("(11) 98765-4321")).toBe(true);
  });

  it("rejeita fronteiras adjacentes", () => {
    expect(telefoneValido("119876543")).toBe(false); // 9 digitos
    expect(telefoneValido("119876543210")).toBe(false); // 12 digitos
    expect(telefoneValido("")).toBe(false);
  });
});

describe("validarPayloadContato — caminho valido", () => {
  it("aceita payload completo e devolve os dados normalizados", () => {
    const resultado = validarPayloadContato(
      payloadValido({
        nome: "  Maria Andreucci  ",
        email: "  maria@exemplo.com.br ",
        telefone: "(11) 98765-4321",
        cpf: "111.444.777-35",
        mensagem: "  Preciso de orientacao.  "
      })
    );

    expect(resultado).toEqual({
      ok: true,
      dados: {
        nome: "Maria Andreucci",
        email: "maria@exemplo.com.br",
        telefone: "11987654321",
        cpf: "11144477735",
        mensagem: "Preciso de orientacao.",
        consentimentoLGPD: true,
        _hp: ""
      }
    });
  });

  it("aceita mensagem ausente ou vazia, normalizando para string vazia", () => {
    const semMensagem = payloadValido();
    delete semMensagem.mensagem;
    expect(validarPayloadContato(semMensagem).dados.mensagem).toBe("");
    expect(validarPayloadContato(payloadValido({ mensagem: "   " })).dados.mensagem).toBe("");
  });

  it("aceita mensagem exatamente no limite de 2000 caracteres", () => {
    const resultado = validarPayloadContato(payloadValido({ mensagem: "a".repeat(2000) }));
    expect(resultado.ok).toBe(true);
  });

  it("repassa o honeypot preenchido em dados, sem rejeitar (decisao do handler)", () => {
    const resultado = validarPayloadContato(payloadValido({ _hp: "spam" }));
    expect(resultado.ok).toBe(true);
    expect(resultado.dados._hp).toBe("spam");
  });

  it("nao altera o corpo recebido (funcao pura)", () => {
    const corpo = payloadValido({ nome: "  Maria  " });
    const copia = { ...corpo };
    validarPayloadContato(corpo);
    expect(corpo).toEqual(copia);
  });
});

describe("validarPayloadContato — consentimento", () => {
  it("rejeita consentimento ausente com consentimento_ausente", () => {
    const corpo = payloadValido();
    delete corpo.consentimentoLGPD;
    expect(validarPayloadContato(corpo)).toEqual({
      ok: false,
      erro: "consentimento_ausente"
    });
  });

  it("rejeita consentimento false com consentimento_ausente", () => {
    expect(validarPayloadContato(payloadValido({ consentimentoLGPD: false }))).toEqual({
      ok: false,
      erro: "consentimento_ausente"
    });
  });

  it("rejeita consentimento de tipo errado como payload_invalido", () => {
    for (const valor of ["true", 1, {}, []]) {
      expect(validarPayloadContato(payloadValido({ consentimentoLGPD: valor }))).toEqual({
        ok: false,
        erro: "payload_invalido"
      });
    }
  });
});

describe("validarPayloadContato — payload invalido", () => {
  const invalido = { ok: false, erro: "payload_invalido" };

  it("rejeita corpo que nao e objeto simples", () => {
    for (const corpo of [undefined, null, "", "{nao-json}", 42, true, [], [payloadValido()]]) {
      expect(validarPayloadContato(corpo)).toEqual(invalido);
    }
  });

  it("rejeita chave nao prevista no contrato", () => {
    expect(validarPayloadContato(payloadValido({ extra: "x" }))).toEqual(invalido);
  });

  it("rejeita cada campo obrigatorio ausente isoladamente", () => {
    for (const campo of ["nome", "email", "telefone", "cpf"]) {
      const corpo = payloadValido();
      delete corpo[campo];
      expect(validarPayloadContato(corpo)).toEqual(invalido);
    }
  });

  it("rejeita cada campo obrigatorio em branco isoladamente", () => {
    for (const campo of ["nome", "email", "telefone", "cpf"]) {
      expect(validarPayloadContato(payloadValido({ [campo]: "   " }))).toEqual(invalido);
    }
  });

  it("rejeita tipo errado em campo obrigatorio", () => {
    expect(validarPayloadContato(payloadValido({ nome: 123 }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ email: null }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ telefone: 11987654321 }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ cpf: ["1"] }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ mensagem: 10 }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ _hp: 0 }))).toEqual(invalido);
  });

  it("rejeita mensagem acima de 2000 caracteres", () => {
    expect(validarPayloadContato(payloadValido({ mensagem: "a".repeat(2001) }))).toEqual(invalido);
  });

  it("rejeita nome acima de 200 caracteres", () => {
    expect(validarPayloadContato(payloadValido({ nome: "a".repeat(201) }))).toEqual(invalido);
  });

  it("rejeita e-mail fora de formato", () => {
    for (const email of ["maria", "maria@", "@exemplo.com", "maria@exemplo", "ma ria@e.com"]) {
      expect(validarPayloadContato(payloadValido({ email }))).toEqual(invalido);
    }
  });

  it("rejeita CPF invalido e telefone fora de 10-11 digitos", () => {
    expect(validarPayloadContato(payloadValido({ cpf: "11111111111" }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ cpf: "11144477734" }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ telefone: "119876543" }))).toEqual(invalido);
    expect(validarPayloadContato(payloadValido({ telefone: "119876543210" }))).toEqual(invalido);
  });
});
