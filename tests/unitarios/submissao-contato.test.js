/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from "node:module";

// js/site-institucional.js é carregado no navegador por <script src> (sem
// bundler) e publica o handler de submissão via module.exports (UMD).
const require = createRequire(import.meta.url);
const {
  inicializarFormularioContato,
  MSG_SUCESSO,
  MSG_ERRO_ENVIO,
  MSG_ERRO_DADOS,
  MSG_ERRO_ORIGEM,
  MSG_ERRO_LIMITE,
  MSG_ERRO_CONEXAO,
} = require("../../js/site-institucional.js");

// Valores válidos: garantem que a validação client-side passa e o fetch é
// realmente chamado — é o comportamento de resposta que está sob teste.
const PREENCHIDO = {
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  telefone: "(11) 96404-8179",
  cpf: "529.982.247-25",
  mensagem: "Preciso de orientação.",
};

function montarFormulario() {
  document.body.innerHTML = `
    <form id="form-contato" novalidate>
      <input id="nome" name="nome" maxlength="200">
      <span id="erro-nome" hidden></span>
      <input id="email-contato" name="email">
      <span id="erro-email" hidden></span>
      <input id="telefone-contato" name="telefone">
      <span id="erro-telefone" hidden></span>
      <input id="cpf-contato" name="cpf">
      <span id="erro-cpf" hidden></span>
      <textarea id="mensagem" name="mensagem"></textarea>
      <input id="_hp" name="_hp">
      <input type="checkbox" id="lgpd-consentimento" name="consentimentoLGPD">
      <span id="erro-consentimento" hidden></span>
      <button type="submit" id="btn-enviar-contato">Enviar mensagem</button>
      <p id="erro-envio" hidden aria-live="polite"></p>
    </form>`;

  const form = document.getElementById("form-contato");
  form.elements.namedItem("nome").value = PREENCHIDO.nome;
  form.elements.namedItem("email").value = PREENCHIDO.email;
  form.elements.namedItem("telefone").value = PREENCHIDO.telefone;
  form.elements.namedItem("cpf").value = PREENCHIDO.cpf;
  form.elements.namedItem("mensagem").value = PREENCHIDO.mensagem;
  form.elements.namedItem("consentimentoLGPD").checked = true;
  return form;
}

function valoresAtuais(form) {
  return {
    nome: form.elements.namedItem("nome").value,
    email: form.elements.namedItem("email").value,
    telefone: form.elements.namedItem("telefone").value,
    cpf: form.elements.namedItem("cpf").value,
    mensagem: form.elements.namedItem("mensagem").value,
  };
}

// Resposta mínima no formato que o handler inspeciona (`ok` e `status`).
function respostaHttp(status, corpo = { ok: true }) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corpo) };
}

describe("submissão do formulário — 400 vs. falha de envio (Requisitos 1.10, 1.13)", () => {
  let form;
  let chamadas;

  beforeEach(() => {
    form = montarFormulario();
    chamadas = 0;
  });

  function ligar(resposta) {
    return inicializarFormularioContato(form, {
      url: "/api/contato",
      fetch: () => {
        chamadas += 1;
        return resposta();
      },
    });
  }

  it("400 exibe a mensagem de dados recusados e preserva os valores", async () => {
    const api = ligar(() => Promise.resolve(respostaHttp(400)));
    await api.aoSubmeter({ preventDefault() {} });

    expect(chamadas).toBe(1);
    expect(document.getElementById("erro-envio").textContent).toBe(MSG_ERRO_DADOS);
    expect(document.getElementById("erro-envio").hidden).toBe(false);
    expect(valoresAtuais(form)).toEqual(PREENCHIDO);
  });

  it("502 exibe a mensagem de falha de envio e preserva os valores", async () => {
    const api = ligar(() => Promise.resolve(respostaHttp(502)));
    await api.aoSubmeter({ preventDefault() {} });

    expect(document.getElementById("erro-envio").textContent).toBe(MSG_ERRO_ENVIO);
    expect(valoresAtuais(form)).toEqual(PREENCHIDO);
  });

  it("fetch rejeitado exibe a mensagem de falha de envio e preserva os valores", async () => {
    const api = ligar(() => Promise.reject(new Error("rede-indisponivel")));
    await api.aoSubmeter({ preventDefault() {} });

    expect(document.getElementById("erro-envio").textContent).toBe(MSG_ERRO_CONEXAO);
    expect(valoresAtuais(form)).toEqual(PREENCHIDO);
  });

  it("403 informa origem não autorizada sem reenviar para o endpoint antigo", async () => {
    const api = ligar(() => Promise.resolve(respostaHttp(403)));
    await api.aoSubmeter({ preventDefault() {} });
    expect(chamadas).toBe(1);
    expect(document.getElementById("erro-envio").textContent).toBe(MSG_ERRO_ORIGEM);
    expect(valoresAtuais(form)).toEqual(PREENCHIDO);
  });

  it("429 pede para aguardar e preserva os dados", async () => {
    const api = ligar(() => Promise.resolve(respostaHttp(429)));
    await api.aoSubmeter({ preventDefault() {} });
    expect(document.getElementById("erro-envio").textContent).toBe(MSG_ERRO_LIMITE);
    expect(valoresAtuais(form)).toEqual(PREENCHIDO);
  });

  it("200 sem confirmação JSON não anuncia sucesso", async () => {
    const api = ligar(() => Promise.resolve(respostaHttp(200, { ok: false })));
    await api.aoSubmeter({ preventDefault() {} });
    expect(document.getElementById("erro-envio").textContent).toBe(MSG_ERRO_ENVIO);
    expect(valoresAtuais(form)).toEqual(PREENCHIDO);
  });

  it("usa só a URL configurada e registra um handler por formulário", async () => {
    const urls = [];
    form.setAttribute("data-endpoint", "https://exemplo.cernejur.com.br/api/publico/contatos");
    const config = { fetch: (url) => { urls.push(url); return Promise.resolve(respostaHttp(200)); } };
    const api = inicializarFormularioContato(form, config);
    expect(inicializarFormularioContato(form, { url: "/api/contato", fetch: config.fetch })).toBe(api);
    await api.aoSubmeter({ preventDefault() {} });
    expect(urls).toEqual(["https://exemplo.cernejur.com.br/api/publico/contatos"]);
  });

  it("as duas mensagens de falha são distintas entre si", () => {
    expect(MSG_ERRO_DADOS).not.toBe(MSG_ERRO_ENVIO);
  });

  it("200 exibe a confirmação e limpa o formulário (único ramo com reset)", async () => {
    const api = ligar(() => Promise.resolve(respostaHttp(200)));
    await api.aoSubmeter({ preventDefault() {} });

    expect(document.getElementById("erro-envio").textContent).toBe(MSG_SUCESSO);
    expect(form.elements.namedItem("nome").value).toBe("");
    expect(form.elements.namedItem("cpf").value).toBe("");
  });

  it("e-mail fora de formato não chega a chamar o endpoint (Requisito 1.11)", async () => {
    form.elements.namedItem("email").value = "maria@exemplo";
    const api = ligar(() => Promise.resolve(respostaHttp(200)));
    await api.aoSubmeter({ preventDefault() {} });

    expect(chamadas).toBe(0);
    expect(document.getElementById("erro-email").textContent).toBe("E-mail inválido.");
  });
});
