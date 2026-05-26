(function () {
  var premiData = [];
  var loading = document.getElementById('premi-loading');
  var empty = document.getElementById('premi-empty');
  var tableContainer = document.getElementById('premi-table-container');
  var tableBody = document.getElementById('premi-table-body');
  var modal = document.getElementById('premio-modal');
  var modalTitle = document.getElementById('premio-modal-title');
  var form = document.getElementById('premio-form');
  var formError = document.getElementById('premio-form-error');

  document.getElementById('btn-nuovo-premio')?.addEventListener('click', function () { openModal(); });
  document.getElementById('premio-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('premio-modal-cancel')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  form?.addEventListener('submit', async function (e) {
    e.preventDefault();
    formError.classList.add('hidden');
    var id = document.getElementById('premio-id').value;
    var data = {
      nome: document.getElementById('premio-nome').value.trim(),
      descrizione: document.getElementById('premio-descrizione').value.trim() || null,
      tipo: document.getElementById('premio-tipo').value,
      costoPunti: parseFloat(document.getElementById('premio-costo').value),
      valore: parseFloat(document.getElementById('premio-valore').value) || 0,
      quantitaDisponibile: parseInt(document.getElementById('premio-qty').value, 10),
      attivo: document.getElementById('premio-attivo').checked
    };
    if (!data.nome) { showFormError('Il nome è obbligatorio.'); return; }
    if (!data.costoPunti || data.costoPunti < 1) { showFormError('Il costo in punti deve essere almeno 1.'); return; }
    try {
      if (id) {
        await API.updatePremioAdmin(parseInt(id, 10), data);
        showToast('Premio aggiornato con successo');
      } else {
        await API.createPremioAdmin(data);
        showToast('Premio creato con successo');
      }
      closeModal();
      loadPremi();
    } catch (err) {
      showFormError(err.message || 'Errore durante il salvataggio.');
    }
  });

  function openModal(premio) {
    modalTitle.textContent = premio ? 'Modifica Premio' : 'Nuovo Premio';
    document.getElementById('premio-id').value = premio ? premio.id : '';
    document.getElementById('premio-nome').value = premio ? premio.nome : '';
    document.getElementById('premio-descrizione').value = premio ? (premio.descrizione || '') : '';
    document.getElementById('premio-tipo').value = premio ? premio.tipo : 'Sconto';
    document.getElementById('premio-costo').value = premio ? premio.costoPunti : '';
    document.getElementById('premio-valore').value = premio ? premio.valore : '';
    document.getElementById('premio-qty').value = premio ? premio.quantitaDisponibile : '-1';
    document.getElementById('premio-attivo').checked = premio ? premio.attivo : true;
    formError.classList.add('hidden');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.classList.remove('hidden');
  }

  async function loadPremi() {
    try {
      premiData = await API.getAllPremiAdmin();
      if (loading) loading.classList.add('hidden');
      if (!premiData || premiData.length === 0) {
        if (empty) empty.classList.remove('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
        return;
      }
      if (tableContainer) tableContainer.classList.remove('hidden');
      if (empty) empty.classList.add('hidden');
      renderPremi();
    } catch (e) {
      if (loading) loading.classList.add('hidden');
      console.error('Errore caricamento premi:', e);
    }
  }

  function renderPremi() {
    tableBody.innerHTML = premiData.map(function (p) {
      var disp = p.quantitaDisponibile === -1 ? 'Illimitata' : p.quantitaDisponibile;
      var stato = p.attivo ? '<span class="text-emerald-500 text-xs font-semibold"><i class="fa-solid fa-circle text-[6px] mr-1"></i>Attivo</span>' : '<span class="text-brand-on-surface-variant text-xs"><i class="fa-solid fa-circle text-[6px] mr-1"></i>Disattivo</span>';
      var tipoLabel = p.tipo === 'Sconto' ? '<i class="fa-solid fa-percent mr-1"></i>Sconto' : p.tipo === 'Biglietto' ? '<i class="fa-solid fa-ticket mr-1"></i>Biglietto' : p.tipo === 'Upgrade' ? '<i class="fa-solid fa-arrow-up mr-1"></i>Upgrade' : p.tipo === 'GiftCard' ? '<i class="fa-solid fa-gift mr-1"></i>Gift Card' : p.tipo === 'Merch' ? '<i class="fa-solid fa-store mr-1"></i>Merch' : '<i class="fa-solid fa-utensils mr-1"></i>' + p.tipo;
      return '<tr class="border-b border-brand-outline-variant/10">' +
        '<td class="py-3 pr-4"><div class="font-medium text-brand-on-surface">' + escapeHtml(p.nome) + '</div>' + (p.descrizione ? '<div class="text-xs text-brand-on-surface-variant">' + escapeHtml(p.descrizione) + '</div>' : '') + '</td>' +
        '<td class="py-3 pr-4 text-brand-on-surface text-xs">' + tipoLabel + '</td>' +
        '<td class="py-3 pr-4 text-brand-gold font-semibold">' + p.costoPunti + '</td>' +
        '<td class="py-3 pr-4 text-brand-on-surface">€' + (p.valore || '0').toFixed(2) + '</td>' +
        '<td class="py-3 pr-4 text-brand-on-surface-variant">' + disp + '</td>' +
        '<td class="py-3 pr-4">' + stato + '</td>' +
        '<td class="py-3 whitespace-nowrap">' +
          '<button class="edit-btn text-brand-gold hover:text-brand-gold/70 mr-3 transition-colors" data-id="' + p.id + '" title="Modifica"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="delete-btn text-red-500 hover:text-red-400 transition-colors" data-id="' + p.id + '" title="Elimina"><i class="fa-solid fa-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');

    tableBody.querySelectorAll('.edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id, 10);
        var premio = premiData.find(function (p) { return p.id === id; });
        if (premio) openModal(premio);
      });
    });

    tableBody.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id, 10);
        if (confirm('Eliminare questo premio?')) deletePremio(id);
      });
    });
  }

  async function deletePremio(id) {
    try {
      await API.deletePremioAdmin(id);
      showToast('Premio eliminato');
      loadPremi();
    } catch (e) {
      showToast(e.message || 'Errore eliminazione', 'error');
    }
  }

  function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    var cls = type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white';
    toast.className = cls + ' px-4 py-2 rounded-xl shadow-lg text-sm animate-fade-in';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  loadPremi();
})();
