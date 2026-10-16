/**
 * Validacao server-side do payload do Formulario_Publico_de_Contato.
 *
 * Implementada na task 6.1 (Design seccao Components item 3; Requisito 3.7;
 * DD-02, DD-06).
 *
 * Todas as funcoes deste modulo sao puras: nao leem ambiente, nao tocam disco,
 * nao fazem rede. Sao a unica barreira que importa para integridade dos dados
 * (a validacao do navegador e conveniencia de UX — DD-02).
 *
 * A logica de cpfValido/telefoneValido e a mesma da seccao 3 do design
 * (client-side), reimplementada aqui de forma independente porque roda em outro
 * ambiente (Node vs. browser) — DD-06.
 */

/** Chaves aceitas no corpo da requisicao (contrato HTTP do design, item 3). */
const CHAVES_ACEITAS = new Set([
  "nome",
  "email",
  "telefone",
  "cpf",
  "mensagem",
  "consentimentoLGPD",
  "_hp"
]);

/** Limites de tamanho do contrato HTTP. */
const MAX_NOME = 200;
const MAX_MENSAGEM = 2000;

/**
 * Formato de e-mail deliberadamente permissivo: parte local e dominio sem
 * espacos nem "@", dominio com ao menos um ponto. O objetivo aqui e barrar
 * corpo malformado (Requisito 3.7), nao arbitrar sobre a validade RFC de um
 * endereco — quem confirma que o e-mail existe e a propria resposta do
 * Dr. Lucas ao contato.
 */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Remove tudo que nao for digito.
 * @param {string} valor
 * @returns {string}
 */
export function apenasDigitos(valor) {
  if (typeof valor !== "string") return "";
  return valor.replace(/\D/g, "");
}

/**
 * Indica se o valor e ausente ou composto apenas de espacos.
 * Nulo, undefined e valores que nao sao string contam como em branco
 * (mesmo tratamento do client-side: `(v || "").trim().length === 0`).
 * @param {unknown} valor
 * @returns {boolean}
 */
export function ehEmBranco(valor) {
  if (typeof valor !== "string") return true;
  return valor.trim().length === 0;
}

/**
 * Valida CPF pelo algoritmo de digito verificador da Receita Federal,
 * rejeitando sequencias de 11 digitos iguais (Requisito 1.6).
 * Aceita o valor com ou sem mascara de exibicao.
 * @param {string} cpf
 * @returns {boolean}
 */
export function cpfValido(cpf) {
  const d = apenasDigitos(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // todos os digitos iguais: invalido

  const calcDigito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const base = d.slice(0, 9);
  const d1 = calcDigito(base);
  const d2 = calcDigito(base + String(d1));
  return d === base + String(d1) + String(d2);
}

/**
 * Valida telefone: exatamente 10 ou 11 digitos (Requisito 1.9).
 * Caracteres nao numericos presentes no valor sao ignorados (Property 5).
 * @param {string} telefone
 * @returns {boolean}
 */
export function telefoneValido(telefone) {
  const n = apenasDigitos(telefone).length;
  return n === 10 || n === 11;
}

/**
 * @typedef {Object} PayloadContato
 * @property {string} nome
 * @property {string} email
 * @property {string} telefone             digitos apenas, 10 ou 11 caracteres
 * @property {string} cpf                  digitos apenas, 11 caracteres
 * @property {string} mensagem             pode ser vazia, ate 2000 caracteres
 * @property {true}   consentimentoLGPD
 * @property {string} _hp                  honeypot; "" em requisicoes legitimas
 */

/**
 * @typedef {{ ok: true, dados: PayloadContato }
 *          | { ok: false, erro: "payload_invalido" | "consentimento_ausente" }}
 *          ResultadoValidacao
 */

const INVALIDO = Object.freeze({ ok: false, erro: "payload_invalido" });
const SEM_CONSENTIMENTO = Object.freeze({ ok: false, erro: "consentimento_ausente" });

/**
 * Indica se o corpo e um objeto simples (nao nulo, nao array).
 * @param {unknown} corpo
 * @returns {boolean}
 */
function ehObjetoSimples(corpo) {
  return typeof corpo === "object" && corpo !== null && !Array.isArray(corpo);
}

/**
 * Valida forma e conteudo do corpo da requisicao, sem nenhum efeito colateral.
 *
 * Rejeita com "payload_invalido": corpo que nao e objeto (inclusive string de
 * JSON malformado, array, null), chave nao prevista no contrato, campo
 * obrigatorio ausente/em branco/de tipo errado, nome acima de 200 caracteres,
 * mensagem acima de 2000 caracteres, e-mail fora de formato, CPF com digito
 * verificador invalido, telefone fora de 10-11 digitos, consentimentoLGPD
 * presente mas nao booleano, `_hp` presente mas nao string.
 *
 * Rejeita com "consentimento_ausente": consentimentoLGPD ausente ou `false`
 * (Requisito 2.3 reforcado no servidor; tabela de Error Handling do design).
 *
 * `mensagem` e `_hp` sao opcionais quanto a presenca (o contrato so exige valor
 * para nome/email/telefone/cpf/consentimentoLGPD); quando ausentes, assumem ""
 * em `dados`, de modo que o handler sempre recebe o payload completo. Se
 * presentes, precisam ser string.
 *
 * A rejeicao por honeypot preenchido nao acontece aqui: `_hp` e apenas validado
 * como string e repassado em `dados`, para o handler decidir (task 9.1, DD-08).
 *
 * @param {unknown} corpo
 * @returns {ResultadoValidacao}
 */
export function validarPayloadContato(corpo) {
  if (!ehObjetoSimples(corpo)) return INVALIDO;

  for (const chave of Object.keys(corpo)) {
    if (!CHAVES_ACEITAS.has(chave)) return INVALIDO;
  }

  // Consentimento antes dos demais campos: e o unico erro com codigo proprio.
  const consentimento = corpo.consentimentoLGPD;
  if (consentimento === undefined || consentimento === null || consentimento === false) {
    return SEM_CONSENTIMENTO;
  }
  if (consentimento !== true) return INVALIDO; // ex.: string "true", 1, {}

  const { nome, email, telefone, cpf } = corpo;
  if (typeof nome !== "string" || typeof email !== "string") return INVALIDO;
  if (typeof telefone !== "string" || typeof cpf !== "string") return INVALIDO;

  const mensagem = corpo.mensagem === undefined ? "" : corpo.mensagem;
  if (typeof mensagem !== "string") return INVALIDO;
  if (mensagem.length > MAX_MENSAGEM) return INVALIDO;

  const hp = corpo._hp === undefined ? "" : corpo._hp;
  if (typeof hp !== "string") return INVALIDO;

  if (ehEmBranco(nome) || nome.trim().length > MAX_NOME) return INVALIDO;
  if (ehEmBranco(email) || !FORMATO_EMAIL.test(email.trim())) return INVALIDO;
  if (ehEmBranco(telefone) || !telefoneValido(telefone)) return INVALIDO;
  if (ehEmBranco(cpf) || !cpfValido(cpf)) return INVALIDO;

  return {
    ok: true,
    dados: {
      nome: nome.trim(),
      email: email.trim(),
      telefone: apenasDigitos(telefone), // DP-03 — sem mascara
      cpf: apenasDigitos(cpf), // DP-03 — sem mascara
      mensagem: mensagem.trim(),
      consentimentoLGPD: true,
      _hp: hp // valor cru: o handler compara com "" (DD-08)
    }
  };
}
