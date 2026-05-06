var users = [];
var cinemas = [];
var currentPage = 1;
var totalPages = 1;
var searchTerm = '';
var roleFilter = '';

async function loadAll() {
  var tbody = document.getElementById('utenti-table-body');
  try {
    var data = await API.getUsersAdmin({ search: searchTerm, role: roleFilter, page: currentPage, pageSize: 20 });
    users = normalizeCollection(data.items);
    totalPages = data.totalPages || 1;
    cinemas = normalizeCollection(await API.getCinemas());
    document.getElementById('page-indicator').textContent = 'Pag ' + currentPage + ' di ' + totalPages + ' (' + (data.total || 0) + ' utenti)';

    if (!users.length) { tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessun utente trovato.</td></tr>'; return; }
    tbody.innerHTML = users.map(function (u) {
      var isPU = u.ruolo === 'PowerUser';
      var saldo = typeof u.creditoResiduo === 'number' ? Number(u.creditoResiduo) : 0;
      var cinemaCell = isPU
        ? '<select class="ghost-input px-2 py-1 text-xs" onchange="assignCinema(' + u.id + ', this.value)"><option value="">Nessuno</option>' + cinemas.map(function (c) { return '<option value="' + c.id + '"' + (u.cinemaPreferitoId === c.id ? ' selected' : '') + '>' + escapeHtml(c.nome) + '</option>'; }).join('') + '</select>'
        : '<span class="text-xs text-brand-on-surface-variant">Solo PowerUser</span>';
      return '<tr class="row-hover">' +
        '<td class="px-6 py-4"><p class="text-sm font-semibold">' + escapeHtml(u.nome + ' ' + u.cognome) + '</p><p class="text-xs text-brand-on-surface-variant">' + escapeHtml(u.email) + '</p></td>' +
        '<td class="px-6 py-4"><select class="ghost-input px-2 py-1 text-xs" onchange="changeRole(' + u.id + ', this.value)"><option value="User"' + (u.ruolo === 'User' ? ' selected' : '') + '>User</option><option value="PowerUser"' + (u.ruolo === 'PowerUser' ? ' selected' : '') + '>PowerUser</option><option value="Admin"' + (u.ruolo === 'Admin' ? ' selected' : '') + '>Admin</option></select></td>' +
        '<td class="px-6 py-4">' + cinemaCell + '</td>' +
        '<td class="px-6 py-4 text-sm font-bold text-brand-gold">&euro;' + Number(saldo).toFixed(2) + '</td>' +
        '<td class="px-6 py-4 text-xs text-brand-on-surface-variant">' + formatDate(u.dataRegistrazione) + '</td>' +
        '<td class="px-6 py-4 text-xs"><span class="chip-status ' + (u.ruolo === 'Admin' ? 'chip-warning' : 'chip-active') + '">' + u.ruolo + '</span></td></tr>';
    }).join('');
  } catch (e) { console.error(e); tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-brand-error">Errore caricamento</td></tr>'; }
}

document.getElementById('filter-search')?.addEventListener('input', function () {
  searchTerm = this.value; currentPage = 1; loadAll();
});
document.getElementById('filter-role')?.addEventListener('change', function () {
  roleFilter = this.value; currentPage = 1; loadAll();
});
document.getElementById('btn-prev')?.addEventListener('click', function () { if (currentPage > 1) { currentPage--; loadAll(); } });
document.getElementById('btn-next')?.addEventListener('click', function () { if (currentPage < totalPages) { currentPage++; loadAll(); } });

function openCreateModal() {
  document.getElementById('user-form').reset();
  document.getElementById('modal-title').textContent = 'Nuovo Account';
  var sel = document.getElementById('user-form').querySelector('[name="cinemaId"]');
  if (sel) sel.innerHTML = '<option value="">Nessuno</option>' + cinemas.map(function (c) { return '<option value="' + c.id + '">' + escapeHtml(c.nome) + '</option>'; }).join('');
  document.getElementById('user-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('user-modal').classList.add('hidden'); }

document.getElementById('modal-submit').addEventListener('click', async function () {
  var f = document.getElementById('user-form');
  var role = f.querySelector('[name="ruolo"]').value;
  var data = {
    nome: f.querySelector('[name="nome"]').value,
    cognome: f.querySelector('[name="cognome"]').value,
    email: f.querySelector('[name="email"]').value,
    password: f.querySelector('[name="password"]').value,
    telefono: f.querySelector('[name="telefono"]').value || null,
    ruolo: role,
    cinemaId: (role === 'PowerUser' && f.querySelector('[name="cinemaId"]').value) ? parseInt(f.querySelector('[name="cinemaId"]').value) : null
  };
  if (!data.nome || !data.cognome || !data.email || !data.password) { showToast('Compila tutti i campi', 'danger'); return; }
  try { await API.createUserAdmin(data); showToast('Account creato'); closeModal(); loadAll(); }
  catch (e) { handleApiError(e); }
});

async function changeRole(uid, newRole) {
  if (!confirm('Cambiare ruolo?')) { loadAll(); return; }
  try { await API.updateUserRole(uid, { nuovoRuolo: newRole }); showToast('Ruolo aggiornato'); loadAll(); }
  catch (e) { handleApiError(e); loadAll(); }
}

async function assignCinema(uid, cinemaId) {
  try { await API.updateUserCinema(uid, { cinemaId: cinemaId ? parseInt(cinemaId) : null }); showToast('Cinema assegnato'); }
  catch (e) { handleApiError(e); loadAll(); }
}

document.addEventListener('DOMContentLoaded', loadAll);
