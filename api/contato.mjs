/**
 * Ponto de entrada da function POST /api/contato.
 *
 * Este arquivo e so o entrypoint exigido pela plataforma (um arquivo dentro de
 * `api/` = uma function). Nenhuma logica vive aqui: o pipeline (validacao,
 * honeypot, registro do consentimento LGPD, envio do e-mail) fica inteiro em
 * endpoint-contato/src/handler.js, com o contrato `(req, res)` agnostico de
 * provedor que os testes exercitam.
 *
 * Extensao .mjs, e nao .js: em projeto sem framework, uma function em
 * JavaScript precisa de `"type": "module"` no package.json OU da extensao
 * .mjs. Marcar o package.json da raiz como ESM passaria a valer tambem para
 * js/*.js, que sao UMD/CommonJS (usam `module.exports`) e quebrariam a suite de
 * testes do front-end.
 */

export { handler as default } from "../endpoint-contato/src/handler.js";
