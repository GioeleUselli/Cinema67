var selectedUserId = null;
var allUsers = [];

document.addEventListener('DOMContentLoaded', function () {
  setupRicaricaForm();
  loadAllUsers();
  loadRicaricheHistory();
});

async function loadAllUsers() {
  var tbody = document.getElementById('all-users-list');
  try {
    allUsers = normalizeCollection(await API.getUsersAdmin());
    renderUsers(allUsers);
  } catch (e) { console.error(e); if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-brand-error">Errore caricamento</td></tr>'; }
}

function renderUsers(users) {
  var tbody = document.getElementById('all-users-list');
  var count = document.getElementById('users-count');
  if (count) count.textContent = users.length;
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessun utente</td></tr>'; return; }
  tbody.innerHTML = users.map(function (u) {
    var saldo = typeof u.creditoResiduo === 'number' ? Number(u.creditoResiduo) : 0;
    return '<tr class="row-hover ' + (selectedUserId === u.id ? 'bg-brand-surface-container' : '') + '"><td class="px-6 py-4 text-sm font-semibold">' + escapeHtml(u.nome + ' ' + u.cognome) + '</td><td class="px-6 py-4 text-sm text-brand-on-surface-variant">' + escapeHtml(u.email) + '</td><td class="px-6 py-4 text-sm font-bold text-brand-gold">&euro;' + Number(saldo).toFixed(2) + '</td><td class="px-6 py-4"><button onclick="selectUser(' + u.id + ',\'' + escapeHtml(u.email).replace(/'/g, '\\\'') + '\',\'' + escapeHtml(u.nome + ' ' + u.cognome).replace(/'/g, '\\\'') + '\',' + Number(saldo).toFixed(2) + ')" class="btn-outline-brand text-xs px-3 py-1"><i class="fa-solid fa-hand-pointer mr-1"></i>Ricarica</button></td></tr>';
  }).join('');
}

function selectUser(id, email, name, saldo) {
  selectedUserId = id;
  document.getElementById('selected-user-panel').classList.remove('hidden');
  document.getElementById('selected-user-name').textContent = name;
  document.getElementById('selected-user-email').textContent = email;
  document.getElementById('selected-user-saldo').textContent = '€' + Number(saldo).toFixed(2);
  renderUsers(allUsers);
}

document.getElementById('user-search-input').addEventListener('input', function () {
  var term = (this.value || '').trim().toLowerCase();
  var filtered = allUsers;
  if (term) {
    filtered = allUsers.filter(function (u) {
      var name = (u.nome + ' ' + u.cognome).toLowerCase();
      var email = (u.email || '').toLowerCase();
      return name.indexOf(term) !== -1 || email.indexOf(term) !== -1;
    });
  }
  renderUsers(filtered);
});

async function loadRicaricheHistory() {
  var tbody = document.getElementById('history-table-body');
  try {
    var movs = normalizeCollection(await API.getRicariche());
    if (!movs.length) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessuna ricarica recente</td></tr>'; return; }
    tbody.innerHTML = movs.map(function (m) {
      return '<tr><td class="px-6 py-4 text-sm">' + formatDate(m.createdAtUtc) + '</td><td class="px-6 py-4 text-sm">' + escapeHtml(m.userEmail) + '</td><td class="px-6 py-4 text-sm font-semibold text-brand-gold">&euro;' + Number(m.importo || 0).toFixed(2) + '</td><td class="px-6 py-4 text-sm">' + escapeHtml(m.operatoreEmail || '-') + '</td><td class="px-6 py-4 text-sm">' + escapeHtml(m.note || '-') + '</td></tr>';
    }).join('');
  } catch (e) { console.error(e); tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-brand-error">Errore</td></tr>'; }
}

function setupRicaricaForm() {
  var form = document.getElementById('ricarica-form');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!selectedUserId) { showToast('Seleziona un utente dalla lista', 'warning'); return; }
    var importo = parseFloat(document.getElementById('ricarica-importo').value);
    if (!importo || importo <= 0) { showToast('Inserisci un importo valido', 'warning'); return; }
    var note = document.getElementById('ricarica-note').value || null;
    try {
      var result = await API.ricaricaCredito({ userId: selectedUserId, importo: importo, cinemaId: null, note: note });
      showToast('Ricarica effettuata con successo');
      form.reset();
      if (result.utente && result.utente.creditoResiduo != null) {
        document.getElementById('selected-user-saldo').textContent = '€' + Number(result.utente.creditoResiduo).toFixed(2);
      }
      loadAllUsers();
      loadRicaricheHistory();
    } catch (err) { handleApiError(err); }
  });
}
