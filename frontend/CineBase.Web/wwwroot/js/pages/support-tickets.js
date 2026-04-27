let supportTickets = [];
let selectedTicketId = null;
let supportAdmins = [];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('it-IT');
}

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'resolved' || s === 'closed') return 'chip-active';
  if (s === 'inprogress') return 'chip-warning';
  return 'chip-past';
}

function renderTicketList() {
  const host = document.getElementById('tickets-list');
  const count = document.getElementById('tickets-count');
  if (!host) return;

  count.textContent = String(supportTickets.length);

  if (!supportTickets.length) {
    host.innerHTML = '<p class="p-4 text-sm text-brand-on-surface-variant">Nessun ticket trovato.</p>';
    return;
  }

  host.innerHTML = supportTickets.map(t => {
    const active = Number(t.id) === Number(selectedTicketId);
    return `
      <button type="button" data-ticket-id="${t.id}" class="w-full text-left p-4 hover:bg-brand-surface-container transition-colors ${active ? 'bg-brand-surface-container' : ''}">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-brand-on-surface-variant">${esc(t.code)}</p>
            <p class="text-sm font-semibold text-brand-on-surface mt-1">${esc(t.title)}</p>
            <p class="text-xs text-brand-on-surface-variant mt-1">${esc(t.userEmail)} · ${formatDateTime(t.updatedAtUtc)}</p>
          </div>
          <span class="chip-status ${statusClass(t.status)}">${esc(t.status)}</span>
        </div>
      </button>
    `;
  }).join('');

  host.querySelectorAll('[data-ticket-id]').forEach(btn => {
    btn.addEventListener('click', () => selectTicket(Number(btn.getAttribute('data-ticket-id'))));
  });
}

function renderTicketDetail(ticket) {
  const empty = document.getElementById('ticket-empty');
  const detail = document.getElementById('ticket-detail');
  if (!ticket) {
    empty?.classList.remove('hidden');
    detail?.classList.add('hidden');
    return;
  }

  empty?.classList.add('hidden');
  detail?.classList.remove('hidden');

  document.getElementById('ticket-detail-code').textContent = ticket.code || '-';
  document.getElementById('ticket-title').textContent = ticket.title || '';
  document.getElementById('ticket-description').textContent = ticket.description || '';
  document.getElementById('ticket-user').textContent = ticket.userEmail || '-';
  document.getElementById('ticket-page').textContent = ticket.contextPage || '-';
  document.getElementById('ticket-status').value = ticket.status || 'Open';
  document.getElementById('ticket-priority').value = ticket.priority || '-';
  document.getElementById('ticket-note').value = ticket.adminResolutionNote || '';

  const assigneeSelect = document.getElementById('ticket-assigned-admin');
  if (assigneeSelect) {
    const options = ['<option value="">Assegna a me</option>']
      .concat(supportAdmins.map(a => `<option value="${a.id}">${esc(`${a.nome} ${a.cognome}`)} (${esc(a.email)})</option>`));
    assigneeSelect.innerHTML = options.join('');
    assigneeSelect.value = ticket.assignedAdminUserId != null ? String(ticket.assignedAdminUserId) : '';
  }

  const msgHost = document.getElementById('ticket-messages');
  const messages = Array.isArray(ticket.conversationMessages) ? ticket.conversationMessages : [];
  msgHost.innerHTML = messages.length
    ? messages.map(m => {
      const role = String(m.role || '').toLowerCase();
      const bubbleClass = role === 'user' ? 'support-chat-bubble-user' : 'support-chat-bubble-bot';
      return `
        <div class="support-chat-row ${role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="support-chat-bubble ${bubbleClass}">
            <p>${esc(m.message)}</p>
            <p class="mt-1 text-[10px] opacity-70">${esc(m.role)} · ${formatDateTime(m.createdAtUtc)}</p>
          </div>
        </div>
      `;
    }).join('')
    : '<p class="text-sm text-brand-on-surface-variant">Nessun messaggio disponibile.</p>';

  const auditHost = document.getElementById('ticket-audits');
  const audits = Array.isArray(ticket.auditTrail) ? ticket.auditTrail : [];
  auditHost.innerHTML = audits.length
    ? audits.map(a => `
      <article class="rounded-lg border border-brand-outline-variant/20 bg-brand-surface-container p-2.5">
        <p class="text-xs font-semibold text-brand-on-surface">${esc(a.eventType)}</p>
        <p class="mt-1 text-sm text-brand-on-surface-variant">${esc(a.message)}</p>
        <p class="mt-1 text-[11px] text-brand-on-surface-variant">${esc(a.actorEmail || 'Sistema')} · ${formatDateTime(a.createdAtUtc)}</p>
      </article>
    `).join('')
    : '<p class="text-sm text-brand-on-surface-variant">Nessun evento audit.</p>';
}

async function loadTickets() {
  const status = document.getElementById('filter-status')?.value || '';
  const priority = document.getElementById('filter-priority')?.value || '';
  const search = document.getElementById('filter-search')?.value?.trim() || '';

  try {
    supportTickets = await API.getSupportTickets({ status, priority, search, page: 1, pageSize: 100 });
    if (selectedTicketId && !supportTickets.some(t => Number(t.id) === Number(selectedTicketId))) {
      selectedTicketId = null;
      renderTicketDetail(null);
    }
    renderTicketList();
  } catch (error) {
    console.error('Errore caricamento ticket:', error);
    if (typeof showToast === 'function') showToast('Errore caricamento ticket', 'error');
  }
}

async function selectTicket(ticketId) {
  selectedTicketId = ticketId;
  renderTicketList();

  try {
    const ticket = await API.getSupportTicket(ticketId);
    renderTicketDetail(ticket);
  } catch (error) {
    console.error('Errore dettaglio ticket:', error);
    if (typeof showToast === 'function') showToast('Errore dettaglio ticket', 'error');
  }
}

async function saveTicketUpdate() {
  if (!selectedTicketId) return;

  const status = document.getElementById('ticket-status')?.value || 'Open';
  const note = document.getElementById('ticket-note')?.value || '';
  const assignedRaw = document.getElementById('ticket-assigned-admin')?.value || '';
  const assignedAdminUserId = assignedRaw ? Number(assignedRaw) : null;

  try {
    const updated = await API.updateSupportTicket(selectedTicketId, {
      status,
      adminResolutionNote: note,
      assignedAdminUserId
    });
    renderTicketDetail(updated);
    await loadTickets();
    if (typeof showToast === 'function') showToast('Ticket aggiornato', 'success');
  } catch (error) {
    console.error('Errore aggiornamento ticket:', error);
    if (typeof showToast === 'function') showToast('Errore aggiornamento ticket', 'error');
  }
}

async function loadAdmins() {
  try {
    supportAdmins = await API.getSupportAdmins();
  } catch (error) {
    console.error('Errore caricamento admin support:', error);
    supportAdmins = [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('btn-refresh')?.addEventListener('click', loadTickets);
  document.getElementById('filter-status')?.addEventListener('change', loadTickets);
  document.getElementById('filter-priority')?.addEventListener('change', loadTickets);
  document.getElementById('filter-search')?.addEventListener('input', () => {
    window.clearTimeout(window.__supportSearchTimer);
    window.__supportSearchTimer = window.setTimeout(loadTickets, 300);
  });
  document.getElementById('ticket-save')?.addEventListener('click', saveTicketUpdate);

  await loadAdmins();
  await loadTickets();
  if (supportTickets.length) {
    await selectTicket(supportTickets[0].id);
  }
});
