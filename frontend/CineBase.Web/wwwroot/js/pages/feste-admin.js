document.addEventListener('DOMContentLoaded', loadAll);
async function loadAll() {
  var tbody = document.getElementById('table-body');
  try {
    var data = await API.getAllPartyBookings();
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center">Nessuna prenotazione</td></tr>'; return; }
    tbody.innerHTML = data.map(function(b) {
      var sc = b.stato === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-500' : b.stato === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand-on-surface-variant/10 text-brand-on-surface-variant';
      return '<tr class="row-hover"><td class="px-4 py-3 text-sm font-bold text-brand-on-surface">' + b.nomeFesta + '</td><td class="px-4 py-3 text-sm">' + b.userNome + '</td><td class="px-4 py-3 text-sm">' + b.cinemaNome + '</td><td class="px-4 py-3 text-xs">' + new Date(b.dataEvento).toLocaleDateString() + ' ' + new Date(b.oraInizio).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) + '-' + new Date(b.oraFine).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) + '</td><td class="px-4 py-3 text-sm">' + b.tipo + ' ' + b.pacchetto + '</td><td class="px-4 py-3 text-sm">' + b.numeroOspiti + '</td><td class="px-4 py-3 text-sm font-bold">€' + b.totale.toFixed(2) + '</td><td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full font-semibold ' + sc + '">' + b.stato + '</span></td><td class="px-4 py-3"><select onchange="updateStatus(' + b.id + ', this.value)" class="ghost-input text-xs px-2 py-1"><option value="">Azione</option><option value="Confirmed">Conferma</option><option value="Completed">Completata</option><option value="Cancelled">Cancella</option></select></td></tr>';
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-brand-error">Errore</td></tr>'; }
}
window.updateStatus = async function(id, status) {
  if (!status) return;
  try { await API.updatePartyStatus(id, status); showToast('Aggiornato', 'success'); await loadAll(); } catch(e) { showToast('Errore', 'error'); }
};
window.scanQr = async function() {
  var code = prompt('Inserisci il QR code della festa (puoi scannerizzarlo con la fotocamera dal telefono):');
  if (!code) return;
  try { var result = await API.scanPartyQr({ qrData: code }); showToast('Festa completata: ' + result.nomeFesta, 'success'); await loadAll(); } catch(e) { showToast(e.message || 'QR non valido', 'error'); }
};
window.toggleAuto = function(checked) {
  if (checked) {
    autoComplete();
    localStorage.setItem('cb_auto_complete_party', '1');
  } else {
    localStorage.removeItem('cb_auto_complete_party');
  }
};
window.autoComplete = async function() {
  try { await API.autoCompleteParties(); showToast('Feste completate', 'success'); await loadAll(); } catch(e) { showToast('Errore', 'error'); }
};
if (localStorage.getItem('cb_auto_complete_party') === '1') {
  document.getElementById('auto-toggle').checked = true;
}
