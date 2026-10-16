/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";

// Smoke test de infraestrutura: garante que o ambiente jsdom está disponível
// para os testes unitários que inspecionam o HTML do formulário.
// Não valida requisito de produto.
describe("infraestrutura de testes unitários com DOM", () => {
  it("disponibiliza um document do jsdom", () => {
    document.body.innerHTML = '<form id="form-contato"></form>';
    expect(document.querySelector("#form-contato")).not.toBeNull();
  });
});
