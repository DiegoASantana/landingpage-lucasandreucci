/**
 * Ponto de entrada de deploy do Endpoint_de_Envio (task 10.1).
 *
 * Importar este modulo verifica a configuracao de ambiente no cold start e
 * lanca `ErroDeConfiguracao` se faltar alguma variavel obrigatoria — o servico
 * falha de forma decidivel na inicializacao, antes de atender qualquer
 * Visitante (Requisito 3.6; Design DD-05 e Error Handling).
 *
 * O handler em si continua exportado sem alteracao de contrato (DD-01), de modo
 * que qualquer provedor pode apontar para `src/index.js` (com fail-fast) ou
 * diretamente para `src/handler.js` (sem fail-fast, como nos testes).
 */

import { iniciar } from "./inicializacao.js";
import { handler } from "./handler.js";

iniciar();

export { handler };
export default handler;
