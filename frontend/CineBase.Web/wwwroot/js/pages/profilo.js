let profiloData = null;
let creditoData = null;
let cinemaPreferito = null;

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
  ]);

  setupProfiloForm();
});

async function loadProfilo() {
  try {
    profiloData = await API.getProfilo();
    fillProfiloForm();
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
  try {
    creditoData = await API.getCreditoMe();

    const saldo = creditoData.saldoAttuale || 0;
    const movimenti = creditoData.movimenti || [];

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
  } catch {
    container.innerHTML = `<p class="text-sm text-brand-on-surface-variant">Errore caricamento credito</p>`;
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
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-on-surface-variant/15 text-brand-on-surface-variant"><i class="fa-solid fa-ban text-[10px]"></i>Annullato</span>';
    case 'Expired':
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-on-surface-variant/15 text-brand-on-surface-variant"><i class="fa-solid fa-hourglass-end text-[10px]"></i>Scaduto</span>';
    default:
      return `<span class="text-xs">${stato}</span>`;
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
