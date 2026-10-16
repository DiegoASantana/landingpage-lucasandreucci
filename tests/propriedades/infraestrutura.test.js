import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Smoke test de infraestrutura: garante que Vitest e fast-check estão
// operacionais neste diretório. Não valida requisito de produto.
describe("infraestrutura de testes de propriedade", () => {
  it("executa uma propriedade com fast-check", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(s.length).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
