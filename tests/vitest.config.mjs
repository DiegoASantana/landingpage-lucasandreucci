import { defineConfig } from "vitest/config";

// `root` aponta para a raiz do repositório, que é também a raiz do site: os
// testes importam diretamente `js/*.js`, e o filtro do script `test:prop`
// (`vitest --run tests/propriedades`) casa com o caminho dos arquivos.
export default defineConfig({
  root: "..",
  test: {
    include: ["tests/**/*.test.js"],
    // Ambiente padrão: Node. Testes que precisam de DOM declaram jsdom por
    // arquivo, com o docblock:
    //   /** @vitest-environment jsdom */
    environment: "node",
    reporters: ["default"],
  },
});
