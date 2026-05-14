document.addEventListener('DOMContentLoaded', async function() {
  await Promise.all([loadCancellations(), loadRefunds(), loadReviews()]);
});

async function loadCancellations() {
  var c = document.getElementById('cancellations-list');
  try {
    var data = await API.getShowCancellations();
    if (!data || !data.length) { c.innerHTML = '<p class="text-sm text-brand-on-surface-variant text-center py-4">Nessuno show cancellato</p>'; return; }
    c.innerHTML = data.map(function(ca) {
      var sc = ca.status === 'Completed' ? 'text-emerald-500' : ca.status === 'Failed' ? 'text-brand-error' : 'text-amber-500';
      return '<div class="p-4 rounded-xl bg-brand-surface-container/50"><div class="flex items-center justify-between mb-2"><div><p class="text-sm font-bold text-brand-on-surface">Show #' + ca.showId + '</p><p class="text-xs text-brand-on-surface-variant">Cancellato il ' + new Date(ca.cancelledAtUtc).toLocaleString('it-IT') + (ca.reason ? ' · ' + ca.reason : '') + '</p></div><span class="text-xs font-semibold px-2 py-0.5 rounded-full ' + sc + '">' + ca.status + '</span></div><div class="grid grid-cols-4 gap-2 text-xs text-brand-on-surface-variant"><span>€' + (ca.totaleDaRimborsare||0).toFixed(2) + ' tot</span><span>' + ca.ordiniTotali + ' ordini</span><span>' + ca.rimborsiRiusciti + ' riusciti</span><span>' + ca.rimborsiFalliti + ' falliti</span></div><div class="flex gap-2 mt-2">' +
        (ca.emailsInviate ? '<span class="text-xs text-emerald-500"><i class="fa-solid fa-check mr-1"></i>Email inviate</span>' : '<button onclick="sendEmails(' + ca.id + ')" class="text-xs text-brand-gold hover:text-brand-red"><i class="fa-solid fa-envelope mr-1"></i>Invia email</button>') +
        (ca.status === 'Failed' ? '<button onclick="retryRefunds(' + ca.id + ')" class="text-xs text-brand-gold hover:text-brand-red ml-3"><i class="fa-solid fa-rotate mr-1"></i>Riprova rimborsi</button>' : '') +
        (ca.status !== 'Completed' && ca.status !== 'Failed' ? '<button onclick="processRefunds(' + ca.id + ')" class="text-xs text-brand-gold hover:text-brand-red ml-3"><i class="fa-solid fa-credit-card mr-1"></i>Processa rimborsi</button>' : '') +
        '</div></div>';
    }).join('');
  } catch(e) { c.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore</p>'; }
}

async function loadRefunds() {
  var tbody = document.getElementById('refunds-table');
  try {
    var data = await API.getAllRefunds();
    if (!data || !data.length) { tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center">Nessun rimborso</td></tr>'; return; }
    tbody.innerHTML = data.map(function(r) {
      var sc = r.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : r.status === 'Failed' ? 'bg-brand-error/10 text-brand-error' : 'bg-amber-500/10 text-amber-500';
      return '<tr class="row-hover"><td class="px-4 py-3 text-sm text-brand-on-surface">#' + r.ordineId + '</td><td class="px-4 py-3 text-sm">Show #' + r.showCancellationId + '</td><td class="px-4 py-3 text-sm font-bold">€' + ((r.importoCarta||0)+(r.importoCredito||0)).toFixed(2) + '</td><td class="px-4 py-3 text-sm">€' + (r.importoCarta||0).toFixed(2) + '</td><td class="px-4 py-3 text-sm">€' + (r.importoCredito||0).toFixed(2) + '</td><td class="px-4 py-3 text-xs font-mono text-brand-on-surface-variant">' + (r.stripeRefundId || '—') + '</td><td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full font-semibold ' + sc + '">' + r.status + '</span></td><td class="px-4 py-3 text-xs text-brand-error">' + (r.errorMessage || '') + '</td></tr>';
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-brand-error">Errore</td></tr>'; }
}

async function loadReviews() {
  var c = document.getElementById('reviews-list');
  try {
    var data = await API.getManualReviews();
    if (!data || !data.length) { c.innerHTML = '<p class="text-sm text-brand-on-surface-variant text-center py-4">Nessuna revisione in attesa</p>'; return; }
    c.innerHTML = data.map(function(r) {
      return '<div class="p-4 rounded-xl bg-brand-surface-container/50"><div class="flex items-center justify-between mb-2"><div><p class="text-sm font-bold text-brand-on-surface">Ordine #' + r.ordineId + '</p><p class="text-xs text-brand-on-surface-variant">' + r.reasonCode + ' · €' + (r.importo||0).toFixed(2) + ' · ' + (r.details || '') + '</p></div>' + (r.resolution ? '<span class="text-xs font-semibold text-brand-on-surface-variant">' + r.resolution + '</span>' : '<div class="flex gap-2"><button onclick="resolveReview(' + r.id + ', \'RefundFullSameMethod\')" class="text-xs text-emerald-500 hover:text-emerald-700">Rimborsa</button><button onclick="resolveReview(' + r.id + ', \'NoRefund\')" class="text-xs text-red-500 hover:text-red-700">Non rimborsare</button></div>') + '</div></div>';
    }).join('');
  } catch(e) { c.innerHTML = '<p class="text-sm text-brand-error text-center py-4">Errore</p>'; }
}

window.processRefunds = async function(id) { try { await API.processRefunds(id); showToast('Rimborsi processati', 'success'); await loadCancellations(); await loadRefunds(); } catch(e) { showToast('Errore', 'error'); } };
window.retryRefunds = async function(id) { try { await API.retryRefunds(id); showToast('Riprova avviata', 'success'); await loadCancellations(); } catch(e) { showToast('Errore', 'error'); } };
window.sendEmails = async function(id) { try { await API.sendCancelEmails(id); showToast('Email inviate', 'success'); await loadCancellations(); } catch(e) { showToast('Errore', 'error'); } };
window.resolveReview = async function(id, resolution) { try { await API.resolveManualReview(id, resolution); showToast('Risolto', 'success'); await loadReviews(); } catch(e) { showToast('Errore', 'error'); } };

var foundOrder = null;
window.searchOrder = async function() {
  var code = document.getElementById('refund-order-code').value.trim();
  if (!code) { showToast('Inserisci un codice ordine', 'warning'); return; }
  try {
    var orders = await API.getOrdini();
    foundOrder = orders.find(function(o) { return o.codiceOrdine === code; });
    if (!foundOrder) { showToast('Ordine non trovato', 'error'); return; }
    if (foundOrder.stato !== 'Paid') { showToast('Ordine non pagato', 'warning'); return; }
    var preview = document.getElementById('refund-order-preview');
    preview.classList.remove('hidden');
    document.getElementById('refund-preview-content').innerHTML =
      '<p class="text-sm font-bold text-brand-on-surface">Ordine #' + foundOrder.id + '</p>' +
      '<p class="text-xs text-brand-on-surface-variant">' + foundOrder.filmTitolo + ' · ' + foundOrder.cinemaNome + ' · ' + foundOrder.numeroBiglietti + ' biglietti</p>' +
      '<p class="text-xs text-brand-on-surface-variant mt-1">Totale: €' + foundOrder.totaleLordo.toFixed(2) + ' · Carta: €' + (foundOrder.importoCarta||0).toFixed(2) + ' · Credito: €' + (foundOrder.importoCredito||0).toFixed(2) + '</p>';
  } catch(e) { showToast('Errore ricerca', 'error'); }
};

window.executeManualRefund = async function() {
  if (!foundOrder) return;
  var reason = document.getElementById('refund-reason').value || 'Rimborso manuale';
  try {
    await API.manualRefund({ ordineId: foundOrder.id, reason: reason });
    showToast('Rimborso completato e email inviata!', 'success');
    document.getElementById('refund-order-preview').classList.add('hidden');
    document.getElementById('refund-order-code').value = '';
    await loadRefunds();
  } catch(e) { showToast(e.message || 'Errore rimborso', 'error'); }
};
