/* ==========================================================================
   Cerne — Dados fictícios (mock data)
   Protótipo navegável — nenhum dado é persistido em backend real.
   Os dados ficam em localStorage para simular persistência entre páginas.
   ========================================================================== */

const MOCK_ESCRITORIO = {
  nome: "Lucas Andreucci — Advocacia Criminal",
  advogado: "Dr. Lucas Andreucci da Veiga",
  oab: "OAB/SP 000.000 (exemplo)",
  cnpj: "12.345.678/0001-90",
  telefone: "(11) 96404-8179",
  email: "contato@lucasandreucci.adv.br",
  endereco: "Av. Paulista, 1000, Sala 501 — Bela Vista, São Paulo/SP"
};

const MOCK_CLIENTES = [
  { id: 1, tipo: "PF", nome: "João Silva", doc: "123.456.789-00", email: "joao.silva@email.com", telefone: "(11) 99999-0001", status: "ativo", cidade: "São Paulo", uf: "SP", criadoEm: "2025-03-01" },
  { id: 2, tipo: "PF", nome: "Maria Souza", doc: "987.654.321-00", email: "maria.souza@email.com", telefone: "(11) 98888-0002", status: "ativo", cidade: "São Paulo", uf: "SP", criadoEm: "2025-04-12" },
  { id: 3, tipo: "PJ", nome: "Cia ABC Ltda", doc: "00.000.000/0001-00", email: "contato@ciaabc.com", telefone: "(11) 3333-0003", status: "ativo", cidade: "São Paulo", uf: "SP", criadoEm: "2024-11-20" },
  { id: 4, tipo: "PF", nome: "Roberto Andrade", doc: "111.222.333-44", email: "roberto.andrade@email.com", telefone: "(21) 97777-0004", status: "inativo", cidade: "Rio de Janeiro", uf: "RJ", criadoEm: "2024-06-10" },
  { id: 5, tipo: "PF", nome: "Ana Paula Ferreira", doc: "222.333.444-55", email: "ana.ferreira@email.com", telefone: "(11) 96666-0005", status: "ativo", cidade: "Campinas", uf: "SP", criadoEm: "2025-06-05" },
  { id: 6, tipo: "PJ", nome: "Tech Solutions S.A.", doc: "11.222.333/0001-44", email: "juridico@techsolutions.com", telefone: "(11) 4444-0006", status: "ativo", cidade: "São Paulo", uf: "SP", criadoEm: "2025-01-15" },
  { id: 7, tipo: "PF", nome: "João Mendes", doc: "999.888.777-00", email: "joao.mendes@email.com", telefone: "(11) 95555-0007", status: "ativo", cidade: "Guarulhos", uf: "SP", criadoEm: "2025-07-01" }
];

const MOCK_PROCESSOS = [
  { id: 1, titulo: "Ação de Cobrança", clienteId: 1, cnj: "0001234-56.2026.8.26.0100", tribunal: "TJSP", vara: "2ª Vara Cível de São Paulo", tipoAcao: "Cobrança", poloCliente: "Autor", parteAutora: "João Silva", parteRe: "Devedor Ltda", status: "andamento", valorCausa: 15000, abertura: "2026-03-01" },
  { id: 2, titulo: "Reclamação Trabalhista", clienteId: 1, cnj: "0005678-90.2026.5.02.0030", tribunal: "TRT-2", vara: "30ª Vara do Trabalho de SP", tipoAcao: "Trabalhista", poloCliente: "Autor", parteAutora: "João Silva", parteRe: "Empresa XYZ", status: "andamento", valorCausa: 32000, abertura: "2026-01-15" },
  { id: 3, titulo: "Indenização por Danos Morais", clienteId: 2, cnj: null, tribunal: null, vara: null, tipoAcao: "Indenização", poloCliente: "Autor", parteAutora: "Maria Souza", parteRe: "A definir", status: "suspenso", valorCausa: 8000, abertura: "2025-06-10" },
  { id: 4, titulo: "Contrato de Rescisão", clienteId: 3, cnj: "0009999-11.2025.8.26.0002", tribunal: "TJSP", vara: "5ª Vara Empresarial", tipoAcao: "Contratual", poloCliente: "Réu", parteAutora: "Fornecedor SA", parteRe: "Cia ABC Ltda", status: "encerrado", valorCausa: 45000, abertura: "2024-11-05" },
  { id: 5, titulo: "Ação Revisional de Contrato", clienteId: 5, cnj: "0002222-33.2026.8.26.0100", tribunal: "TJSP", vara: "1ª Vara Cível", tipoAcao: "Revisional", poloCliente: "Autor", parteAutora: "Ana Paula Ferreira", parteRe: "Banco Nacional", status: "andamento", valorCausa: 12000, abertura: "2026-06-20" },
  { id: 6, titulo: "Disputa Societária", clienteId: 6, cnj: "0003333-44.2026.8.26.0100", tribunal: "TJSP", vara: "3ª Vara Empresarial", tipoAcao: "Societário", poloCliente: "Autor", parteAutora: "Tech Solutions S.A.", parteRe: "Sócio Retirante", status: "andamento", valorCausa: 120000, abertura: "2026-02-10" },
  { id: 7, titulo: "Consulta Preventiva", clienteId: 7, cnj: null, tribunal: null, vara: null, tipoAcao: "Consultivo", poloCliente: "Autor", parteAutora: "João Mendes", parteRe: "—", status: "andamento", valorCausa: 0, abertura: "2026-07-01" }
];

const MOCK_MOVIMENTACOES = [
  { id: 1, processoId: 1, data: "2026-07-25", tipo: "Decisão", descricao: "Juiz deferiu pedido de antecipação de tutela." },
  { id: 2, processoId: 1, data: "2026-07-10", tipo: "Petição", descricao: "Petição inicial protocolada na 2ª Vara Cível." },
  { id: 3, processoId: 1, data: "2026-03-01", tipo: "Outro", descricao: "Processo distribuído por sorteio." },
  { id: 4, processoId: 2, data: "2026-07-20", tipo: "Audiência", descricao: "Realizada audiência de instrução e julgamento." },
  { id: 5, processoId: 2, data: "2026-01-15", tipo: "Petição", descricao: "Reclamação trabalhista protocolada." }
];

// Data de referência do protótipo: 29/07/2026 (ver daysUntil em app.js).
const MOCK_PRAZOS = [
  { id: 1, processoId: 1, descricao: "Recurso de apelação", vencimento: "2026-07-30", tipo: "Recurso", status: "pendente" },
  { id: 2, processoId: 1, descricao: "Manifestação sobre documentos", vencimento: "2026-08-15", tipo: "Manifestação", status: "pendente" },
  { id: 3, processoId: 2, descricao: "Réplica à contestação", vencimento: "2026-09-01", tipo: "Manifestação", status: "pendente" },
  { id: 4, processoId: 5, descricao: "Contestação", vencimento: "2026-08-02", tipo: "Manifestação", status: "pendente" },
  { id: 5, processoId: 2, descricao: "Alegações finais", vencimento: "2026-07-22", tipo: "Manifestação", status: "pendente" },
  { id: 6, processoId: 6, descricao: "Impugnação à contestação", vencimento: "2026-07-31", tipo: "Manifestação", status: "pendente" },
  { id: 7, processoId: 1, descricao: "Juntada de procuração", vencimento: "2026-07-10", tipo: "Outro", status: "cumprido" },
  { id: 8, processoId: 6, descricao: "Petição inicial", vencimento: "2026-07-05", tipo: "Outro", status: "cumprido" },
  { id: 9, processoId: 5, descricao: "Recolhimento de custas", vencimento: "2026-07-18", tipo: "Outro", status: "cumprido" }
];

const MOCK_COMPROMISSOS = [
  { id: 1, titulo: "Audiência de Conciliação", tipo: "audiencia", data: "2026-07-29", horaInicio: "09:00", horaFim: "10:00", local: "Fórum Central, Vara 3ª Cível", clienteId: 1, processoId: 1, descricao: "" },
  { id: 2, titulo: "Reunião com João Prospect", tipo: "reuniao", data: "2026-07-29", horaInicio: "14:30", horaFim: "15:15", local: "Escritório", clienteId: null, processoId: null, descricao: "Possível cliente — direito trabalhista. Contato: (11) 99999-2222" },
  { id: 3, titulo: "Prazo: Recurso de apelação", tipo: "prazo", data: "2026-07-30", horaInicio: "23:59", horaFim: null, local: "", clienteId: 1, processoId: 1, descricao: "Gerado automaticamente pelo processo." },
  { id: 4, titulo: "Tarefa: revisar petição", tipo: "tarefa", data: "2026-07-31", horaInicio: "10:00", horaFim: "11:00", local: "", clienteId: 2, processoId: 3, descricao: "" },
  { id: 5, titulo: "Reunião com cliente", tipo: "reuniao", data: "2026-08-01", horaInicio: "16:00", horaFim: "17:00", local: "Escritório", clienteId: 6, processoId: 6, descricao: "" }
];

// grupoId: relaciona parcelas/entrada de um mesmo parcelamento (null quando avulso).
// valorPago: valor efetivamente recebido/pago (pode diferir do previsto "valor").
const MOCK_FINANCEIRO = [
  { id: 1, tipo: "honorario", clienteId: 1, processoId: 1, grupoId: "g-cobranca-1", descricao: "Honorários 1/3 - Ação de Cobrança", valor: 2000, vencimento: "2026-07-15", status: "pago", dataPagamento: "2026-07-14", valorPago: 2000 },
  { id: 2, tipo: "honorario", clienteId: 1, processoId: 1, grupoId: "g-cobranca-1", descricao: "Honorários 2/3 - Ação de Cobrança", valor: 2000, vencimento: "2026-08-15", status: "pendente", dataPagamento: null, valorPago: null },
  { id: 3, tipo: "honorario", clienteId: 1, processoId: 1, grupoId: "g-cobranca-1", descricao: "Honorários 3/3 - Ação de Cobrança", valor: 2000, vencimento: "2026-09-15", status: "pendente", dataPagamento: null, valorPago: null },
  { id: 4, tipo: "honorario", clienteId: 2, processoId: 3, grupoId: null, descricao: "Consulta inicial", valor: 500, vencimento: "2026-07-05", status: "atrasado", dataPagamento: null, valorPago: null },
  { id: 5, tipo: "honorario", clienteId: 3, processoId: 4, grupoId: null, descricao: "Contrato anual de assessoria", valor: 4500, vencimento: "2026-07-30", status: "pendente", dataPagamento: null, valorPago: null },
  { id: 6, tipo: "honorario", clienteId: 6, processoId: 6, grupoId: null, descricao: "Honorários - Disputa Societária", valor: 8000, vencimento: "2026-07-10", status: "pago", dataPagamento: "2026-07-09", valorPago: 8000 },
  { id: 7, tipo: "despesa", clienteId: 1, processoId: 1, grupoId: null, descricao: "Custas judiciais", valor: 350, vencimento: "2026-07-12", status: "pago", dataPagamento: "2026-07-12", valorPago: 350, categoria: "Custas Judiciais" },
  { id: 8, tipo: "despesa", clienteId: null, processoId: null, grupoId: null, descricao: "Material de escritório", valor: 180, vencimento: "2026-07-18", status: "pago", dataPagamento: "2026-07-18", valorPago: 180, categoria: "Material de Escritório" },
  { id: 9, tipo: "despesa", clienteId: 5, processoId: 5, grupoId: null, descricao: "Deslocamento para audiência", valor: 120, vencimento: "2026-07-22", status: "pago", dataPagamento: "2026-07-22", valorPago: 120, categoria: "Deslocamento" }
];

const MOCK_DOCUMENTOS = [
  { id: 1, nome: "Petição Inicial.pdf", categoria: "Petição", clienteId: 1, processoId: 1, tamanho: "1.2 MB", enviadoEm: "2026-07-25" },
  { id: 2, nome: "Procuração.pdf", categoria: "Procuração", clienteId: 1, processoId: 1, tamanho: "300 KB", enviadoEm: "2026-07-20" },
  { id: 3, nome: "Contrato de Honorários.pdf", categoria: "Contrato", clienteId: 2, processoId: null, tamanho: "450 KB", enviadoEm: "2026-07-18" },
  { id: 4, nome: "RG_frente.jpg", categoria: "Outro", clienteId: 3, processoId: null, tamanho: "820 KB", enviadoEm: "2026-07-10" },
  { id: 5, nome: "Contestação.docx", categoria: "Petição", clienteId: 3, processoId: 4, tamanho: "95 KB", enviadoEm: "2026-06-15" },
  { id: 6, nome: "Decisão Interlocutória.pdf", categoria: "Decisão", clienteId: 1, processoId: 1, tamanho: "210 KB", enviadoEm: "2026-07-25" }
];

const MOCK_CONTATOS = [
  { id: 1, nome: "Carlos Eduardo Ramos", canal: "site", assunto: "Defesa em inquérito policial", mensagem: "Recebi intimação para depoimento e gostaria de orientação sobre como proceder.", data: "2026-07-28", status: "novo", telefone: "(11) 99123-4567", email: "carlos.ramos@email.com" },
  { id: 2, nome: "Fernanda Lima", canal: "site", assunto: "Dúvida sobre execução penal", mensagem: "Meu familiar está cumprindo pena e quero entender o pedido de progressão de regime.", data: "2026-07-27", status: "atendimento", telefone: "(11) 98222-1133", email: "fernanda.lima@email.com" },
  { id: 3, nome: "Marcelo Tavares", canal: "whatsapp", assunto: "Tribunal do Júri", mensagem: "Indicação do Dr. Paulo. Preciso de defesa em ação penal.", data: "2026-07-26", status: "novo", telefone: "(11) 97555-8899", email: "" },
  { id: 4, nome: "Juliana Prado", canal: "indicacao", assunto: "Crimes econômicos", mensagem: "Fui indicada por um cliente. Gostaria de agendar uma consulta.", data: "2026-07-24", status: "convertido", telefone: "(11) 96444-2211", email: "juliana.prado@email.com" },
  { id: 5, nome: "Ricardo Nunes", canal: "site", assunto: "Habeas corpus", mensagem: "Situação urgente envolvendo prisão preventiva de familiar.", data: "2026-07-23", status: "atendimento", telefone: "(21) 98111-7766", email: "ricardo.nunes@email.com" },
  { id: 6, nome: "Beatriz Santos", canal: "whatsapp", assunto: "Consulta genérica", mensagem: "Queria saber valores de consulta.", data: "2026-07-20", status: "descartado", telefone: "(11) 95000-1212", email: "" }
];

const MOCK_ATIVIDADES = [
  { id: 1, texto: "Processo Ação de Cobrança atualizado", hora: "14:22" },
  { id: 2, texto: "Cliente Maria Souza cadastrada", hora: "13:10" },
  { id: 3, texto: "Pagamento registrado - Cia ABC Ltda", hora: "11:45" },
  { id: 4, texto: "Documento enviado - Cia ABC Ltda", hora: "10:30" },
  { id: 5, texto: "Novo prazo registrado - Ação de Cobrança", hora: "09:15" }
];

const MOCK_CATEGORIAS = {
  documento: ["Petição", "Decisão", "Sentença", "Contrato", "Procuração", "Comprovante", "Outro"],
  despesa: ["Custas Judiciais", "Deslocamento", "Correios", "Material de Escritório", "Outros"],
  compromisso: ["Audiência", "Prazo", "Reunião", "Tarefa", "Outro"],
  tipoAcao: ["Cobrança", "Trabalhista", "Indenização", "Contratual", "Revisional", "Societário", "Consultivo", "Família", "Outro"]
};

/* ==========================================================================
   Camada de acesso a dados (simula backend via localStorage)
   ========================================================================== */

const DB = {
  _key: (name) => `cerne_${name}`,

  _seed(name, mock) {
    const key = this._key(name);
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(mock));
    }
  },

  init() {
    // Versão dos dados de exemplo. Ao subir a versão, limpamos o cache antigo
    // do navegador para que as novas telas (Prazos/Contatos) reflitam o mock
    // atualizado durante a demonstração.
    const DATA_VERSION = "3";
    const verKey = this._key("data_version");
    if (localStorage.getItem(verKey) !== DATA_VERSION) {
      ["clientes","processos","movimentacoes","prazos","compromissos","financeiro","documentos","contatos","atividades","escritorio"]
        .forEach(n => localStorage.removeItem(this._key(n)));
      localStorage.setItem(verKey, DATA_VERSION);
    }

    // Força a atualização da identidade do escritório caso o navegador
    // ainda tenha o cache de uma versão anterior do protótipo.
    const escKey = this._key("escritorio");
    const escCache = localStorage.getItem(escKey);
    if (escCache && escCache.indexOf("Carlos Mendes") !== -1) {
      localStorage.removeItem(escKey);
    }
    this._seed("clientes", MOCK_CLIENTES);
    this._seed("processos", MOCK_PROCESSOS);
    this._seed("movimentacoes", MOCK_MOVIMENTACOES);
    this._seed("prazos", MOCK_PRAZOS);
    this._seed("compromissos", MOCK_COMPROMISSOS);
    this._seed("financeiro", MOCK_FINANCEIRO);
    this._seed("documentos", MOCK_DOCUMENTOS);
    this._seed("contatos", MOCK_CONTATOS);
    this._seed("atividades", MOCK_ATIVIDADES);
    this._seed("escritorio", MOCK_ESCRITORIO);
  },

  get(name) {
    return JSON.parse(localStorage.getItem(this._key(name)) || "[]");
  },

  set(name, data) {
    localStorage.setItem(this._key(name), JSON.stringify(data));
  },

  nextId(name) {
    const items = this.get(name);
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  },

  add(name, item) {
    const items = this.get(name);
    item.id = this.nextId(name);
    items.push(item);
    this.set(name, items);
    return item;
  },

  update(name, id, patch) {
    const items = this.get(name);
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { items[idx] = { ...items[idx], ...patch }; this.set(name, items); }
    return items[idx];
  },

  findById(name, id) {
    return this.get(name).find(i => i.id === Number(id));
  },

  reset() {
    ["clientes","processos","movimentacoes","prazos","compromissos","financeiro","documentos","contatos","atividades","escritorio"]
      .forEach(n => localStorage.removeItem(this._key(n)));
    this.init();
  }
};

DB.init();
