var editingId = null;
document.addEventListener('DOMContentLoaded', loadFood);

async function loadFood() {
  var tbody = document.getElementById('food-table');
  try {
    var data = await API.getAllFoodItems();
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center">Nessun prodotto</td></tr>'; return; }
    tbody.innerHTML = data.map(function(f) {
      return '<tr class="row-hover"><td class="px-4 py-3"><span class="text-2xl">' + getFoodEmoji(f.categoria) + '</span></td><td class="px-4 py-3 text-sm font-bold text-brand-on-surface">' + f.nome + '</td><td class="px-4 py-3 text-sm text-brand-on-surface-variant">' + f.categoria + '</td><td class="px-4 py-3 text-sm text-brand-gold font-bold">€' + f.prezzo.toFixed(2) + '</td><td class="px-4 py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ' + (f.attivo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-on-surface-variant/10 text-brand-on-surface-variant') + '">' + (f.attivo ? 'Sì' : 'No') + '</span></td><td class="px-4 py-3"><button onclick="editFood(' + f.id + ')" class="text-brand-gold mr-3"><i class="fa-solid fa-pencil"></i></button><button onclick="deleteFood(' + f.id + ')" class="text-brand-red"><i class="fa-solid fa-trash"></i></button></td></tr>';
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-brand-error">Errore</td></tr>'; }
}

function getFoodEmoji(cat) { var m = { Popcorn: '🍿', Bevande: '🥤', Snack: '🌮', Dolci: '🍪' }; return m[cat] || '🍽️'; }

window.openAddModal = function() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Nuovo Prodotto';
  document.getElementById('food-form').reset();
  document.getElementById('food-modal').classList.remove('hidden');
};

window.editFood = function(id) {
  editingId = id;
  document.getElementById('modal-title').textContent = 'Modifica Prodotto';
  document.getElementById('food-modal').classList.remove('hidden');
  API.getAllFoodItems().then(function(data) {
    var f = data.find(function(x) { return x.id === id; });
    if (f) {
      var form = document.getElementById('food-form');
      form.querySelector('[name="id"]').value = f.id;
      form.querySelector('[name="nome"]').value = f.nome;
      form.querySelector('[name="descrizione"]').value = f.descrizione || '';
      form.querySelector('[name="categoria"]').value = f.categoria;
      form.querySelector('[name="prezzo"]').value = f.prezzo;
      form.querySelector('[name="immagine"]').value = f.immaginePath || '';
      form.querySelector('[name="attivo"]').checked = f.attivo;
    }
  });
};

window.saveFood = async function() {
  var f = document.getElementById('food-form');
  var data = {
    nome: f.querySelector('[name="nome"]').value,
    descrizione: f.querySelector('[name="descrizione"]').value || null,
    categoria: f.querySelector('[name="categoria"]').value,
    prezzo: parseFloat(f.querySelector('[name="prezzo"]').value),
    immaginePath: f.querySelector('[name="immagine"]').value || null,
    attivo: f.querySelector('[name="attivo"]').checked
  };
  try {
    if (editingId) { await API.updateFoodItem(editingId, data); showToast('Aggiornato', 'success'); }
    else { await API.createFoodItem(data); showToast('Creato', 'success'); }
    closeFoodModal();
    await loadFood();
  } catch(e) { showToast('Errore', 'error'); }
};

window.deleteFood = async function(id) { if (confirm('Eliminare?')) { await API.deleteFoodItem(id); showToast('Eliminato'); await loadFood(); } };
window.closeFoodModal = function() { document.getElementById('food-modal').classList.add('hidden'); };

// ── Cassa Scanner ──
var foodScanner = null;
async function startScanner() {
  document.getElementById('qr-reader').classList.remove('hidden');
  document.getElementById('btn-start-scan').classList.add('hidden');
  document.getElementById('btn-stop-scan').classList.remove('hidden');
  try {
    foodScanner = new Html5Qrcode('qr-reader');
    await foodScanner.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}}, onScan, function(){});
  } catch(e) { document.getElementById('receipt-result').innerHTML='<p class="text-brand-red text-sm">Fotocamera non disponibile.</p>'; stopScanner(); }
}
function onScan(text) { document.getElementById('receipt-input').value=text; stopScanner(); lookupReceipt(); }
async function stopScanner() {
  document.getElementById('qr-reader').classList.add('hidden');
  document.getElementById('btn-start-scan').classList.remove('hidden');
  document.getElementById('btn-stop-scan').classList.add('hidden');
  if (foodScanner) { try { await foodScanner.stop(); } catch(e) {} try { document.getElementById('qr-reader').innerHTML=''; } catch(e) {} foodScanner=null; }
}
async function lookupReceipt() {
  var code = document.getElementById('receipt-input').value.trim().toUpperCase();
  if (!code) return;
  try {
    var data = await apiFetch('/admin/food/receipt/' + encodeURIComponent(code));
    var html = '<div class="border-t border-brand-outline-variant/20 pt-4 mt-4"><div class="flex items-center justify-between mb-3"><div><span class="text-xs font-mono text-brand-gold">Ordine: ' + data.codiceOrdine + '</span></div><span class="text-xs">Totale: <b class="text-brand-gold">&euro;' + (data.foodTotal||0).toFixed(2) + '</b></span></div><div class="space-y-2">';
    (data.items||[]).forEach(function(f) {
      html += '<div class="flex items-center justify-between p-3 rounded-lg ' + (f.servito ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-brand-surface-container border border-brand-outline-variant/10') + '">'
        + '<div class="flex-1"><p class="text-sm font-bold">' + f.nome + ' <span class="text-xs text-brand-on-surface-variant">x' + f.quantita + '</span></p>'
        + '<p class="text-xs text-brand-on-surface-variant">' + (f.categoria||'') + ' &middot; &euro;' + f.prezzoUnitario.toFixed(2) + ' cad.</p></div>'
        + (f.servito ? '<span class="text-xs text-emerald-500"><i class="fa-solid fa-circle-check mr-1"></i>Servito</span>'
          : '<button onclick="markServed(' + f.id + ')" class="btn-gold text-xs px-3 py-1"><i class="fa-solid fa-check mr-1"></i>Servito</button>')
        + '<span class="text-xs font-bold ml-2">&euro;' + (f.subTotale||0).toFixed(2) + '</span></div>';
    });
    html += '</div></div>';
    document.getElementById('receipt-result').innerHTML = html;
  } catch(e) { document.getElementById('receipt-result').innerHTML = '<p class="text-brand-red text-sm mt-2">Codice non trovato o nessun cibo.</p>'; }
}
async function markServed(itemId) {
  try { await apiFetch('/admin/food/serve/' + itemId, { method: 'POST' }); lookupReceipt(); }
  catch(e) { alert('Errore: ' + (e.message || '')); }
}

window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.lookupReceipt = lookupReceipt;
window.markServed = markServed;
