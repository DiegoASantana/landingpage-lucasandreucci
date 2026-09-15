/* ==========================================================================
   Cerne — Site Institucional
   JS vanilla mínimo: alterna o menu de navegação no mobile.
   Progressive enhancement: a página funciona sem este script.
   ========================================================================== */
(function () {
  'use strict';

  // Este arquivo também é carregado em Node (Vitest) para exercitar as funções
  // puras do núcleo de validação. Sem DOM, os blocos de comportamento saem.
  if (typeof document === 'undefined') return;

  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  function openMenu() {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu de navegação');
  }

  function closeMenu() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu de navegação');
  }

  toggle.addEventListener('click', function () {
    if (nav.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Fecha o menu ao clicar em um link de navegação (mobile).
  nav.addEventListener('click', function (e) {
    var target = e.target;
    if (target && target.tagName === 'A') {
      closeMenu();
    }
  });

  // Fecha o menu com a tecla Esc (acessibilidade / teclado).
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });
})();

/* ==========================================================================
   Áreas de atuação — transição de elemento único (shared-element / FLIP)
   Cada .area-card é O MESMO elemento do início ao fim: ao ativar, capturamos
   seu getBoundingClientRect(), fixamos o card nessa posição exata (position:
   fixed com top/left/width/height em px — visualmente nada muda ainda) e, no
   frame seguinte, animamos esse retângulo até um tamanho/posição centralizado
   na tela AO MESMO TEMPO em que giramos .area-card-flip em 180deg. A troca de
   conteúdo (resumo -> texto detalhado) acontece automaticamente pela física
   do 3D CSS (backface-visibility), sem o JS precisar cronometrar quando
   trocar texto. Fechar reverte exatamente o mesmo processo.
   Um placeholder (mesmo tamanho do card) é inserido no grid enquanto o card
   flutua, para os demais itens não reajustarem/colapsarem.
   Progressive enhancement: sem este script, os cards mostram apenas a face
   frontal (resumo); a face de verso permanece com [hidden] e nunca é
   revelada, então não há expansão — mas o conteúdo essencial já está visível.
   ========================================================================== */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var backdrop = document.getElementById('area-card-backdrop');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.area-grid .area-card'));
  if (!backdrop || !cards.length) return;

  var reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function prefersReducedMotion() {
    return !!(reduceMotionQuery && reduceMotionQuery.matches);
  }

  // Duração da transição de posição/tamanho e do giro. Precisa bater com o
  // token --area-flip-duration definido em :root em css/site-institucional.css
  // (é lá que a velocidade do efeito é ajustada). Serve para o fallback de
  // segurança (setTimeout) não disparar nem antes nem muito depois do
  // transitionend real.
  var TRANSITION_MS = 700;

  var activeCard = null;
  var placeholder = null;

  function focusableElements(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.hasAttribute('disabled'); });
  }

  function trapFocus(e) {
    if (!activeCard || e.key !== 'Tab') return;
    var back = activeCard.querySelector('.area-card-face--back');
    if (!back) return;
    var focusables = focusableElements(back);
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeAreaCard();
    } else {
      trapFocus(e);
    }
  }

  function onBackdropMouseDown(e) {
    if (e.target === backdrop) {
      closeAreaCard();
    }
  }

  // Calcula o retângulo de destino (centralizado na viewport) para onde o
  // card deve crescer/mover ao expandir.
  function getTargetRect() {
    var width = Math.min(560, window.innerWidth * 0.92);
    var height = Math.min(window.innerHeight * 0.72, 560);
    var left = (window.innerWidth - width) / 2;
    var top = (window.innerHeight - height) / 2;
    return { top: top, left: left, width: width, height: height };
  }

  function applyRect(card, rect) {
    card.style.top = rect.top + 'px';
    card.style.left = rect.left + 'px';
    card.style.width = rect.width + 'px';
    card.style.height = rect.height + 'px';
  }

  function openAreaCard(card) {
    if (activeCard) return;

    var front = card.querySelector('.area-card-face--front');
    var back = card.querySelector('.area-card-face--back');
    if (!back) return;

    activeCard = card;

    var startRect = card.getBoundingClientRect();

    // Placeholder com o mesmo tamanho do card, inserido no lugar dele no
    // grid, para os demais cards não reajustarem/colapsarem enquanto este
    // fica fora do fluxo normal (position: fixed).
    placeholder = document.createElement('div');
    placeholder.className = 'area-card-placeholder';
    placeholder.style.width = startRect.width + 'px';
    placeholder.style.height = startRect.height + 'px';
    card.parentNode.insertBefore(placeholder, card);

    document.body.classList.add('area-modal-locked');
    backdrop.hidden = false;

    back.hidden = false;
    card.setAttribute('aria-expanded', 'true');

    if (prefersReducedMotion()) {
      // Sem animação: aplica o estado final diretamente.
      var target = getTargetRect();
      card.classList.add('is-floating');
      applyRect(card, target);
      card.classList.add('is-expanded');
      backdrop.classList.add('is-visible');
      if (front) front.setAttribute('aria-hidden', 'true');
      finishOpenFocus(back);
      document.addEventListener('keydown', onKeydown);
      backdrop.addEventListener('mousedown', onBackdropMouseDown);
      return;
    }

    // 1) Fixa o card na posição/tamanho atuais (nada muda visualmente ainda).
    card.classList.add('is-floating');
    applyRect(card, startRect);

    // Força reflow para o navegador "confirmar" o estado inicial antes de
    // aplicarmos o estado final — sem isso as duas mudanças seriam
    // agrupadas e a transição não ocorreria.
    // eslint-disable-next-line no-unused-expressions
    card.offsetHeight;

    // 2) No frame seguinte, anima até o retângulo centralizado E gira a
    // face ao mesmo tempo (mesma duração/timing definidos em CSS).
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var target = getTargetRect();
        applyRect(card, target);
        card.classList.add('is-expanded');
        backdrop.classList.add('is-visible');
        if (front) front.setAttribute('aria-hidden', 'true');
      });
    });

    document.addEventListener('keydown', onKeydown);
    backdrop.addEventListener('mousedown', onBackdropMouseDown);

    var handled = false;
    card.addEventListener('transitionend', function onEnd(e) {
      if (handled || e.target !== card || e.propertyName !== 'width') return;
      handled = true;
      card.removeEventListener('transitionend', onEnd);
      finishOpenFocus(back);
    });
    setTimeout(function () {
      if (!handled) { handled = true; finishOpenFocus(back); }
    }, TRANSITION_MS + 80);
  }

  function finishOpenFocus(back) {
    var closeBtn = back.querySelector('.area-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeAreaCard() {
    if (!activeCard) return;

    var card = activeCard;
    var front = card.querySelector('.area-card-face--front');
    var back = card.querySelector('.area-card-face--back');

    document.removeEventListener('keydown', onKeydown);
    backdrop.removeEventListener('mousedown', onBackdropMouseDown);

    card.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('is-visible');

    function finishClose() {
      card.classList.remove('is-floating', 'is-expanded');
      card.style.top = '';
      card.style.left = '';
      card.style.width = '';
      card.style.height = '';
      if (back) back.hidden = true;
      if (front) front.removeAttribute('aria-hidden');
      backdrop.hidden = true;
      document.body.classList.remove('area-modal-locked');

      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      placeholder = null;

      card.focus();
      activeCard = null;
    }

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    // Recalcula o rect original a partir do placeholder (lida com scroll ou
    // resize ocorridos enquanto o card estava expandido) e reverte, na mesma
    // duração/timing, tanto a posição/tamanho quanto o giro.
    var originalRect = placeholder
      ? placeholder.getBoundingClientRect()
      : card.getBoundingClientRect();

    card.classList.remove('is-expanded');
    if (front) front.removeAttribute('aria-hidden');
    applyRect(card, originalRect);

    var handled = false;
    card.addEventListener('transitionend', function onEnd(e) {
      if (handled || e.target !== card || e.propertyName !== 'width') return;
      handled = true;
      card.removeEventListener('transitionend', onEnd);
      finishClose();
    });
    setTimeout(function () {
      if (!handled) { handled = true; finishClose(); }
    }, TRANSITION_MS + 80);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      openAreaCard(card);
    });
    card.addEventListener('keydown', function (e) {
      if (card.classList.contains('is-floating')) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openAreaCard(card);
      }
    });

    var closeBtn = card.querySelector('.area-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeAreaCard();
      });
    }
  });
})();

/* ==========================================================================
   Núcleo de validação do formulário público de contato — funções PURAS
   Nenhuma delas toca o DOM: recebem valores, devolvem valores. É essa
   pureza que permite testá-las isoladamente em Node (Vitest/fast-check)
   e que mantém uma única fonte da verdade das regras de validação.

   Regras implementadas (requirements.md, Fase 1):
     1.3 / 1.4 — Nome, E-mail, Telefone e CPF obrigatórios ("Este campo é obrigatório.")
     1.6       — CPF válido pelo dígito verificador da Receita Federal ("CPF inválido.")
     1.9       — Telefone com exatamente 10 ou 11 dígitos ("Telefone inválido.")
     1.11      — E-mail em formato válido ("E-mail inválido.")
     2.3       — Consentimento LGPD obrigatório

   Publicação (padrão UMD, mesmo espírito de window.Masks em js/masks.js):
     - navegador: window.ValidacaoContato (carregamento por <script src>)
     - Node:      module.exports (testes, sem bundler)
   ========================================================================== */
(function (raiz, fabrica) {
  'use strict';
  var api = fabrica();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  }
  if (raiz) raiz.ValidacaoContato = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* Extrai apenas os dígitos de um valor, na ordem em que aparecem.
     Função total: qualquer entrada devolve string (nunca lança). */
  function apenasDigitos(v) {
    if (v == null) return '';
    return String(v).replace(/\D/g, '');
  }

  /* Campo "em branco": vazio, só espaços/tabs, nulo ou indefinido. */
  function ehEmBranco(v) {
    if (v == null) return true;
    return String(v).trim().length === 0;
  }

  /* CPF válido pelo algoritmo de dígito verificador da Receita Federal.
     Aceita o valor com ou sem máscara. Sequências de 11 dígitos iguais
     (000.000.000-00, 111.111.111-11, ...) passam pelo cálculo, mas são
     tratadas como inválidas pela Receita — por isso a rejeição explícita. */
  function cpfValido(cpfComOuSemMascara) {
    var d = apenasDigitos(cpfComOuSemMascara);
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;

    function calcDigito(base) {
      var soma = 0;
      for (var i = 0; i < base.length; i++) {
        soma += Number(base[i]) * (base.length + 1 - i);
      }
      var resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    }

    var d1 = calcDigito(d.slice(0, 9));
    var d2 = calcDigito(d.slice(0, 9) + String(d1));
    return d === d.slice(0, 9) + String(d1) + String(d2);
  }

  /* Telefone brasileiro: válido se e somente se tem 10 (fixo) ou 11
     (celular) dígitos, independentemente da máscara de exibição. */
  function telefoneValido(telComOuSemMascara) {
    var n = apenasDigitos(telComOuSemMascara).length;
    return n === 10 || n === 11;
  }

  /* Formato de e-mail (Requisito 1.11): parte local, "@" e domínio com ao
     menos um ponto, sem espaços. Deliberadamente permissivo e idêntico ao
     formato aceito pelo Endpoint_de_Envio (endpoint-contato FORMATO_EMAIL) —
     o objetivo é barrar entrada malformada antes do envio, não arbitrar sobre
     validade RFC. Existe em JS porque o <form> usa `novalidate` (DD-11): a
     checagem nativa de type="email" não roda, e as mensagens literais dos
     requisitos não podem vir das bolhas do navegador. */
  var FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function emailValido(email) {
    if (email == null) return false;
    return FORMATO_EMAIL.test(String(email).trim());
  }

  /* Valida o formulário inteiro: valores -> mapa de erros por campo.
     Devolve {} quando não há erro. Nunca altera o objeto recebido nem
     toca o DOM — quem exibe os erros é outra camada (ver task 4.1). */
  function validarFormularioContato(v) {
    var valores = v || {};
    var erros = {};

    if (ehEmBranco(valores.nome)) erros.nome = 'Este campo é obrigatório.';

    if (ehEmBranco(valores.email)) erros.email = 'Este campo é obrigatório.';
    else if (!emailValido(valores.email)) erros.email = 'E-mail inválido.';

    if (ehEmBranco(valores.telefone)) erros.telefone = 'Este campo é obrigatório.';
    else if (!telefoneValido(valores.telefone)) erros.telefone = 'Telefone inválido.';

    if (ehEmBranco(valores.cpf)) erros.cpf = 'Este campo é obrigatório.';
    else if (!cpfValido(valores.cpf)) erros.cpf = 'CPF inválido.';

    if (!valores.consentimentoLGPD) {
      erros.consentimento = 'É necessário concordar com o tratamento de dados para enviar o formulário.';
    }

    return erros;
  }

  return {
    apenasDigitos: apenasDigitos,
    ehEmBranco: ehEmBranco,
    cpfValido: cpfValido,
    telefoneValido: telefoneValido,
    emailValido: emailValido,
    validarFormularioContato: validarFormularioContato
  };
});

/* ==========================================================================
   Máscaras declarativas do formulário de contato
   Ativa as máscaras data-mask="telefone" / data-mask="cpf" de js/masks.js
   (Requisitos 1.5 e 1.7). O HTML é estático, então basta varrer o documento
   uma vez. initMasks é idempotente (guarda dataset.maskBound).
   Progressive enhancement: sem masks.js os campos seguem utilizáveis.
   ========================================================================== */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (typeof window.initMasks === 'function') window.initMasks(document);
})();

/* ==========================================================================
   Submissão do formulário público de contato (Requisitos 1.8, 1.10, 3.3, 3.4)
   Design: seção "Components and Interfaces", item 2.

   Divisão de responsabilidades:
     - validarFormularioContato (bloco acima) é pura e decide SE envia;
     - exibirErros / exibirSucesso / exibirErroEnvio / definirCarregando são as
       ÚNICAS funções que tocam o DOM, e NENHUMA delas limpa valores de campo
       (Requisitos 1.10 e 2.3). O único ponto que limpa o formulário é o
       form.reset() do ramo de sucesso.

   Publicação (mesmo padrão UMD do núcleo de validação):
     - navegador: window.inicializarFormularioContato + auto-init de #form-contato
     - Node:      module.exports.inicializarFormularioContato (testes com jsdom)
   ========================================================================== */
(function (raiz) {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIGURAÇÃO — ÚNICO lugar onde a URL do Endpoint_de_Envio é definida.
     O host do endpoint ainda não está decidido (design.md — "Fora do escopo":
     a escolha do provedor de hospedagem do Endpoint_de_Envio). Por isso o
     padrão é um caminho RELATIVO: funciona sem alteração quando o endpoint
     for servido no mesmo domínio do site institucional, que é o cenário mais
     provável, e não vaza nome de provedor nenhum para o HTML publicado.
     Quando o host for decidido, há duas formas de apontar para ele sem mexer
     em mais nenhuma linha deste arquivo:
       1. trocar o valor da constante abaixo por uma URL absoluta; ou
       2. declarar data-endpoint="https://..." no <form id="form-contato">
          (útil para abrir o protótipo via file:// contra um endpoint remoto).
     ---------------------------------------------------------------------- */
  var ENDPOINT_CONTATO_URL = '/api/contato';

  // Mensagens literais exigidas pelos requisitos (3.3 e 1.10/3.4).
  var MSG_SUCESSO = 'Recebemos seu contato. Em breve retornaremos.';
  var MSG_ERRO_ENVIO = 'Não foi possível enviar o formulário. Tente novamente em alguns instantes.';
  // Requisito 1.13 — o endpoint recusou os dados (400): mensagem distinta da
  // falha de envio, porque a ação do Visitante também é distinta (revisar o
  // que digitou, em vez de tentar de novo mais tarde).
  var MSG_ERRO_DADOS = 'Não foi possível enviar: revise os dados informados e tente novamente.';

  // Chave de erro devolvida por validarFormularioContato -> id do <span> de
  // erro no HTML -> nome do campo que recebe o foco/aria-invalid.
  var CAMPOS = [
    { chave: 'nome', idErro: 'erro-nome', campo: 'nome' },
    { chave: 'email', idErro: 'erro-email', campo: 'email' },
    { chave: 'telefone', idErro: 'erro-telefone', campo: 'telefone' },
    { chave: 'cpf', idErro: 'erro-cpf', campo: 'cpf' },
    { chave: 'consentimento', idErro: 'erro-consentimento', campo: 'consentimentoLGPD' }
  ];

  // Núcleo de validação publicado pelo bloco anterior deste mesmo arquivo.
  function nucleo() {
    if (typeof module === 'object' && module !== null && module.exports &&
        typeof module.exports.validarFormularioContato === 'function') {
      return module.exports;
    }
    return (raiz && raiz.ValidacaoContato) || null;
  }

  function doc(form) {
    return form.ownerDocument || (typeof document !== 'undefined' ? document : null);
  }

  function elemento(form, id) {
    var d = doc(form);
    return d ? d.getElementById(id) : null;
  }

  function campo(form, nome) {
    return (form.elements && form.elements.namedItem) ? form.elements.namedItem(nome) : null;
  }

  function valorDe(form, nome) {
    var el = campo(form, nome);
    return el && typeof el.value === 'string' ? el.value : '';
  }

  /* Área de status do envio (#erro-envio): já vem com aria-live="polite" no
     HTML, então tanto o erro de envio quanto o sucesso são anunciados por
     leitor de tela sem precisar mover o foco do Visitante. */
  function areaStatus(form) {
    return elemento(form, 'erro-envio');
  }

  function esconderStatus(form) {
    var status = areaStatus(form);
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
    status.classList.remove('form-status--sucesso');
    status.classList.add('field-error');
  }

  /* Limpa apenas a APRESENTAÇÃO dos erros — nunca os valores digitados. */
  function limparErros(form) {
    CAMPOS.forEach(function (item) {
      var alvo = elemento(form, item.idErro);
      if (alvo) {
        alvo.hidden = true;
        alvo.textContent = '';
      }
      var entrada = campo(form, item.campo);
      if (entrada) {
        entrada.classList.remove('error');
        entrada.removeAttribute('aria-invalid');
      }
    });
    esconderStatus(form);
  }

  /* Requisitos 1.3, 1.4, 1.6, 1.9, 2.3 — exibe a mensagem de cada campo
     inválido e devolve o foco ao primeiro deles. Não altera valores. */
  function exibirErros(form, erros) {
    var primeiroInvalido = null;

    CAMPOS.forEach(function (item) {
      var mensagem = erros ? erros[item.chave] : null;
      var alvo = elemento(form, item.idErro);
      var entrada = campo(form, item.campo);
      if (!mensagem) return;

      if (alvo) {
        alvo.textContent = mensagem;
        alvo.hidden = false;
      }
      if (entrada) {
        entrada.classList.add('error');
        entrada.setAttribute('aria-invalid', 'true');
        // Liga o campo à sua mensagem de erro para que o leitor de tela a
        // anuncie junto com o rótulo ao receber o foco. O aria-describedby
        // original (o aviso de LGPD, no caso do checkbox) é preservado.
        if (alvo && alvo.id) {
          var descrito = (entrada.getAttribute('aria-describedby') || '').split(/\s+/)
            .filter(function (parte) { return parte && parte !== alvo.id; });
          descrito.push(alvo.id);
          entrada.setAttribute('aria-describedby', descrito.join(' '));
        }
        if (!primeiroInvalido) primeiroInvalido = entrada;
      }
    });

    if (primeiroInvalido && typeof primeiroInvalido.focus === 'function') {
      primeiroInvalido.focus();
    }
  }

  /* Requisito 3.3 — confirmação de recebimento. */
  function exibirSucesso(form, mensagem) {
    var status = areaStatus(form);
    if (!status) return;
    status.classList.remove('field-error');
    status.classList.add('form-status--sucesso');
    status.textContent = mensagem;
    status.hidden = false;
  }

  /* Requisitos 1.10 e 3.4 — falha de envio. Só escreve a mensagem: os valores
     digitados continuam nos campos porque nada aqui os toca. */
  function exibirErroEnvio(form, mensagem) {
    var status = areaStatus(form);
    if (!status) return;
    status.classList.remove('form-status--sucesso');
    status.classList.add('field-error');
    status.textContent = mensagem;
    status.hidden = false;
  }

  /* Estado de carregamento do botão de envio.
     Usa aria-disabled + guarda de reentrância em vez do atributo `disabled`:
     desabilitar o botão que acabou de ser acionado pelo teclado tira o foco
     do elemento (o foco cai no <body>) e o Visitante perde a posição na
     página. Com aria-disabled o botão continua focável e anunciado, e o
     bloqueio de duplo envio é feito no handler. */
  function definirCarregando(form, carregando) {
    var botao = elemento(form, 'btn-enviar-contato');
    if (!botao) return;

    if (carregando) {
      if (botao.dataset && botao.dataset.rotuloOriginal == null) {
        botao.dataset.rotuloOriginal = botao.textContent;
      }
      botao.setAttribute('aria-disabled', 'true');
      botao.setAttribute('aria-busy', 'true');
      botao.classList.add('is-loading');
      botao.textContent = 'Enviando...';
      return;
    }

    botao.removeAttribute('aria-disabled');
    botao.removeAttribute('aria-busy');
    botao.classList.remove('is-loading');
    if (botao.dataset && botao.dataset.rotuloOriginal != null) {
      botao.textContent = botao.dataset.rotuloOriginal;
      delete botao.dataset.rotuloOriginal;
    }
  }

  /* Valores crus do formulário, do jeito que o Visitante os digitou (com
     máscara) — é essa forma que validarFormularioContato espera. */
  function montarValores(form) {
    var consentimento = campo(form, 'consentimentoLGPD');
    return {
      nome: valorDe(form, 'nome'),
      email: valorDe(form, 'email'),
      telefone: valorDe(form, 'telefone'),
      cpf: valorDe(form, 'cpf'),
      mensagem: valorDe(form, 'mensagem'),
      consentimentoLGPD: !!(consentimento && consentimento.checked),
      _hp: valorDe(form, '_hp') // sempre vazio para humanos; enviado do mesmo jeito
    };
  }

  /* Requisito 1.8 — Telefone e CPF vão ao Endpoint_de_Envio SEM máscara.
     O honeypot é transmitido como está: quem decide rejeitar por honeypot
     preenchido é o servidor, não o navegador. */
  function montarCorpo(valores, apenasDigitos) {
    return {
      nome: valores.nome.trim(),
      email: valores.email.trim(),
      telefone: apenasDigitos(valores.telefone),
      cpf: apenasDigitos(valores.cpf),
      mensagem: valores.mensagem.trim(),
      consentimentoLGPD: true,
      _hp: valores._hp
    };
  }

  /* Liga o handler de submit a um <form>. `opcoes.url` e `opcoes.fetch`
     existem para os testes (e para um deploy que injete a URL em runtime);
     em produção nenhum dos dois é necessário.
     Devolve as funções de apresentação — o handler devolve uma Promise, o que
     permite aguardar o fim do envio em teste sem timers. */
  function inicializarFormularioContato(form, opcoes) {
    if (!form || typeof form.addEventListener !== 'function') return null;

    var config = opcoes || {};
    var api = nucleo();
    if (!api) return null;

    var url = config.url ||
      (form.getAttribute && form.getAttribute('data-endpoint')) ||
      ENDPOINT_CONTATO_URL;

    var requisicao = config.fetch ||
      (typeof fetch === 'function' ? function (u, o) { return fetch(u, o); } : null);

    var enviando = false;

    function aoSubmeter(evento) {
      if (evento && typeof evento.preventDefault === 'function') evento.preventDefault();
      if (enviando) return Promise.resolve();

      limparErros(form);

      var valores = montarValores(form);
      var erros = api.validarFormularioContato(valores);
      if (Object.keys(erros).length > 0) {
        // Requisitos 1.3, 1.4, 1.6, 1.9, 2.3 — não submete e preserva valores.
        exibirErros(form, erros);
        return Promise.resolve();
      }

      if (!requisicao) {
        exibirErroEnvio(form, MSG_ERRO_ENVIO);
        return Promise.resolve();
      }

      enviando = true;
      definirCarregando(form, true);

      return Promise.resolve()
        .then(function () {
          return requisicao(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(montarCorpo(valores, api.apenasDigitos))
          });
        })
        .then(function (resposta) {
          // Requisito 1.13 — 400 é recusa dos dados pelo Endpoint_de_Envio
          // (payload_invalido / consentimento_ausente): a validação do
          // navegador e a do servidor divergiram em algum ponto, e o Visitante
          // precisa revisar o que digitou, não tentar de novo mais tarde.
          if (resposta && resposta.status === 400) throw new Error('dados-recusados');
          // Requisitos 1.10 e 3.4 — 502 e qualquer outra resposta não-2xx são
          // falha de envio, não recusa de dado.
          if (!resposta || !resposta.ok) throw new Error('envio-falhou');
          exibirSucesso(form, MSG_SUCESSO); // Requisito 3.3
          form.reset();
        })
        .catch(function (erro) {
          // Requisitos 1.10, 1.13 e 3.4 — mensagem de falha; form.reset() NÃO é
          // chamado em nenhum destes ramos, então tudo que o Visitante digitou
          // permanece nos campos.
          var recusa = erro && erro.message === 'dados-recusados';
          exibirErroEnvio(form, recusa ? MSG_ERRO_DADOS : MSG_ERRO_ENVIO);
        })
        .then(function () {
          enviando = false;
          definirCarregando(form, false);
        });
    }

    form.addEventListener('submit', aoSubmeter);

    return {
      url: url,
      aoSubmeter: aoSubmeter,
      limparErros: function () { return limparErros(form); },
      exibirErros: function (erros) { return exibirErros(form, erros); },
      exibirSucesso: function (mensagem) { return exibirSucesso(form, mensagem || MSG_SUCESSO); },
      exibirErroEnvio: function (mensagem) { return exibirErroEnvio(form, mensagem || MSG_ERRO_ENVIO); },
      definirCarregando: function (carregando) { return definirCarregando(form, carregando); }
    };
  }

  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports.inicializarFormularioContato = inicializarFormularioContato;
    module.exports.ENDPOINT_CONTATO_URL = ENDPOINT_CONTATO_URL;
    module.exports.MSG_SUCESSO = MSG_SUCESSO;
    module.exports.MSG_ERRO_ENVIO = MSG_ERRO_ENVIO;
    module.exports.MSG_ERRO_DADOS = MSG_ERRO_DADOS;
  }
  if (raiz) raiz.inicializarFormularioContato = inicializarFormularioContato;

  // Auto-init no navegador. Sem DOM (Node puro), nada acontece.
  if (typeof document !== 'undefined') {
    var formContato = document.getElementById('form-contato');
    if (formContato) inicializarFormularioContato(formContato);
  }
})(typeof window !== 'undefined' ? window : null);
