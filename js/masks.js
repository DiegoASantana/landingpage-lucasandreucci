/* ==========================================================================
   Cerne — Máscaras de input (live, ao digitar)
   Utilitário reutilizável, vanilla JS, sem dependências.

   Uso declarativo:
     <input data-mask="telefone">   → aplica ao digitar
   Tipos suportados: telefone, cpf, cnpj, cnj, rg, cep.

   Ativação: chame initMasks(container) após renderizar o HTML dinâmico.
   Também é possível formatar valores programaticamente via Masks.<tipo>(valor).
   ========================================================================== */

(function () {
  "use strict";

  function onlyDigits(v) {
    return (v == null ? "" : String(v)).replace(/\D/g, "");
  }

  /* Telefone: (XX) XXXXX-XXXX (11 díg. celular) ou (XX) XXXX-XXXX (10 díg. fixo) */
  function fmtTelefone(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return "(" + d;
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  /* CPF: XXX.XXX.XXX-XX */
  function fmtCPF(v) {
    const d = onlyDigits(v).slice(0, 11);
    let r = d.slice(0, 3);
    if (d.length > 3) r += "." + d.slice(3, 6);
    if (d.length > 6) r += "." + d.slice(6, 9);
    if (d.length > 9) r += "-" + d.slice(9, 11);
    return r;
  }

  /* CNPJ: XX.XXX.XXX/XXXX-XX */
  function fmtCNPJ(v) {
    const d = onlyDigits(v).slice(0, 14);
    let r = d.slice(0, 2);
    if (d.length > 2) r += "." + d.slice(2, 5);
    if (d.length > 5) r += "." + d.slice(5, 8);
    if (d.length > 8) r += "/" + d.slice(8, 12);
    if (d.length > 12) r += "-" + d.slice(12, 14);
    return r;
  }

  /* CNJ: 0000000-00.0000.0.00.0000 (7-2-4-1-2-4 = 20 dígitos) */
  function fmtCNJ(v) {
    const d = onlyDigits(v).slice(0, 20);
    let r = d.slice(0, 7);
    if (d.length > 7) r += "-" + d.slice(7, 9);
    if (d.length > 9) r += "." + d.slice(9, 13);
    if (d.length > 13) r += "." + d.slice(13, 14);
    if (d.length > 14) r += "." + d.slice(14, 16);
    if (d.length > 16) r += "." + d.slice(16, 20);
    return r;
  }

  /* RG (formato SP, tolerante): XX.XXX.XXX-X */
  function fmtRG(v) {
    const d = onlyDigits(v).slice(0, 9);
    let r = d.slice(0, 2);
    if (d.length > 2) r += "." + d.slice(2, 5);
    if (d.length > 5) r += "." + d.slice(5, 8);
    if (d.length > 8) r += "-" + d.slice(8, 9);
    return r;
  }

  /* CEP: XXXXX-XXX */
  function fmtCEP(v) {
    const d = onlyDigits(v).slice(0, 8);
    if (d.length > 5) return d.slice(0, 5) + "-" + d.slice(5);
    return d;
  }

  const MASKS = {
    telefone: fmtTelefone,
    cpf: fmtCPF,
    cnpj: fmtCNPJ,
    cnj: fmtCNJ,
    rg: fmtRG,
    cep: fmtCEP
  };

  /* Aplica a máscara a um único elemento, preservando a posição do cursor
     com base na contagem de dígitos (permite editar/apagar no meio do texto). */
  function applyMask(el) {
    const type = el.getAttribute("data-mask");
    const fn = MASKS[type];
    if (!fn) return;

    // Já vinculado: apenas reformata o valor atual (útil ao trocar o tipo do doc).
    if (el.dataset.maskBound === "1") {
      if (el.value) el.value = fn(el.value);
      return;
    }
    el.dataset.maskBound = "1";
    if (!el.getAttribute("inputmode")) el.setAttribute("inputmode", "numeric");

    el.addEventListener("input", function () {
      const caret = el.selectionStart;
      const digitsBefore = onlyDigits(el.value.slice(0, caret)).length;
      el.value = fn(el.value);
      // Reposiciona o cursor após o mesmo número de dígitos.
      let pos = 0, count = 0;
      while (pos < el.value.length && count < digitsBefore) {
        if (/\d/.test(el.value[pos])) count++;
        pos++;
      }
      try { el.setSelectionRange(pos, pos); } catch (e) { /* inputs type=date etc. */ }
    });

    if (el.value) el.value = fn(el.value);
  }

  /* Escaneia um container e ativa todas as máscaras declaradas via data-mask. */
  function initMasks(container) {
    (container || document).querySelectorAll("[data-mask]").forEach(applyMask);
  }

  // Exposição global (scripts carregados por <script src>, sem módulos).
  window.Masks = {
    telefone: fmtTelefone,
    cpf: fmtCPF,
    cnpj: fmtCNPJ,
    cnj: fmtCNJ,
    rg: fmtRG,
    cep: fmtCEP,
    onlyDigits: onlyDigits
  };
  window.applyMask = applyMask;
  window.initMasks = initMasks;
})();
