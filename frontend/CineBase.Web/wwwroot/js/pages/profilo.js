let profiloData = null;
let creditoData = null;
let cinemaPreferito = null;
var profileSectionsExpanded = {};

(function initProfileSections() {
  var saved = localStorage.getItem('cb_profile_sections');
  if (saved) {
    try { profileSectionsExpanded = JSON.parse(saved); } catch(e) {}
  }
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.profile-section').forEach(function(section) {
      var header = section.querySelector('.profile-section-header');
      var body = section.querySelector('.profile-section-body');
      var chevron = section.querySelector('.profile-section-chevron');
      var name = section.dataset.section;
      if (!header || !body || !name) return;
      var isExpanded = profileSectionsExpanded[name] !== false;
      if (!isExpanded) {
        body.style.maxHeight = '0';
        body.style.padding = '0';
        body.style.opacity = '0';
        if (chevron) chevron.style.transform = 'rotate(-90deg)';
      }
      header.addEventListener('click', function() {
        var expanded = profileSectionsExpanded[name] !== false;
        if (expanded) {
          body.style.maxHeight = '0';
          body.style.padding = '0';
          body.style.opacity = '0';
          if (chevron) chevron.style.transform = 'rotate(-90deg)';
          profileSectionsExpanded[name] = false;
        } else {
          body.style.maxHeight = body.scrollHeight + 'px';
          body.style.padding = '';
          body.style.opacity = '1';
          if (chevron) chevron.style.transform = 'rotate(0deg)';
          profileSectionsExpanded[name] = true;
        }
        try { localStorage.setItem('cb_profile_sections', JSON.stringify(profileSectionsExpanded)); } catch(e) {}
      });
    });
  });
})();

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth?.isLoggedIn?.()) {
    window.location.replace('/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
    return;
  }

  await Promise.all([
    loadProfilo(),
    loadCredito(),
    loadCinemaPreferito(),
    loadOrdini(),
    loadBiglietti(),
    loadMembership(),
    loadMerchOrders(),
    loadGiftCards(),
    loadPremi(),
    loadPartyBookings(),
  ]);

  setupProfiloForm();
});

async function loadProfilo() {
  try {
    profiloData = await API.getProfilo();
    fillProfiloForm();
    var user = Auth.getUser();
    if (user && user.localCredentialsEnabled === false) {
      document.getElementById('set-password-section').classList.remove('hidden');
    }
  } catch (error) {
    handleApiError(error);
  }
}

function fillProfiloForm() {
  if (!profiloData) return;
  document.getElementById('profilo-email').value = profiloData.email || '';
  document.getElementById('profilo-nome').value = profiloData.nome || '';
  document.getElementById('profilo-cognome').value = profiloData.cognome || '';
  document.getElementById('profilo-telefono').value = profiloData.telefono || '';
}

function setupProfiloForm() {
  const form = document.getElementById('profilo-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nome: document.getElementById('profilo-nome').value.trim(),
      cognome: document.getElementById('profilo-cognome').value.trim(),
      telefono: document.getElementById('profilo-telefono').value.trim() || null
    };

    try {
      profiloData = await API.updateProfilo(data);
      fillProfiloForm();
      const user = Auth.getUser();
      if (user) {
        user.nome = profiloData.nome;
        user.cognome = profiloData.cognome;
        Auth.saveUser(user);
      }
      showToast('Profilo aggiornato con successo');
      if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
      const savedEl = document.getElementById('profilo-saved');
      if (savedEl) {
        savedEl.classList.remove('hidden');
        setTimeout(() => savedEl.classList.add('hidden'), 2000);
      }
    } catch (error) {
      handleApiError(error);
    }
  });
}

async function loadCinemaPreferito() {
  const container = document.getElementById('cinema-preferito-content');
  try {
    const result = await API.getCinemaPreferito();
    cinemaPreferito = result;

    if (!result || !result.cinemaId) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-sm text-brand-on-surface-variant mb-3">Nessun cinema preferito impostato</p>
          <a href="/my-cinemas.html" class="btn-gold-sm">
            <i class="fa-solid fa-location-dot mr-1"></i>Scegli cinema
          </a>
        </div>`;
      return;
    }

    const cinema = result.cinema;
    container.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-gold/15 flex items-center justify-center">
          <i class="fa-solid fa-location-dot text-brand-gold text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-brand-on-surface truncate">${cinema.nome}</h3>
          <p class="text-sm text-brand-on-surface-variant">${cinema.citta}${cinema.indirizzo ? ` - ${cinema.indirizzo}` : ''}</p>
          ${cinema.telefono ? `<p class="text-xs text-brand-on-surface-variant mt-1"><i class="fa-solid fa-phone mr-1"></i>${cinema.telefono}</p>` : ''}
        </div>
        <a href="/my-cinemas.html" class="btn-ghost text-xs" title="Cambia cinema preferito">
          <i class="fa-solid fa-pen"></i>
        </a>
      </div>`;
  } catch {
    container.innerHTML = `<p class="text-sm text-brand-on-surface-variant">Errore caricamento cinema preferito</p>`;
  }
}

async function loadCredito() {
  const container = document.getElementById('credito-content');
  const badge = document.getElementById('credito-badge');
  try {
    creditoData = await API.getCreditoMe();

    const saldo = creditoData.saldoAttuale || 0;
    const movimenti = creditoData.movimenti || [];

    if (badge) badge.textContent = formatCurrency(saldo);

    if (!container) return;

    let html = `
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm text-brand-on-surface-variant">Saldo disponibile</p>
          <p class="text-2xl font-bold text-brand-gold">${formatCurrency(saldo)}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-brand-gold/15 flex items-center justify-center">
          <i class="fa-solid fa-wallet text-brand-gold text-xl"></i>
        </div>
      </div>`;

    if (movimenti.length > 0) {
      const recentMov = movimenti.slice(0, 5);
      html += `<div class="border-t border-brand-outline-variant/20 pt-3 mt-3">
        <p class="text-xs font-semibold text-brand-on-surface-variant uppercase tracking-wider mb-2">Ultimi movimenti</p>
        <div class="space-y-2">`;

      recentMov.forEach(m => {
        const isPositive = m.tipo === 'TopUp' || m.tipo === 'Refund';
        const icon = isPositive ? 'fa-arrow-down' : 'fa-arrow-up';
        const color = isPositive ? 'text-emerald-500' : 'text-red-400';
        const sign = isPositive ? '+' : '';
        const date = new Date(m.createdAtUtc);

        html += `
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <i class="fa-solid ${icon} ${color} text-xs"></i>
              <span class="text-brand-on-surface">${getMovimentoLabel(m.tipo)}</span>
            </div>
            <div class="text-right">
              <span class="${color} font-semibold">${sign}${formatCurrency(m.importo)}</span>
              <p class="text-xs text-brand-on-surface-variant">${date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>`;
      });

      html += `</div></div>`;
    }

    container.innerHTML = html;
  } catch (e) {
    console.error('loadCredito error:', e);
    if (container) container.innerHTML = '<p class="text-sm text-brand-on-surface-variant">Errore caricamento credito</p>';
    if (badge) badge.textContent = '—';
  }
}

async function loadOrdini() {
  const container = document.getElementById('ordini-list');
  try {
    const data = await API.getOrdini();
    const ordini = normalizeCollection(data);

    if (!ordini.length) {
      container.innerHTML = `
        <div class="text-center py-8 text-brand-on-surface-variant">
          <i class="fa-solid fa-receipt text-4xl mb-3 opacity-40"></i>
          <p class="font-medium">Nessun ordine</p>
          <p class="text-sm mt-1">I tuoi ordini appariranno qui</p>
        </div>`;
      return;
    }

    container.innerHTML = ordini.map(o => {
      const startDate = new Date(o.startAtUtc);
      const dateStr = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const statoBadge = getStatoBadge(o.stato);

      return `
        <div class="border border-brand-outline-variant/20 rounded-xl p-4 mb-3 hover:bg-brand-surface-container-high/50 transition-colors">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-brand-on-surface truncate">${o.filmTitolo}</h3>
                ${statoBadge}
              </div>
              <p class="text-sm text-brand-on-surface-variant">
                <i class="fa-solid fa-location-dot mr-1"></i>${o.cinemaNome} - ${o.salaNome}
              </p>
              <p class="text-sm text-brand-on-surface-variant">
                <i class="fa-regular fa-calendar mr-1"></i>${dateStr}
              </p>
              <div class="flex flex-wrap gap-3 mt-2 text-sm">
                <span class="text-brand-on-surface-variant">
                  <i class="fa-solid fa-ticket mr-1"></i>${o.numeroBiglietti} bigliett${o.numeroBiglietti === 1 ? 'o' : 'i'}
                </span>
                <span class="text-brand-gold font-semibold">${formatCurrency(o.totaleLordo)}</span>
              </div>
              <p class="text-xs text-brand-on-surface-variant mt-1 font-mono">${o.codiceOrdine}</p>
            </div>
            <div class="flex flex-col gap-1 ml-2 flex-shrink-0">
              ${o.stato === 'Pending' ? `<a href="/pagamento.html?orderId=${o.id}" class="btn-gold-sm text-xs" title="Completa pagamento"><i class="fa-solid fa-credit-card mr-1"></i>Paga ora</a>` : ''}
              ${o.stato === 'Paid' ? `<button onclick="downloadPdf(${o.id})" class="btn-ghost text-xs" title="Scarica PDF"><i class="fa-solid fa-file-pdf mr-1"></i>PDF</button>` : ''}
              <a href="/esito-acquisto.html?orderId=${o.id}" class="btn-ghost text-xs" title="Dettagli"><i class="fa-solid fa-eye mr-1"></i>Dettagli</a>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch {
    container.innerHTML = `<p class="text-sm text-brand-error text-center py-4">Errore caricamento ordini</p>`;
  }
}

async function loadBiglietti() {
  const container = document.getElementById('biglietti-list');
  try {
    const data = await API.getBiglietti();
    const biglietti = normalizeCollection(data);

    if (!biglietti.length) {
      container.innerHTML = `
        <div class="text-center py-8 text-brand-on-surface-variant">
          <i class="fa-solid fa-ticket text-4xl mb-3 opacity-40"></i>
          <p class="font-medium">Nessun biglietto</p>
          <p class="text-sm mt-1">I tuoi biglietti appariranno qui dopo l'acquisto</p>
        </div>`;
      return;
    }

    container.innerHTML = biglietti.map(b => {
      const startDate = new Date(b.startAtUtc);
      const dateStr = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const statoClass = b.stato === 'Issued' ? 'text-emerald-500' : b.stato === 'Validated' ? 'text-blue-500' : 'text-brand-on-surface-variant';
      const statoLabel = b.stato === 'Issued' ? 'Emesso' : b.stato === 'Validated' ? 'Validato' : b.stato === 'Cancelled' ? 'Annullato' : b.stato;

      return `
        <div class="border border-brand-outline-variant/20 rounded-xl p-4 mb-3 hover:bg-brand-surface-container-high/50 transition-colors">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-brand-on-surface truncate">${b.filmTitolo}</h3>
                <span class="${statoClass} text-xs font-semibold">${statoLabel}</span>
              </div>
              <p class="text-sm text-brand-on-surface-variant">
                <i class="fa-solid fa-location-dot mr-1"></i>${b.cinemaNome} - ${b.salaNome}
              </p>
              <p class="text-sm text-brand-on-surface-variant">
                <i class="fa-regular fa-calendar mr-1"></i>${dateStr}
              </p>
              <div class="flex flex-wrap gap-3 mt-2 text-sm">
                <span class="text-brand-on-surface-variant">
                  <i class="fa-solid fa-chair mr-1"></i>${b.settore} - Fila ${b.fila}, Posto ${b.numero}
                </span>
                <span class="text-brand-gold font-semibold">${formatCurrency(b.prezzoTotale)}</span>
              </div>
              <p class="text-xs text-brand-on-surface-variant mt-1 font-mono">${b.codiceBiglietto}</p>
              ${b.validatoAtUtc ? `<p class="text-xs text-blue-500 mt-1"><i class="fa-solid fa-check mr-1"></i>Validato il ${new Date(b.validatoAtUtc).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch {
    container.innerHTML = `<p class="text-sm text-brand-error text-center py-4">Errore caricamento biglietti</p>`;
  }
}

async function downloadPdf(orderId) {
  try {
    const blob = await API.getOrdinePdf(orderId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biglietti.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    showToast('Errore nel download del PDF', 'danger');
  }
}

function normalizeCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

function getStatoBadge(stato) {
  switch (stato) {
    case 'Paid':
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500"><i class="fa-solid fa-check text-[10px]"></i>Pagato</span>';
    case 'Pending':
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500"><i class="fa-solid fa-clock text-[10px]"></i>In attesa</span>';
    case 'Failed':
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500"><i class="fa-solid fa-xmark text-[10px]"></i>Fallito</span>';
    case 'Cancelled':
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500"><i class="fa-solid fa-xmark text-[10px]"></i>Cancellato</span>';
    default:
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-surface-container-high text-brand-on-surface-variant">' + stato + '</span>';
  }
}

document.getElementById('password-form')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  var msg = document.getElementById('password-msg');
  var btn = this.querySelector('button');
  btn.disabled = true;
  try {
    var res = await API.changePassword({
      currentPassword: document.getElementById('current-password').value,
      newPassword: document.getElementById('new-password').value
    });
    msg.className = 'text-sm text-emerald-500 block';
    msg.textContent = res.message || 'Password aggiornata';
    this.reset();
  } catch (err) {
    msg.className = 'text-sm text-brand-error block';
    msg.textContent = err.message || 'Errore';
  }
  msg.classList.remove('hidden');
  btn.disabled = false;
});

document.getElementById('email-form')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  var msg = document.getElementById('email-msg');
  var btn = this.querySelector('button');
  btn.disabled = true;
  try {
    var res = await API.changeEmail({
      currentPassword: document.getElementById('email-current-password').value,
      newEmail: document.getElementById('new-email').value
    });
    msg.className = 'text-sm text-emerald-500 block';
    msg.textContent = res.message || 'Email aggiornata';
    this.reset();
  } catch (err) {
    msg.className = 'text-sm text-brand-error block';
    msg.textContent = err.message || 'Errore';
  }
  msg.classList.remove('hidden');
  btn.disabled = false;
});

document.getElementById('btn-set-password')?.addEventListener('click', async function(){
  this.disabled = true;
  this.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Invio...';
  try {
    var res = await apiFetch('/auth/set-password/request', { method: 'POST' });
    showToast('Link inviato alla tua email per impostare la password');
  } catch(e) { handleApiError(e); }
  this.disabled = false;
  this.innerHTML = '<i class="fa-solid fa-key mr-2"></i>Imposta password locale';
});

async function requestDataExport() {
  var btn = document.getElementById('btn-export');
  var btnText = btn.querySelector('.btn-export-text');
  var btnLoader = btn.querySelector('.btn-export-loader');
  var msg = document.getElementById('export-msg');
  btn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');
  try {
    var res = await apiFetch('/auth/me/export/request', { method: 'POST' });
    msg.className = 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 px-4 py-3 rounded-xl text-sm';
    msg.textContent = res.message || 'Email di conferma inviata.';
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 5000);
  } catch(e) {
    msg.className = 'bg-brand-error-container border border-brand-error/30 text-brand-error px-4 py-3 rounded-xl text-sm';
    msg.textContent = e.message || 'Errore.';
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 8000);
  }
  btn.disabled = false;
  btnText.classList.remove('hidden');
  btnLoader.classList.add('hidden');
}

window.requestDataExport = requestDataExport;

// Delete account flow
document.getElementById('btn-delete-show')?.addEventListener('click', function() {
  document.getElementById('delete-warning').classList.remove('hidden');
  this.classList.add('hidden');
});

document.getElementById('btn-delete-cancel')?.addEventListener('click', function() {
  document.getElementById('delete-warning').classList.add('hidden');
  document.getElementById('btn-delete-show').classList.remove('hidden');
});

document.getElementById('btn-delete-request')?.addEventListener('click', async function() {
  var btnText = this.querySelector('.btn-delete-text');
  var loader = this.querySelector('.btn-delete-loader');
  var msg = document.getElementById('delete-msg');
  this.disabled = true;
  btnText.classList.add('hidden');
  loader.classList.remove('hidden');
  try {
    var res = await apiFetch('/auth/me/delete/request', { method: 'POST' });
    document.getElementById('delete-warning').classList.add('hidden');
    msg.className = 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 px-4 py-3 rounded-xl text-sm';
    msg.textContent = res.message || 'Email di conferma inviata. Controlla la tua casella di posta.';
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 5000);
  } catch(e) {
    msg.className = 'bg-brand-error-container border border-brand-error/30 text-brand-error px-4 py-3 rounded-xl text-sm';
    msg.textContent = e.message || 'Errore.';
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 8000);
  }
  this.disabled = false;
  btnText.classList.remove('hidden');
  loader.classList.add('hidden');
});

// ── Membership / Punti ──
function generateBarcodeSvg(code) {
  if (!code) return '';
  var codeStr = String(code);
  var barsHtml = '';
  var totalWidth = 0;
  for (var i = 0; i < codeStr.length; i++) {
    var n = codeStr.charCodeAt(i);
    for (var b = 0; b < 8; b++) {
      var bit = (n >> (7 - b)) & 1;
      var w = bit ? 2 : 1;
      if (bit) {
        barsHtml += '<rect x="' + totalWidth + '" y="0" width="' + w + '" height="50" fill="currentColor"/>';
      }
      totalWidth += w + 1;
    }
  }
  return '<div class="barcode-container" style="color:var(--brand-on-surface);">' +
    '<svg width="100%" height="50" viewBox="0 0 ' + totalWidth + ' 50" preserveAspectRatio="xMidYMid meet" style="display:block;">' +
    barsHtml +
    '</svg>' +
    '<p class="text-center text-xs font-mono text-brand-on-surface-variant mt-1 tracking-[0.3em]">' + code + '</p>' +
    '</div>';
}

async function loadMembership() {
  var container = document.getElementById('membership-content');
  try {
    var [card, punti] = await Promise.all([
      API.getMembershipCard().catch(function(){ return null; }),
      API.getPuntiStorico().catch(function(){ return null; })
    ]);
    var hasCard = card && (card.isAttiva || (card.puntiTotali || 0) > 0 || card.dataScadenzaAbbonamento);
    if (!hasCard) {
      container.innerHTML =
        '<div class="cine-premium-card p-8 text-center" style="background:linear-gradient(135deg, #1c1713, #2a221d);border:2px solid rgba(212,175,55,0.3);">' +
          '<div class="max-w-md mx-auto">' +
            '<div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center shadow-lg">' +
              '<i class="fa-solid fa-crown text-white text-3xl"></i>' +
            '</div>' +
            '<h2 class="text-2xl font-bold text-brand-on-surface font-serif mb-2">Carta Fedeltà Cinema67</h2>' +
            '<p class="text-brand-on-surface-variant mb-6">Accumula punti con ogni acquisto e ricevi premi esclusivi, sconti e molto altro.</p>' +
            '<div class="grid grid-cols-3 gap-3 mb-6 text-sm">' +
              '<div class="bg-brand-surface-container rounded-xl p-3"><p class="text-brand-gold font-bold text-lg">5%</p><p class="text-xs text-brand-on-surface-variant">Cashback punti</p></div>' +
              '<div class="bg-brand-surface-container rounded-xl p-3"><p class="text-brand-gold font-bold text-lg">-15%</p><p class="text-xs text-brand-on-surface-variant">Sconto iscrizione</p></div>' +
              '<div class="bg-brand-surface-container rounded-xl p-3"><p class="text-brand-gold font-bold text-lg">Premi</p><p class="text-xs text-brand-on-surface-variant">Esclusivi</p></div>' +
            '</div>' +
            '<a href="/membership.html" class="btn-gold px-8 py-3 text-sm inline-flex items-center gap-2">' +
              '<i class="fa-solid fa-crown"></i> Attiva la tua Carta Fedeltà' +
            '</a>' +
            '<p class="text-xs text-brand-on-surface-variant mt-3">È gratis! Solo pochi click.</p>' +
          '</div>' +
        '</div>';
      return;
    }
    var tierLabels = { '0': 'Base', '1': 'Silver', '2': 'Gold', '3': 'Platinum' };
    var tier = tierLabels[card.tier] || 'Base';
    var isAbbonato = card.isAttiva && card.dataScadenzaAbbonamento;
    var barcode = generateBarcodeSvg(card.cardNumber || 'C67' + card.id);
    var userName = ((profiloData && profiloData.nome) || '').toUpperCase() + ' ' + ((profiloData && profiloData.cognome) || '').toUpperCase();
    var html =
      '<div class="cine-premium-card p-0 overflow-hidden relative" style="border:2px solid var(--brand-gold);">' +
        '<div class="absolute inset-0 opacity-[0.04] pointer-events-none" style="background:linear-gradient(135deg, var(--brand-gold), var(--brand-red));"></div>' +
        '<div class="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none" style="background:var(--brand-gold);filter:blur(24px);"></div>' +
        '<div class="p-5 sm:p-6 relative z-10">' +
          '<div class="flex items-start justify-between mb-4">' +
            '<div>' +
              '<p class="text-[10px] uppercase tracking-[0.25em] font-semibold" style="color:var(--brand-gold);">Cinema67</p>' +
              '<p class="text-xs mt-0.5" style="color:var(--brand-on-surface-variant);">L\'Arte del Cinema</p>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold" style="border:1px solid var(--brand-gold);color:var(--brand-gold);">' + tier + '</span>' +
              (isAbbonato ? '<span class="text-[10px]" style="color:var(--color-success, #10b981);"><i class="fa-solid fa-circle text-[6px] mr-1"></i>Premium</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="mb-4">' +
            '<p class="font-mono text-lg sm:text-xl tracking-[0.2em] font-bold" style="color:var(--brand-on-surface);">' + (card.cardNumber || 'C67-' + String(card.id).padStart(8, '0')) + '</p>' +
            '<p class="text-xs mt-1 font-medium tracking-wider" style="color:var(--brand-on-surface-variant);">' + userName + '</p>' +
          '</div>' +
          '<div class="flex items-end justify-between">' +
            '<div>' +
              '<p class="text-2xl font-bold font-serif" style="color:var(--brand-gold);">' + (card.puntiDisponibili || 0) + '</p>' +
              '<p class="text-[10px] uppercase tracking-wider" style="color:var(--brand-on-surface-variant);">Punti disponibili</p>' +
            '</div>' +
            '<div class="text-right">' +
              '<p class="text-xs" style="color:var(--brand-on-surface-variant);">Accumulati</p>' +
              '<p class="text-sm font-semibold" style="color:var(--brand-on-surface);">' + (card.puntiTotali || 0) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="px-5 sm:px-6 pb-4 pt-3 flex justify-center" style="border-top:1px dashed var(--brand-gold);">' +
          '<div style="color:var(--brand-on-surface);">' + barcode + '</div>' +
        '</div>' +
      '</div>';

    if (punti && punti.length > 0) {
      var recenti = punti.slice(0, 5);
      html += '<div class="mt-4 cine-premium-card p-4"><p class="text-xs font-semibold text-brand-on-surface-variant uppercase tracking-wider mb-3">Ultimi movimenti punti</p><div class="space-y-2">';
      recenti.forEach(function(m) {
        var isPlus = m.tipo === 'Acquisto' || m.tipo === 'Bonus' || m.tipo === 'Regalo' || m.tipo === '0' || m.tipo === '1' || m.tipo === '4';
        var sign = isPlus ? '+' : '';
        var color = isPlus ? 'text-emerald-500' : 'text-red-400';
        var label = m.tipo === '0' || m.tipo === 'Acquisto' ? 'Acquisto' : m.tipo === '1' || m.tipo === 'Bonus' ? 'Bonus' : m.tipo === '2' || m.tipo === 'Riscatto' ? 'Riscatto' : m.tipo;
        html +=
          '<div class="flex items-center justify-between text-sm py-1">' +
            '<span class="text-brand-on-surface">' + label + (m.note ? ' — ' + m.note : '') + '</span>' +
            '<span class="' + color + ' font-semibold">' + sign + (m.punti || 0) + '</span>' +
          '</div>';
      });
      html += '</div></div>';
    }

    html += '<div class="mt-3 text-center"><a href="/membership.html" class="text-xs text-brand-gold hover:underline">Gestisci membership <i class="fa-solid fa-arrow-right ml-1"></i></a></div>';
    container.innerHTML = html;
  } catch(e) {
    console.error('loadMembership error:', e);
    container.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore caricamento carta fedeltà</p>';
  }
}

// ── Ordini Shop ──
async function loadMerchOrders() {
  var container = document.getElementById('merch-orders-list');
  try {
    var data = await API.getMyMerchOrders();
    var orders = normalizeCollection(data);
    if (!orders.length) {
      container.innerHTML =
        '<div class="text-center py-8 text-brand-on-surface-variant">' +
          '<i class="fa-solid fa-store text-4xl mb-3 opacity-40"></i>' +
          '<p class="font-medium">Nessun acquisto</p>' +
          '<p class="text-sm mt-1">I tuoi acquisti dallo shop appariranno qui</p>' +
        '</div>';
      return;
    }
    container.innerHTML = orders.map(function(o) {
      var statoBadge = getMerchStatoBadge(o.stato);
      var date = new Date(o.createdAtUtc).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
      var items = o.items || [];
      var itemsText = items.map(function(i) { return i.quantita + 'x ' + (i.nome || 'Articolo'); }).join(', ');
      return '<div class="border border-brand-outline-variant/20 rounded-xl p-4 mb-3 hover:bg-brand-surface-container-high/50 transition-colors">' +
        '<div class="flex justify-between items-start">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<h3 class="font-semibold text-brand-on-surface truncate">' + (o.codiceOrdine || 'Ordine #' + o.id) + '</h3>' +
              statoBadge +
            '</div>' +
            '<p class="text-sm text-brand-on-surface-variant">' + date + '</p>' +
            (itemsText ? '<p class="text-sm text-brand-on-surface-variant mt-1">' + itemsText + '</p>' : '') +
            '<p class="text-brand-gold font-semibold text-sm mt-1">' + formatCurrency(o.totale) + '</p>' +
            (o.statoSpedizione && o.statoSpedizione !== 'InAttesa' ? '<p class="text-xs text-brand-on-surface-variant mt-1">Spedizione: ' + o.statoSpedizione + (o.trackingNumber ? ' — ' + o.trackingNumber : '') + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    console.error('loadMerchOrders error:', e);
    container.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore caricamento ordini shop</p>';
  }
}

function getMerchStatoBadge(stato) {
  switch(stato) {
    case 'Paid': return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500"><i class="fa-solid fa-check text-[10px]"></i>Pagato</span>';
    case 'Pending': return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500"><i class="fa-solid fa-clock text-[10px]"></i>In attesa</span>';
    case 'Cancelled': return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500"><i class="fa-solid fa-xmark text-[10px]"></i>Cancellato</span>';
    case 'Expired': return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500"><i class="fa-solid fa-clock text-[10px]"></i>Scaduto</span>';
    default: return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-surface-container-high text-brand-on-surface-variant">' + stato + '</span>';
  }
}

// ── Gift Card ──
async function loadGiftCards() {
  var container = document.getElementById('giftcard-list');
  try {
    var data = await API.getMieGiftCard();
    var cards = normalizeCollection(data);
    if (!cards.length) {
      container.innerHTML =
        '<div class="text-center py-8 text-brand-on-surface-variant">' +
          '<i class="fa-solid fa-gift text-4xl mb-3 opacity-40"></i>' +
          '<p class="font-medium">Nessuna gift card</p>' +
          '<p class="text-sm mt-1">Le tue gift card appariranno qui</p>' +
        '</div>';
      return;
    }
    container.innerHTML = cards.map(function(g) {
      var statoLabel = g.stato === '0' || g.stato === 'Attiva' ? '<span class="text-emerald-500 text-xs font-semibold"><i class="fa-solid fa-circle mr-1"></i>Attiva</span>' : '<span class="text-brand-on-surface-variant text-xs"><i class="fa-solid fa-circle mr-1"></i>' + (g.stato === '1' ? 'Riscattata' : g.stato === '2' ? 'Scaduta' : 'Disattivata') + '</span>';
      var isAcquired = g.acquirenteUserId && g.riscattataDaUserId && g.acquirenteUserId === g.riscattataDaUserId;
      var ruolo = isAcquired ? 'Auto-acquistata' : (g.acquirenteUserId ? 'Acquistata da te' : (g.riscattataDaUserId ? 'Riscattata da te' : ''));
      return '<div class="border border-brand-outline-variant/20 rounded-xl p-4 mb-3">' +
        '<div class="flex justify-between items-start">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<span class="font-mono font-bold text-brand-gold">' + g.codice + '</span>' +
              statoLabel +
            '</div>' +
            (ruolo ? '<p class="text-xs text-brand-on-surface-variant">' + ruolo + '</p>' : '') +
            (g.destinatarioEmail ? '<p class="text-xs text-brand-on-surface-variant">Destinatario: ' + g.destinatarioEmail + '</p>' : '') +
            '<div class="flex gap-4 mt-2 text-sm">' +
              '<span class="text-brand-on-surface-variant">Valore: <strong class="text-brand-on-surface">' + formatCurrency(g.valoreIniziale) + '</strong></span>' +
              '<span class="text-brand-on-surface-variant">Residuo: <strong class="text-brand-gold">' + formatCurrency(g.saldoResiduo) + '</strong></span>' +
            '</div>' +
            '<p class="text-xs text-brand-on-surface-variant mt-1">Acquistata il ' + new Date(g.dataAcquisto).toLocaleDateString('it-IT') + (g.dataScadenza ? ' — Scade il ' + new Date(g.dataScadenza).toLocaleDateString('it-IT') : '') + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    console.error('loadGiftCards error:', e);
    container.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore caricamento gift card</p>';
  }
}

// ── Premi Riscattati ──
async function loadPremi() {
  var container = document.getElementById('premi-list');
  try {
    var data = await API.getMieiRiscatti();
    var riscatti = normalizeCollection(data);
    if (!riscatti.length) {
      container.innerHTML =
        '<div class="text-center py-8 text-brand-on-surface-variant">' +
          '<i class="fa-solid fa-award text-4xl mb-3 opacity-40"></i>' +
          '<p class="font-medium">Nessun premio riscattato</p>' +
          '<p class="text-sm mt-1">I premi riscattati con i punti appariranno qui</p>' +
        '</div>';
      return;
    }
    container.innerHTML = riscatti.map(function(r) {
      var statoLabel = r.stato === '0' || r.stato === 'Attivo' ? '<span class="text-emerald-500 text-xs font-semibold">Attivo</span>' : (r.stato === '1' ? '<span class="text-blue-500 text-xs font-semibold">Usato</span>' : '<span class="text-brand-on-surface-variant text-xs">Scaduto</span>');
      return '<div class="border border-brand-outline-variant/20 rounded-xl p-4 mb-3">' +
        '<div class="flex justify-between items-start">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<span class="font-semibold text-brand-on-surface">' + (r.premioNome || 'Premio #' + r.id) + '</span>' +
              statoLabel +
            '</div>' +
            (r.codice ? '<p class="font-mono text-sm text-brand-gold">Codice: ' + r.codice + '</p>' : '') +
            '<div class="flex gap-4 mt-2 text-sm">' +
              '<span class="text-brand-on-surface-variant">Punti spesi: <strong class="text-brand-on-surface">' + (r.puntiSpesi || 0) + '</strong></span>' +
            '</div>' +
            '<p class="text-xs text-brand-on-surface-variant mt-1">Riscattato il ' + new Date(r.dataRiscatto).toLocaleDateString('it-IT') + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    console.error('loadPremi error:', e);
    container.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore caricamento premi</p>';
  }
}

// ── Feste Prenotate ──
async function loadPartyBookings() {
  var container = document.getElementById('party-list');
  try {
    var data = await API.getMyPartyBookings();
    var bookings = normalizeCollection(data);
    if (!bookings.length) {
      container.innerHTML =
        '<div class="text-center py-8 text-brand-on-surface-variant">' +
          '<i class="fa-solid fa-calendar-days text-4xl mb-3 opacity-40"></i>' +
          '<p class="font-medium">Nessuna festa prenotata</p>' +
          '<p class="text-sm mt-1">Le tue prenotazioni per feste appariranno qui</p>' +
        '</div>';
      return;
    }
    container.innerHTML = bookings.map(function(b) {
      var statoLabel = b.stato === '0' || b.stato === 'Pending' ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500"><i class="fa-solid fa-clock text-[10px]"></i>In attesa</span>' :
                        b.stato === '1' || b.stato === 'Confirmed' ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500"><i class="fa-solid fa-check text-[10px]"></i>Confermata</span>' :
                        b.stato === '2' || b.stato === 'Completed' ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-500"><i class="fa-solid fa-check-double text-[10px]"></i>Completata</span>' :
                        '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-500"><i class="fa-solid fa-xmark text-[10px]"></i>Cancellata</span>';
      var tipoLabel = b.tipo === '0' || b.tipo === 'MovieParty' ? 'Festa al Cinema' : b.tipo === '1' || b.tipo === 'GameRoom' ? 'Sala Giochi' : b.tipo === '2' || b.tipo === 'Both' ? 'Completa' : b.tipo;
      var eventoDate = b.dataEvento ? new Date(b.dataEvento).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      return '<div class="border border-brand-outline-variant/20 rounded-xl p-4 mb-3">' +
        '<div class="flex justify-between items-start">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<h3 class="font-semibold text-brand-on-surface truncate">' + (b.nomeFesta || 'Festa') + '</h3>' +
              statoLabel +
            '</div>' +
            (tipoLabel ? '<p class="text-sm text-brand-on-surface-variant"><i class="fa-solid fa-tag mr-1"></i>' + tipoLabel + '</p>' : '') +
            (eventoDate ? '<p class="text-sm text-brand-on-surface-variant"><i class="fa-regular fa-calendar mr-1"></i>' + eventoDate + '</p>' : '') +
            '<div class="flex gap-4 mt-2 text-sm">' +
              (b.numeroOspiti ? '<span class="text-brand-on-surface-variant"><i class="fa-solid fa-users mr-1"></i>' + b.numeroOspiti + ' ospiti</span>' : '') +
              (b.totale ? '<span class="text-brand-gold font-semibold">' + formatCurrency(b.totale) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    console.error('loadPartyBookings error:', e);
    container.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore caricamento feste</p>';
  }
}

function getMovimentoLabel(tipo) {
  switch (tipo) {
    case 'TopUp': return 'Ricarica';
    case 'DebitOrder': return 'Acquisto';
    case 'Refund': return 'Rimborso';
    case 'Adjustment': return 'Rettifica';
    default: return tipo;
  }
}
