import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// js/site-institucional.js é carregado no navegador por <script src> (sem
// bundler) e publica o núcleo de validação também via module.exports (UMD).
// Aqui o require nativo do Node é usado para exercitar essas funções puras
// sem DOM — os blocos de comportamento do arquivo saem sozinhos quando não
// existe `document`.
const require = createRequire(import.meta.url);
const {
  apenasDigitos,
  ehEmBranco,
  cpfValido,
  telefoneValido,
  emailValido,
  validarFormularioContato,
} = require("../../js/site-institucional.js");

describe("apenasDigitos / ehEmBranco", () => {
  it("extrai só os dígitos, preservando a ordem", () => {
    expect(apenasDigitos("529.982.247-25")).toBe("52998224725");
    expect(apenasDigitos("(11) 96404-8179")).toBe("11964048179");
    expect(apenasDigitos("")).toBe("");
    expect(apenasDigitos(null)).toBe("");
  });

  it("considera em branco vazio, espaços, tabs e ausência de valor", () => {
    expect(ehEmBranco("")).toBe(true);
    expect(ehEmBranco("   ")).toBe(true);
    expect(ehEmBranco("\t \n")).toBe(true);
    expect(ehEmBranco(undefined)).toBe(true);
    expect(ehEmBranco("a")).toBe(false);
  });
});

describe("cpfValido — Requisito 1.6", () => {
  it("aceita CPFs com dígitos verificadores corretos, com ou sem máscara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
    expect(cpfValido("111.444.777-35")).toBe(true);
  });

  it("rejeita dígito verificador incorreto, comprimento errado e dígitos repetidos", () => {
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("5299822472")).toBe(false);
    expect(cpfValido("529982247255")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("000.000.000-00")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });
});

describe("telefoneValido — Requisito 1.9", () => {
  it("aceita exatamente 10 ou 11 dígitos", () => {
    expect(telefoneValido("(11) 4004-8179")).toBe(true);
    expect(telefoneValido("(11) 96404-8179")).toBe(true);
  });

  it("rejeita menos de 10 ou mais de 11 dígitos", () => {
    expect(telefoneValido("(11) 9640-817")).toBe(false);
    expect(telefoneValido("119640481790")).toBe(false);
    expect(telefoneValido("")).toBe(false);
  });
});

describe("emailValido — Requisito 1.11", () => {
  it("aceita endereços com parte local, @ e domínio com ao menos um ponto", () => {
    expect(emailValido("maria@exemplo.com")).toBe(true);
    expect(emailValido("maria.souza+contato@adv.exemplo.com.br")).toBe(true);
    expect(emailValido("  maria@exemplo.com  ")).toBe(true);
  });

  it("rejeita ausência de @, domínio sem ponto, espaços internos e vazio", () => {
    expect(emailValido("mariaexemplo.com")).toBe(false);
    expect(emailValido("maria@exemplo")).toBe(false);
    expect(emailValido("maria @exemplo.com")).toBe(false);
    expect(emailValido("@exemplo.com")).toBe(false);
    expect(emailValido("maria@")).toBe(false);
    expect(emailValido("")).toBe(false);
    expect(emailValido(null)).toBe(false);
  });
});

describe("validarFormularioContato — Requisitos 1.3, 1.4, 1.6, 1.9, 1.11, 2.3", () => {
  const valido = {
    nome: "Maria Souza",
    email: "maria@exemplo.com",
    telefone: "(11) 96404-8179",
    cpf: "529.982.247-25",
    mensagem: "Preciso de orientação.",
    consentimentoLGPD: true,
  };

  it("não acusa erro quando todos os campos estão válidos", () => {
    expect(validarFormularioContato(valido)).toEqual({});
  });

  it("acusa obrigatoriedade com a mensagem literal, por campo em branco", () => {
    const erros = validarFormularioContato({
      ...valido,
      nome: "   ",
      email: "",
      telefone: " ",
      cpf: "\t",
    });
    expect(erros.nome).toBe("Este campo é obrigatório.");
    expect(erros.email).toBe("Este campo é obrigatório.");
    expect(erros.telefone).toBe("Este campo é obrigatório.");
    expect(erros.cpf).toBe("Este campo é obrigatório.");
  });

  it("acusa e-mail preenchido mas fora de formato, sem sobrepor a obrigatoriedade", () => {
    expect(validarFormularioContato({ ...valido, email: "maria@exemplo" }).email).toBe(
      "E-mail inválido."
    );
    // Em branco tem precedência: a checagem de formato só roda depois.
    expect(validarFormularioContato({ ...valido, email: "   " }).email).toBe(
      "Este campo é obrigatório."
    );
  });

  it("acusa CPF e telefone preenchidos mas inválidos", () => {
    const erros = validarFormularioContato({
      ...valido,
      telefone: "(11) 9640",
      cpf: "529.982.247-24",
    });
    expect(erros.telefone).toBe("Telefone inválido.");
    expect(erros.cpf).toBe("CPF inválido.");
  });

  it("acusa ausência do consentimento LGPD sem alterar os valores recebidos", () => {
    const valores = { ...valido, consentimentoLGPD: false };
    const erros = validarFormularioContato(valores);
    expect(erros.consentimento).toBe(
      "É necessário concordar com o tratamento de dados para enviar o formulário."
    );
    expect(Object.keys(erros)).toEqual(["consentimento"]);
    expect(valores).toEqual({ ...valido, consentimentoLGPD: false });
  });
});
