/* ==========================================================================
   Cerne — App Shell (sidebar, header, toasts, modais, busca global)
   Protótipo navegável — HTML/CSS/JS puro, sem framework.
   ========================================================================== */

/* ---------- Durações de loading (ajuste centralizado) ---------- */

const LOGIN_DELAY = 1000; // ms — overlay + spinner no login
const PAGE_DELAY = 100;   // ms — barra de progresso + skeleton na navegação interna

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/* ---------- Barra de progresso no topo (estilo GitHub/YouTube) ---------- */

function ensureTopProgress() {
  let bar = document.getElementById("top-progress");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "top-progress";
    bar.className = "top-progress";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-hidden", "true");
    bar.style.width = "0";
    document.body.appendChild(bar);
  }
  return bar;
}

function startTopProgress() {
  const bar = ensureTopProgress();
  bar.classList.remove("done");
  bar.style.width = "0";
  void bar.offsetWidth; // força reflow para reiniciar a transição
  bar.style.width = "70%";
}

function finishTopProgress() {
  const bar = ensureTopProgress();
  bar.style.width = "100%";
  setTimeout(() => {
    bar.classList.add("done");
    setTimeout(() => { bar.style.width = "0"; bar.classList.remove("done"); }, 250);
  }, 150);
}

/* ---------- Skeleton genérico do conteúdo ---------- */

function renderContentSkeleton() {
  const root = document.getElementById("page-root");
  if (!root) return;
  root.innerHTML = `
    <div class="skeleton-page" aria-hidden="true">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-toolbar"></div>
      <div class="skeleton-cards">
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
      <div class="skeleton skeleton-block"></div>
    </div>`;
}

/* ---------- Helpers de formatação ---------- */

function formatMoney(v) {
  return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Converte texto de valor monetário ("R$ 1.234,56") em Number (1234.56). */
function parseMoney(raw) {
  return parseFloat(String(raw == null ? "" : raw).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function daysUntil(iso) {
  const today = new Date("2026-07-29T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

/* ---------- Ícones (inline SVG - subset Lucide-like) ---------- */

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 8l-3 6a4 4 0 0 0 8 0z"/><path d="M19 8l-3 6a4 4 0 0 0 8 0z"/><path d="M5 8h14"/><path d="M9 21h6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
  contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/><circle cx="12" cy="11" r="2.5"/></svg>'
};

/* ---------- Toasts ---------- */

function toast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

/* ---------- Modal de confirmação genérico ---------- */

function confirmAction({ title, message, confirmLabel = "Confirmar", danger = true, onConfirm }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2 class="h2">${title}</h2>
        <button class="btn-icon" data-close>✕</button>
      </div>
      <div class="modal-body"><p class="text-body">${message}</p></div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>Cancelar</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm>${confirmLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => overlay.remove()));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector("[data-confirm]").addEventListener("click", () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });
}

/* ---------- Menu de navegação (dados para sidebar) ---------- */

const NAV_ITEMS = [
  { label: "Dashboard", href: "dashboard.html", icon: "home", key: "dashboard" },
  { label: "Prazos", href: "prazos.html", icon: "clock", key: "prazos" },
  { label: "Clientes", href: "clientes.html", icon: "users", key: "clientes" },
  { label: "Processos", href: "processos.html", icon: "scale", key: "processos" },
  { label: "Agenda", href: "agenda.html", icon: "calendar", key: "agenda" },
  { label: "Financeiro", href: "financeiro.html", icon: "dollar", key: "financeiro" },
  { label: "Contatos", href: "contatos.html", icon: "contact", key: "contatos" }
];

/* ---------- Renderização do Shell ---------- */

/* ---------- Notificações dinâmicas (a partir dos dados reais) ----------
   Data de referência do protótipo: 29/07/2026 (ver daysUntil).
   Gera notificações de: prazos atrasados/vencendo em ≤2 dias, honorários
   em atraso e compromissos de hoje. */
function buildNotifications() {
  const out = [];

  DB.get("prazos").filter(p => p.status !== "cumprido").forEach(p => {
    const d = daysUntil(p.vencimento);
    if (d < 0) {
      out.push({ icon: "🔴", title: `Prazo atrasado — ${p.descricao}`, time: `Venceu há ${Math.abs(d)} dia${Math.abs(d) > 1 ? "s" : ""}`, href: `processo-detalhes.html?id=${p.processoId}&aba=prazos`, sort: d });
    } else if (d <= 2) {
      out.push({ icon: "🔴", title: `Prazo ${d === 0 ? "vence hoje" : "vence em " + d + " dia" + (d > 1 ? "s" : "")} — ${p.descricao}`, time: formatDate(p.vencimento), href: `processo-detalhes.html?id=${p.processoId}&aba=prazos`, sort: d });
    }
  });

  DB.get("financeiro").filter(f => f.status === "atrasado").forEach(f => {
    const cli = f.clienteId ? DB.findById("clientes", f.clienteId) : null;
    out.push({ icon: "💰", title: `Honorário atrasado — ${cli ? cli.nome : f.descricao}`, time: `Venceu em ${formatDate(f.vencimento)}`, href: `financeiro.html?tab=inadimplencia`, sort: 100 });
  });

  DB.get("compromissos").filter(c => c.data === "2026-07-29").forEach(c => {
    out.push({ icon: "📅", title: `${c.titulo}${c.horaInicio ? " às " + c.horaInicio : ""}`, time: "Hoje", href: "agenda.html", sort: 200 });
  });

  return out.sort((a, b) => a.sort - b.sort);
}

function renderShell(activeKey) {
  const shellRoot = document.getElementById("app-shell-root");
  if (!shellRoot) return;

  const notifs = buildNotifications();
  const notifBadgeHtml = notifs.length ? `<span class="notif-badge">${notifs.length}</span>` : "";
  const notifPanelHtml = notifs.length
    ? notifs.map(n => `<a class="notif-item" href="${n.href}" style="display:block; text-decoration:none;"><div class="notif-title">${n.icon} ${n.title}</div><div class="notif-time">${n.time}</div></a>`).join("")
    : `<div class="notif-item"><div class="notif-title">Sem notificações</div><div class="notif-time">Você está em dia 🎉</div></div>`;

  const navHtml = NAV_ITEMS.map(item => `
    <a class="nav-item ${item.key === activeKey ? "active" : ""}" href="${item.href}">
      ${ICONS[item.icon]}
      <span class="sidebar-label">${item.label}</span>
    </a>
  `).join("");

  shellRoot.innerHTML = `
    <a href="#main-content" class="skip-link">Ir para o conteúdo</a>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <img src="img/logo_branco.png" alt="Cerne — Sistema Jurídico" class="sidebar-logo sidebar-logo-full">
        <img src="img/logo_C_branco.png" alt="Cerne — Sistema Jurídico" class="sidebar-logo sidebar-logo-icon">
      </div>
      <nav class="sidebar-nav" aria-label="Navegação principal">
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <a class="sidebar-user" id="sidebar-user-toggle" href="configuracoes.html" aria-label="Abrir configurações">
          <img src="img/Foto_drLucas.jpg" alt="Dr. Lucas Andreucci da Veiga" class="sidebar-avatar sidebar-avatar-img">
          <div class="user-info-text">
            <div class="user-name">Dr. Lucas Andreucci</div>
            <div class="user-role">Advogado</div>
          </div>
        </a>
      </div>
    </aside>

    <div class="main-area">
      <header class="app-header">
        <button class="btn-icon" id="sidebar-toggle" aria-label="Recolher menu">${ICONS.chevronLeft}</button>
        <div class="header-search" id="global-search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="global-search-input" placeholder="Buscar clientes, processos, documentos..." autocomplete="off" aria-label="Pesquisa global">
          <div class="search-dropdown hidden" id="global-search-dropdown"></div>
        </div>
        <div class="header-actions">
          <div style="position:relative;">
            <button class="btn-icon header-icon-btn" id="notif-toggle" aria-label="Notificações${notifs.length ? " (" + notifs.length + " novas)" : ""}">
              ${ICONS.bell}
              ${notifBadgeHtml}
            </button>
            <div class="notif-panel hidden" id="notif-panel">
              ${notifPanelHtml}
            </div>
          </div>
          <div style="position:relative;">
            <button class="btn-icon" id="user-toggle" aria-label="Menu do usuário" aria-haspopup="true">${ICONS.menu}</button>
            <div class="user-dropdown hidden" id="user-dropdown">
              <a href="configuracoes.html">Meu Perfil</a>
              <a href="configuracoes.html">Configurações</a>
              <button id="logout-btn">${ICONS.logout} Sair</button>
            </div>
          </div>
        </div>
      </header>
      <main class="page-content" id="main-content">
        <div id="page-root"></div>
      </main>
    </div>
  `;

  wireShellEvents();
}

function wireShellEvents() {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  sidebarToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    const collapsed = sidebar.classList.contains("collapsed");
    const mainArea = document.querySelector(".main-area");
    if (mainArea) mainArea.style.marginLeft = collapsed ? "64px" : "240px";
    // Chevron reflete a ação disponível: recolhido → ">" (expandir); expandido → "<" (recolher)
    sidebarToggle.innerHTML = collapsed ? ICONS.chevronRight : ICONS.chevronLeft;
    sidebarToggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
  });

  const notifToggle = document.getElementById("notif-toggle");
  const notifPanel = document.getElementById("notif-panel");
  notifToggle?.addEventListener("click", (e) => { e.stopPropagation(); notifPanel.classList.toggle("hidden"); document.getElementById("user-dropdown")?.classList.add("hidden"); });

  const userToggle = document.getElementById("user-toggle");
  const userDropdown = document.getElementById("user-dropdown");
  userToggle?.addEventListener("click", (e) => { e.stopPropagation(); userDropdown.classList.toggle("hidden"); notifPanel?.classList.add("hidden"); });

  document.addEventListener("click", () => {
    notifPanel?.classList.add("hidden");
    userDropdown?.classList.add("hidden");
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // Feedback instantâneo: dispara a barra de progresso ao navegar pela sidebar,
  // antes do carregamento da próxima página.
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(link => {
    link.addEventListener("click", () => {
      if (!prefersReducedMotion()) startTopProgress();
    });
  });

  wireGlobalSearch();
}

/* ---------- Busca Global ---------- */

function wireGlobalSearch() {
  const input = document.getElementById("global-search-input");
  const dropdown = document.getElementById("global-search-dropdown");
  if (!input) return;

  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    if (term.length < 2) { dropdown.classList.add("hidden"); dropdown.innerHTML = ""; return; }

    const clientes = DB.get("clientes").filter(c =>
      c.nome.toLowerCase().includes(term) || c.doc.replace(/\D/g,"").includes(term.replace(/\D/g,""))
    ).slice(0, 3);
    const processos = DB.get("processos").filter(p =>
      p.titulo.toLowerCase().includes(term) || (p.cnj && p.cnj.replace(/\D/g,"").includes(term.replace(/\D/g,"")))
    ).slice(0, 3);
    const documentos = DB.get("documentos").filter(d => d.nome.toLowerCase().includes(term)).slice(0, 3);
    const compromissos = DB.get("compromissos").filter(c => c.titulo.toLowerCase().includes(term)).slice(0, 3);

    const total = clientes.length + processos.length + documentos.length + compromissos.length;
    if (total === 0) {
      dropdown.innerHTML = `<div class="search-empty">Nenhum resultado encontrado para "${input.value}".</div>`;
      dropdown.classList.remove("hidden");
      return;
    }

    let html = "";
    if (clientes.length) {
      html += `<div class="search-group-title">Clientes</div>`;
      clientes.forEach(c => html += `<div class="search-result-item" onclick="window.location.href='cliente-perfil.html?id=${c.id}'"><span class="sr-title">👤 ${c.nome}</span><span class="sr-sub">${c.tipo} • ${c.doc}</span></div>`);
    }
    if (processos.length) {
      html += `<div class="search-group-title">Processos</div>`;
      processos.forEach(p => html += `<div class="search-result-item" onclick="window.location.href='processo-detalhes.html?id=${p.id}'"><span class="sr-title">⚖️ ${p.titulo}</span><span class="sr-sub">${statusProcessoLabel(p.status)}</span></div>`);
    }
    if (documentos.length) {
      html += `<div class="search-group-title">Documentos</div>`;
      documentos.forEach(d => {
        // Documentos deixaram de ter tela própria na navegação: o resultado
        // abre o dono do documento (processo, quando houver; senão, o cliente).
        const destino = d.processoId
          ? `processo-detalhes.html?id=${d.processoId}&aba=documentos`
          : (d.clienteId ? `cliente-perfil.html?id=${d.clienteId}&aba=documentos` : "dashboard.html");
        const dono = d.processoId
          ? (DB.findById("processos", d.processoId)?.titulo || d.categoria)
          : (DB.findById("clientes", d.clienteId)?.nome || d.categoria);
        html += `<div class="search-result-item" onclick="window.location.href='${destino}'"><span class="sr-title">📄 ${d.nome}</span><span class="sr-sub">${d.categoria} • ${dono}</span></div>`;
      });
    }
    if (compromissos.length) {
      html += `<div class="search-group-title">Compromissos</div>`;
      compromissos.forEach(c => html += `<div class="search-result-item" onclick="window.location.href='agenda.html'"><span class="sr-title">📅 ${c.titulo}</span><span class="sr-sub">${formatDate(c.data)}</span></div>`);
    }
    dropdown.innerHTML = html;
    dropdown.classList.remove("hidden");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim().length >= 2) {
      window.location.href = "busca.html?q=" + encodeURIComponent(input.value.trim());
    }
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("global-search-wrap").contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
}

/* ---------- Labels de status ---------- */

function statusProcessoLabel(status) {
  const map = { andamento: "🔵 Em Andamento", suspenso: "🟡 Suspenso", encerrado: "⚫ Encerrado", arquivado: "⚫ Arquivado" };
  return map[status] || status;
}
function statusProcessoBadge(status) {
  const map = {
    andamento: '<span class="badge badge-info">Em Andamento</span>',
    suspenso: '<span class="badge badge-warning">Suspenso</span>',
    encerrado: '<span class="badge badge-neutral">Encerrado</span>',
    arquivado: '<span class="badge badge-neutral">Arquivado</span>'
  };
  return map[status] || status;
}
function statusFinanceiroBadge(status) {
  const map = {
    pago: '<span class="badge badge-success">Pago</span>',
    pendente: '<span class="badge badge-warning">Pendente</span>',
    atrasado: '<span class="badge badge-danger">Atrasado</span>',
    cancelado: '<span class="badge badge-neutral">Cancelado</span>'
  };
  return map[status] || status;
}
function statusClienteBadge(status) {
  return status === "ativo" ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-neutral">Inativo</span>';
}

/* Prazos: badge de status (Pendente/Cumprido) */
function statusPrazoBadge(status) {
  return status === "cumprido"
    ? '<span class="badge badge-success">Cumprido</span>'
    : '<span class="badge badge-warning">Pendente</span>';
}

/* Prazos: célula de "dias restantes" com cor conforme urgência.
   Vermelho = atrasado; âmbar = vence em ≤3 dias; neutro = ok. Cumprido = neutro. */
function diasRestantesCell(prazo) {
  if (prazo.status === "cumprido") {
    return '<span class="badge badge-neutral">Cumprido</span>';
  }
  const dias = daysUntil(prazo.vencimento);
  if (dias < 0) return `<span class="badge badge-danger">Atrasado ${Math.abs(dias)}d</span>`;
  if (dias === 0) return '<span class="badge badge-danger">Vence hoje</span>';
  if (dias <= 3) return `<span class="badge badge-warning">${dias} dia${dias > 1 ? "s" : ""}</span>`;
  return `<span class="badge badge-neutral">${dias} dias</span>`;
}

/* Contatos/leads: badge de status */
function statusContatoBadge(status) {
  const map = {
    novo: '<span class="badge badge-info">Novo</span>',
    atendimento: '<span class="badge badge-warning">Em atendimento</span>',
    convertido: '<span class="badge badge-success">Convertido</span>',
    descartado: '<span class="badge badge-neutral">Descartado</span>'
  };
  return map[status] || status;
}

/* Contatos/leads: rótulo do canal de origem */
function canalContatoLabel(canal) {
  const map = { site: "🌐 Site", whatsapp: "💬 WhatsApp", indicacao: "🤝 Indicação", telefone: "📞 Telefone" };
  return map[canal] || canal;
}

/* ---------- Inicialização automática de página ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const activeKey = document.body.getAttribute("data-active-nav");
  if (!activeKey) return;

  renderShell(activeKey);
  if (typeof renderPage !== "function") return;

  // Movimento reduzido: renderiza imediatamente, sem skeleton/barra/delay.
  if (prefersReducedMotion()) {
    renderPage();
    return;
  }

  // Fluxo com feedback de performance percebida:
  // barra de progresso no topo + skeleton no conteúdo por ~PAGE_DELAY,
  // depois renderiza o conteúdo real.
  startTopProgress();
  renderContentSkeleton();
  setTimeout(() => {
    renderPage();
    finishTopProgress();
  }, PAGE_DELAY);
});
