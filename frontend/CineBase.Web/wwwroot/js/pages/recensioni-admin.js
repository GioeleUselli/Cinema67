(function () {
  var loading = document.getElementById('review-loading');
  var empty = document.getElementById('review-empty');
  var tableContainer = document.getElementById('review-table-container');
  var tableBody = document.getElementById('review-table-body');

  if (!tableBody) return;

  loadPending();

  async function loadPending() {
    try {
      var reviews = await API.getRecensioniPending();
      if (loading) loading.classList.add('hidden');
      if (!reviews || reviews.length === 0) {
        if (empty) empty.classList.remove('hidden');
        return;
      }
      if (tableContainer) tableContainer.classList.remove('hidden');
      renderReviews(reviews);
    } catch (e) {
      if (loading) loading.classList.add('hidden');
      console.error('Errore caricamento recensioni pending:', e);
      if (empty) {
        empty.classList.remove('hidden');
        empty.querySelector('h3').textContent = 'Errore di caricamento';
        empty.querySelector('p').textContent = 'Impossibile caricare le recensioni. Riprova più tardi.';
      }
    }
  }

  function renderReviews(reviews) {
    tableBody.innerHTML = reviews.map(function (r) {
      var stars = '';
      for (var i = 0; i < r.voto; i++) stars += '★';
      for (var i = r.voto; i < 10; i++) stars += '☆';
      var date = new Date(r.createdAtUtc).toLocaleDateString('it-IT') + ' ' + new Date(r.createdAtUtc).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      var testoPreview = r.testo.length > 100 ? r.testo.substring(0, 100) + '...' : r.testo;
      return '<tr class="border-b border-brand-outline-variant/10">' +
        '<td class="py-3 pr-4 text-brand-on-surface">' + escapeHtml(r.filmTitolo) + '</td>' +
        '<td class="py-3 pr-4 text-brand-on-surface">' + escapeHtml(r.userNome) + '</td>' +
        '<td class="py-3 pr-4 text-brand-gold whitespace-nowrap">' + stars + '</td>' +
        '<td class="py-3 pr-4 text-brand-on-surface max-w-xs">' +
          '<div class="line-clamp-3 text-sm">' + escapeHtml(r.testo) + '</div>' +
        '</td>' +
        '<td class="py-3 pr-4 text-brand-on-surface-variant whitespace-nowrap text-xs">' + date + '</td>' +
        '<td class="py-3 whitespace-nowrap">' +
          '<button class="approve-btn text-green-500 hover:text-green-400 mr-3 transition-colors" data-id="' + r.id + '" title="Approva">' +
            '<i class="fa-solid fa-check"></i> Approva' +
          '</button>' +
          '<button class="delete-btn text-red-500 hover:text-red-400 transition-colors" data-id="' + r.id + '" title="Elimina">' +
            '<i class="fa-solid fa-trash"></i> Elimina' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    tableBody.querySelectorAll('.approve-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id, 10);
        approveReview(id);
      });
    });

    tableBody.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.id, 10);
        deleteReview(id);
      });
    });
  }

  async function approveReview(id) {
    try {
      await API.approvaRecensione(id);
      showToast('Recensione approvata con successo', 'success');
      removeRow(id);
    } catch (e) {
      showToast(e.message || 'Errore durante l\'approvazione', 'error');
    }
  }

  async function deleteReview(id) {
    if (!confirm('Eliminare questa recensione?')) return;
    try {
      await API.eliminaRecensione(id);
      showToast('Recensione eliminata', 'success');
      removeRow(id);
    } catch (e) {
      showToast(e.message || 'Errore durante l\'eliminazione', 'error');
    }
  }

  function removeRow(id) {
    var rows = tableBody.querySelectorAll('tr');
    var remaining = 0;
    rows.forEach(function (row) {
      var btn = row.querySelector('.approve-btn');
      if (btn && parseInt(btn.dataset.id, 10) === id) {
        row.remove();
      } else {
        remaining++;
      }
    });
    if (remaining === 0) {
      if (tableContainer) tableContainer.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
    }
  }

  function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    var cls = type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-green-600 text-white';
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
})();
