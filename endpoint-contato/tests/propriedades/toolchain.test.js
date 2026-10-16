/**
 * Verificacao de ferramental de testes de propriedade (task 1.2).
 *
 * NAO e uma das 10 propriedades de correcao de design.md — e apenas a
 * confirmacao de que fast-check roda neste projeto e de que o script
 * `npm run test:prop` encontra arquivos neste diretorio. As propriedades
 * numeradas do design entram aqui nas tasks 6.2, 8.2, 9.2 e 9.3.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("ferramental de PBT", () => {
  it("executa uma propriedade trivial com fast-check", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(`${s}`.length).toBe(s.length);
      })
    );
  });
});
