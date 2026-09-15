/* ==========================================================================
   Dados do advogado / escritório — ÚNICA fonte da verdade
   Todo dado de contato e identificação que aparece nas páginas do site
   institucional vive AQUI. Trocar o telefone, o e-mail, o endereço ou a OAB
   significa editar uma linha deste arquivo — o HTML apenas MARCA onde cada
   dado entra, com os atributos data-dado* documentados abaixo.

   Os valores literais continuam escritos no HTML, então a página segue
   correta sem JavaScript (progressive enhancement): este script apenas
   reescreve os mesmos valores a partir da fonte única.

   Marcação no HTML (todos opcionais, podem coexistir no mesmo elemento):
     data-dado="chave"             -> textContent do elemento
     data-dado-href="chave"        -> atributo href
     data-dado-src="chave"         -> atributo src
     data-dado-alt="chave"         -> atributo alt
     data-dado-aria-label="chave"  -> atributo aria-label
   Cada destino aceita literais ao redor do valor, para os casos em que o dado
   é só um pedaço da string (ex. "mailto:" + e-mail):
     data-dado-prefixo / data-dado-sufixo                  (destino texto)
     data-dado-href-prefixo / data-dado-href-sufixo        (destino href)
     ... e assim para src, alt e aria-label.

   Chaves aceitas: caminhos dentro do objeto de dados ("foto.src", "bio.0")
   ou um dos valores derivados ("linkWhatsapp", "linkTelefone",
   "telefoneExibicao") — o telefone é guardado uma única vez, em dígitos.

   Publicação (padrão UMD, mesmo espírito de js/site-institucional.js):
     - navegador: window.DadosEscritorio (carregamento por <script src>)
     - Node:      module.exports (testes, sem bundler)
   ========================================================================== */
(function (raiz, fabrica) {
  'use strict';
  var api = fabrica();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  }
  if (raiz) raiz.DadosEscritorio = api;

  // Auto-aplicação no navegador. Os <script> ficam no fim do <body>, então o
  // conteúdo já está no DOM; o listener extra cobre o caso de o arquivo ser
  // movido para o <head>. aplicarDadosEscritorio é idempotente, aplicar duas
  // vezes não faz diferença.
  if (typeof document !== 'undefined') {
    api.aplicarDadosEscritorio(document);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        api.aplicarDadosEscritorio(document);
      });
    }
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* ----------------------------------------------------------------------
     OS DADOS. Editar aqui — e só aqui.
     ---------------------------------------------------------------------- */
  var DADOS = {
    nomeAdvogado: 'Dr. Lucas Andreucci da Veiga',

    // Somente dígitos (DDD + número). Os três formatos usados nas páginas
    // (link do WhatsApp, link tel: e texto exibido) são DERIVADOS deste
    // valor pelas funções abaixo — não existem como strings separadas.
    telefone: '11964048179',

    email: 'advlucasandreucci@outlook.com',
    endereco: 'Rua Tomé de Souza, 468 — Alto da Lapa, São Paulo/SP — CEP 05079-000',
    oab: '{{OAB/SP nº 000.000}}',

    foto: {
      src: 'img/Foto_drLucas.jpg',
      alt: 'Dr. Lucas Andreucci da Veiga, advogado criminalista'
    },

    bio: [
      'Advogado com atuação dedicada à área criminal, oferecendo defesa técnica e personalizada em todas as fases da persecução penal — desde a fase investigativa e inquérito policial até o processo judicial, recursos e execução da pena. O trabalho é pautado pela discrição, rigor técnico no estudo de cada caso e compromisso com uma comunicação clara e transparente com o cliente.',
      'Com sólida formação acadêmica e foco constante em atualização jurídica, atua na elaboração de estratégias defensivas estruturadas, prezando pela garantia dos direitos fundamentais e pelo devido processo legal. A conduta profissional orienta-se pela ética, sigilo absoluto e acompanhamento atento às especificidades de cada demanda.'
    ],

    formacao: 'Bacharel em Direito — Universidade Presbiteriana Mackenzie',
    especializacao: 'Pós-graduação em Direito Penal e Processual Penal'
  };

  // Código do país, usado nos dois links (wa.me e tel:).
  var DDI = '55';

  function digitos(valor) {
    return String(valor == null ? '' : valor).replace(/\D/g, '');
  }

  /* Link do WhatsApp: https://wa.me/55 + dígitos. */
  function linkWhatsapp(telefone) {
    return 'https://wa.me/' + DDI + digitos(telefone == null ? DADOS.telefone : telefone);
  }

  /* Link de clique-para-ligar: tel:+55 + dígitos. */
  function linkTelefone(telefone) {
    return 'tel:+' + DDI + digitos(telefone == null ? DADOS.telefone : telefone);
  }

  /* Telefone para leitura humana: "+55 11 96404-8179" (celular, 11 dígitos)
     ou "+55 11 3456-7890" (fixo, 10 dígitos). Fora desses dois tamanhos não
     há máscara conhecida, então devolve os dígitos com o DDI. */
  function telefoneExibicao(telefone) {
    var d = digitos(telefone == null ? DADOS.telefone : telefone);
    if (d.length !== 10 && d.length !== 11) return '+' + DDI + ' ' + d;
    var ddd = d.slice(0, 2);
    var resto = d.slice(2);
    var corte = resto.length - 4;
    return '+' + DDI + ' ' + ddd + ' ' + resto.slice(0, corte) + '-' + resto.slice(corte);
  }

  // Valores que não são guardados: são calculados a partir de DADOS.
  var DERIVADOS = {
    linkWhatsapp: linkWhatsapp,
    linkTelefone: linkTelefone,
    telefoneExibicao: telefoneExibicao
  };

  /* Resolve a chave de um data-dado: primeiro os derivados, depois o caminho
     dentro de DADOS ("foto.src", "bio.0"). Devolve null se não existir —
     quem chama simplesmente ignora o ponto. */
  function valorDaChave(chave) {
    if (!chave) return null;
    if (typeof DERIVADOS[chave] === 'function') return DERIVADOS[chave]();

    var atual = DADOS;
    var partes = chave.split('.');
    for (var i = 0; i < partes.length; i++) {
      if (atual == null || typeof atual !== 'object') return null;
      atual = atual[partes[i]];
    }
    return typeof atual === 'string' ? atual : null;
  }

  // Destinos suportados: atributo de marcação -> onde o valor é escrito.
  var DESTINOS = [
    { marca: 'data-dado', atributo: null },
    { marca: 'data-dado-href', atributo: 'href' },
    { marca: 'data-dado-src', atributo: 'src' },
    { marca: 'data-dado-alt', atributo: 'alt' },
    { marca: 'data-dado-aria-label', atributo: 'aria-label' }
  ];

  /* Preenche, em `documento`, todos os pontos marcados com data-dado*.
     Idempotente: cada ponto é sempre reescrito por completo a partir da fonte
     (prefixo + valor + sufixo), nunca acrescentado ao que já estava lá.
     Tolerante: página sem nenhum ponto, ponto com chave inexistente ou
     documento nulo não causam erro. Devolve quantos pontos foram escritos. */
  function aplicarDadosEscritorio(documento) {
    var doc = documento || (typeof document !== 'undefined' ? document : null);
    if (!doc || typeof doc.querySelectorAll !== 'function') return 0;

    var aplicados = 0;

    DESTINOS.forEach(function (destino) {
      var elementos = doc.querySelectorAll('[' + destino.marca + ']');
      Array.prototype.forEach.call(elementos, function (el) {
        var valor = valorDaChave(el.getAttribute(destino.marca));
        if (valor == null) return;

        var conteudo = (el.getAttribute(destino.marca + '-prefixo') || '') +
          valor +
          (el.getAttribute(destino.marca + '-sufixo') || '');

        if (destino.atributo) {
          el.setAttribute(destino.atributo, conteudo);
        } else {
          el.textContent = conteudo;
        }
        aplicados++;
      });
    });

    return aplicados;
  }

  return {
    dados: DADOS,
    linkWhatsapp: linkWhatsapp,
    linkTelefone: linkTelefone,
    telefoneExibicao: telefoneExibicao,
    valorDaChave: valorDaChave,
    aplicarDadosEscritorio: aplicarDadosEscritorio
  };
});
