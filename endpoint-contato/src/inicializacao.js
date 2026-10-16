/**
 * Inicializacao do Endpoint_de_Envio: roda a checagem de configuracao e falha
 * de forma decidivel quando o ambiente esta incompleto (task 10.1).
 *
 * Requisito 3.6; Design seccao Components item 3 (DD-05) e Error Handling.
 *
 * Este e o unico modulo do projeto com efeito colateral de inicializacao, e por
 * isso `src/handler.js` nao o importa: o contrato do handler continua agnostico
 * de provedor (DD-01) e importa-lo em teste nunca depende de ambiente
 * configurado. Quem faz o "wiring" e o ponto de entrada de deploy
 * (`src/index.js`), que chama `iniciar()` no carregamento do modulo — ou seja,
 * no cold start do processo/function, antes de qualquer requisicao.
 *
 * Tres formas de uso, todas provider-agnostic:
 *   - `import "./index.js"`            => fail-fast no cold start
 *   - `node src/inicializacao.js`      => smoke test de deploy (exit 1 se falta algo)
 *   - `npm run verificar-config`       => o mesmo, pelo script do package.json
 */

import { pathToFileURL } from "node:url";

import {
  ErroDeConfiguracao,
  VARIAVEIS_OBRIGATORIAS,
  relatorioConfiguracao,
  verificarConfiguracao
} from "./config.js";

const PREFIXO = "[endpoint-contato]";

/**
 * Executa a verificacao de configuracao, registra o resultado e lanca
 * `ErroDeConfiguracao` se alguma variavel obrigatoria estiver ausente.
 *
 * O log e sempre emitido — sucesso ou falha — para que uma configuracao
 * incompleta nunca passe em silencio (Design, Error Handling). Nenhum valor de
 * variavel e registrado, apenas nomes e estado.
 *
 * @param {{ env?: Record<string, string | undefined>, log?: Pick<Console, "log"|"warn"|"error"> }} [opcoes]
 * @returns {import("./config.js").ResultadoConfiguracao}
 */
export function iniciar({ env = process.env, log = console } = {}) {
  const resultado = verificarConfiguracao(env);

  if (resultado.ok) {
    log.log(
      `${PREFIXO} configuracao verificada: ${VARIAVEIS_OBRIGATORIAS.length} variaveis obrigatorias definidas.`
    );
    for (const aviso of resultado.avisos) log.warn(`${PREFIXO} aviso: ${aviso}`);
    return resultado;
  }

  log.error(`${PREFIXO} configuracao de ambiente incompleta — o servico nao pode iniciar:`);
  for (const linha of relatorioConfiguracao(resultado, env)) log.error(`${PREFIXO}   ${linha}`);

  throw new ErroDeConfiguracao(resultado.ausentes);
}

/**
 * Verifica a configuracao como comando de linha: encerra o processo com codigo
 * 1 quando o ambiente esta incompleto, 0 quando esta ok. Serve de smoke test de
 * deploy, sem depender do provedor de hospedagem escolhido.
 *
 * @param {{ env?: Record<string, string | undefined>, log?: Pick<Console, "log"|"warn"|"error"> }} [opcoes]
 * @returns {number} codigo de saida
 */
export function verificarComoComando(opcoes = {}) {
  try {
    iniciar(opcoes);
    return 0;
  } catch (erro) {
    if (erro instanceof ErroDeConfiguracao) return 1;
    throw erro;
  }
}

/**
 * true quando este arquivo foi executado diretamente (`node src/inicializacao.js`),
 * false quando apenas importado (inclusive por testes).
 * @returns {boolean}
 */
function executadoDiretamente() {
  const alvo = process.argv[1];
  if (typeof alvo !== "string" || alvo === "") return false;
  try {
    return import.meta.url === pathToFileURL(alvo).href;
  } catch {
    return false;
  }
}

if (executadoDiretamente()) {
  process.exit(verificarComoComando());
}
