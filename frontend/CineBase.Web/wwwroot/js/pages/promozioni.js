var promos = [];
var editingId = null;

function openModal(editData) {
  var form = document.getElementById('promo-form');
  form.reset();
  editingId = null;
  document.getElementById('modal-title').textContent = 'Nuova Promozione';

  if (editData) {
    editingId = editData.id;
    document.getElementById('modal-title').textContent = 'Modifica Promozione';
    form.querySelector('[name="id"]').value = editData.id;
    form.querySelector('[name="title"]').value = editData.title || '';
    form.querySelector('[name="description"]').value = editData.description || '';
    form.querySelector('[name="type"]').value = editData.type || 'MoviePromo';
    form.querySelector('[name="price"]').value = editData.price || '';
    form.querySelector('[name="linkUrl"]').value = editData.linkUrl || '';
    form.querySelector('[name="imagePath"]').value = editData.imagePath || '';
    form.querySelector('[name="priority"]').value = editData.priority != null ? editData.priority : 0;
    form.querySelector('[name="active"]').value = editData.active ? 'true' : 'false';
    form.querySelector('[name="discountPercent"]').value = editData.discountPercent || '';
    form.querySelector('[name="discountCode"]').value = editData.discountCode || '';
    form.querySelector('[name="maxUsage"]').value = editData.maxUsage || '';
    if (editData.startDate) form.querySelector('[name="startDate"]').value = editData.startDate.substring(0, 16);
    if (editData.endDate) form.querySelector('[name="endDate"]').value = editData.endDate.substring(0, 16);
  }

  document.getElementById('promo-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('promo-modal').classList.add('hidden');
}

async function loadPromos() {
  var tbody = document.getElementById('promo-table-body');
  try {
    promos = await API.getPromotions({ active: null });
    if (!promos.length) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessuna promozione creata</td></tr>'; return; }
    tbody.innerHTML = promos.map(function (p) {
      var typeLabels = { MoviePromo: 'Promo Film', FoodBundle: 'Combo Cibo', GeneralAd: 'Pubblicita', Event: 'Evento', Discount: 'Sconto' };
      return '<tr class="row-hover"><td class="px-6 py-4"><p class="text-sm font-semibold">' + escapeHtml(p.title) + '</p><p class="text-xs text-brand-on-surface-variant">' + escapeHtml(p.description.substring(0, 80)) + '...</p></td><td class="px-6 py-4 text-sm">' + (typeLabels[p.type] || p.type) + '</td><td class="px-6 py-4 text-sm">' + (p.price ? formatCurrency(p.price) : '-') + '</td><td class="px-6 py-4"><span class="' + (p.active ? 'chip-active' : 'chip-past') + ' chip-status">' + (p.active ? 'Attiva' : 'Spenta') + '</span></td><td class="px-6 py-4"><button onclick="editPromo(' + p.id + ')" class="text-brand-gold mr-3"><i class="fa-solid fa-pencil"></i></button><button onclick="deletePromo(' + p.id + ')" class="text-red-600"><i class="fa-solid fa-trash"></i></button></td></tr>';
    }).join('');
  } catch (e) { console.error(e); tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-brand-error">Errore caricamento</td></tr>'; }
}

function editPromo(id) {
  var p = promos.find(function (x) { return x.id === id; });
  if (p) openModal(p);
}

async function deletePromo(id) {
  if (!confirm('Eliminare questa promozione?')) return;
  try { await API.deletePromotion(id); showToast('Promozione eliminata'); loadPromos(); }
  catch (e) { handleApiError(e); }
}

function getFormData() {
  var f = document.getElementById('promo-form');
  return {
    title: f.querySelector('[name="title"]').value,
    description: f.querySelector('[name="description"]').value,
    type: f.querySelector('[name="type"]').value,
    price: f.querySelector('[name="price"]').value ? parseFloat(f.querySelector('[name="price"]').value) : null,
    linkUrl: f.querySelector('[name="linkUrl"]').value || null,
    imagePath: f.querySelector('[name="imagePath"]').value || null,
    priority: parseInt(f.querySelector('[name="priority"]').value) || 0,
    active: f.querySelector('[name="active"]').value === 'true',
    discountPercent: f.querySelector('[name="discountPercent"]').value ? parseInt(f.querySelector('[name="discountPercent"]').value) : null,
    discountCode: f.querySelector('[name="discountCode"]').value || null,
    maxUsage: f.querySelector('[name="maxUsage"]').value ? parseInt(f.querySelector('[name="maxUsage"]').value) : null,
    startDate: f.querySelector('[name="startDate"]').value || null,
    endDate: f.querySelector('[name="endDate"]').value || null
  };
}

document.getElementById('modal-submit').addEventListener('click', async function () {
  var data = getFormData();
  if (!data.title || !data.description) { showToast('Titolo e descrizione obbligatori', 'danger'); return; }
  try {
    if (editingId) { await API.updatePromotion(editingId, data); showToast('Promozione aggiornata'); }
    else { await API.createPromotion(data); showToast('Promozione creata'); }
    closeModal();
    loadPromos();
  } catch (e) { handleApiError(e); }
});

document.addEventListener('DOMContentLoaded', loadPromos);
