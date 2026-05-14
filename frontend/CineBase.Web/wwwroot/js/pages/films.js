// Films Page JavaScript
let allFilms = [];
let allRegisti = [];
let allCategorie = [];
let isUploading = false;
let currentPage = 1;
var pageSize = 10;
let totalPages = 1;
let totalFilmsCount = 0;
let currentSearch = '';
let currentGenre = 'all';

document.addEventListener('DOMContentLoaded', function () {
  Promise.all([
    loadRegistiList(),
    loadCategorieList()
  ]).then(function () {
    populateRegistiSelect();
    populateCategorieCheckboxes();
    setupFilters();
    setupFormSubmit();
    loadFilms();
    setupExport();
  });
});

function setupExport() {
  var btn = document.getElementById('btn-export');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var rows = [['ID', 'Titolo', 'Regista', 'Durata', 'Anno', 'Categorie']];
    allFilms.forEach(function (f) {
      var cats = (f.categorie || []).map(function (c) { return c.nome; }).join('; ');
      rows.push([f.id, f.titolo, getRegistaName(f), (f.durata || '') + ' min', formatDate(f.dataProduzione), cats]);
    });
    var csv = rows.map(function (r) { return r.map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'films-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function loadRegistiList() {
  try {
    allRegisti = normalizeCollection(await API.getRegisti());
  } catch (error) {
    console.error('Error loading registi:', error);
  }
}

async function loadCategorieList() {
  try {
    allCategorie = normalizeCollection(await API.getCategorie());
  } catch (error) {
    console.error('Error loading categorie:', error);
  }
}

async function loadFilms() {
  try {
    var params = {};
    if (currentSearch) params.search = currentSearch;
    if (currentGenre && currentGenre !== 'all') params.genre = currentGenre;
    params.page = currentPage;
    params.pageSize = pageSize;
    var result = await API.getFilmsPaged ? API.getFilmsPaged(params) : { items: normalizeCollection(await API.getFilms()), total: 0 };
    allFilms = result.items || [];
    totalFilmsCount = result.total || allFilms.length;
    totalPages = result.totalPages || Math.ceil(totalFilmsCount / pageSize) || 1;
    renderFilms(allFilms);
    updateStats(totalFilmsCount, allFilms);
  } catch (e) {
    console.error('Error loading films:', e);
    var tbody = document.getElementById('films-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-brand-error">Errore caricamento film</td></tr>';
  }
}

function populateRegistiSelect() {
  const select = document.getElementById('regista-select');
  if (!select) return;

  select.innerHTML = '<option value="">Seleziona regista</option>';
  allRegisti.forEach(regista => {
    const option = document.createElement('option');
    option.value = String(regista.id);
    option.textContent = `${regista.nome} ${regista.cognome}`;
    select.appendChild(option);
  });
}

function populateCategorieCheckboxes() {
  const container = document.getElementById('categorie-checkboxes');
  if (!container) return;

  container.innerHTML = allCategorie.map(cat => `
    <label class="inline-flex items-center gap-1 cursor-pointer">
      <input type="checkbox" name="categoria" value="${cat.id}" class="w-4 h-4 rounded border-brand-outline text-brand-gold focus:ring-brand-gold">
      <span class="text-sm text-brand-on-surface">${cat.nome}</span>
    </label>
  `).join('');
}

function renderFilms(films) {
  var tableBody = document.getElementById('films-table-body');
  if (!tableBody) return;
  
  if (!films.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessun film trovato</td></tr>';
    return;
  }

  tableBody.innerHTML = films.map(function (film) {
    var categorie = film.categorie || [];
    var categorieBadges = categorie.length
      ? categorie.map(function (c) { return '<span class="inline-block bg-brand-surface-container text-brand-on-surface text-xs px-1.5 py-0.5 rounded mr-1">' + escapeHtml(c.nome) + '</span>'; }).join('')
      : '<span class="text-brand-on-surface-variant text-xs">-</span>';
    return '<tr class="row-hover"><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + film.id + '</td><td class="px-6 py-4 whitespace-nowrap"><div class="h-10 w-8 flex-shrink-0 bg-brand-surface-container rounded overflow-hidden"><img class="h-full w-full object-cover" src="' + escapeHtml(film.copertinaPath && film.copertinaPath.indexOf('/media/') === 0 ? 'http://localhost:5000' + film.copertinaPath : (film.copertinaPath || '/assets/images/defaults/cover-default.jpg')) + '" alt="' + escapeHtml(film.titolo) + '"></div></td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-on-surface">' + escapeHtml(film.titolo) + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + formatDate(film.dataProduzione) + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + escapeHtml(getRegistaName(film)) + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + (film.durata || '-') + ' min</td><td class="px-6 py-4 whitespace-nowrap">' + categorieBadges + '</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onclick="editFilm(' + film.id + ')" class="text-brand-gold hover:text-brand-gold-dark mr-3"><i class="fa-solid fa-pencil"></i></button><button onclick="deleteFilm(' + film.id + ', \'' + escapeHtml(film.titolo).replace(/'/g, '\\\'') + '\')" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash"></i></button></td></tr>';
  }).join('');
}

function getRegistaName(film) {
  if (film.registaNome || film.registaCognome) {
    return `${film.registaNome || ''} ${film.registaCognome || ''}`.trim();
  }

  const regista = allRegisti.find(r => Number(r.id) === Number(film.registaId));
  return regista ? `${regista.nome} ${regista.cognome}` : `ID ${film.registaId}`;
}

function updateStats(totalCount, films) {
  const totalFilmsEl = document.getElementById('total-films');
  if (totalFilmsEl) totalFilmsEl.textContent = String(totalCount);

  const newReleases = films.filter(f => f.dataUscita && new Date(f.dataUscita) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length;
  const newReleasesEl = document.getElementById('new-releases');
  if (newReleasesEl) newReleasesEl.textContent = String(newReleases);
}

function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const categoriaFilter = document.getElementById('categoria-filter');
  
  populateCategoriaFilter();

  searchInput?.addEventListener('input', async (e) => {
    currentSearch = (e.target.value || '').trim();
    currentPage = 1;
    await loadFilms();
  });

  categoriaFilter?.addEventListener('change', async (e) => {
    currentGenre = e.target.value || 'all';
    currentPage = 1;
    await loadFilms();
  });
}

function populateCategoriaFilter() {
  const select = document.getElementById('categoria-filter');
  if (!select || !allCategorie.length) return;

  select.innerHTML = '<option value="all">Tutte le Categorie</option>';
  allCategorie.forEach(cat => {
    const option = document.createElement('option');
    option.value = String(cat.id);
    option.textContent = cat.nome;
    select.appendChild(option);
  });
}

function renderPagination(serverItemsCount) {
  const paginationInfo = document.getElementById('pagination-info');
  const pageIndicator = document.getElementById('page-indicator');
  const firstBtn = document.getElementById('pagination-first');
  const prevBtn = document.getElementById('pagination-prev');
  const nextBtn = document.getElementById('pagination-next');
  const lastBtn = document.getElementById('pagination-last');

  if (!paginationInfo || !pageIndicator || !firstBtn || !prevBtn || !nextBtn || !lastBtn) return;

  if (totalFilmsCount === 0 || serverItemsCount === 0) {
    paginationInfo.textContent = 'Nessun risultato';
    pageIndicator.textContent = 'Pagina 1 di 1';
    firstBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    lastBtn.disabled = true;
    return;
  }

  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalFilmsCount);

  paginationInfo.textContent = `Mostrando ${startItem}-${endItem} di ${totalFilmsCount} film`;
  pageIndicator.textContent = `Pagina ${currentPage} di ${totalPages}`;

  firstBtn.disabled = currentPage <= 1;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  lastBtn.disabled = currentPage >= totalPages;
}

async function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  await loadFilms();
}

function goToFirstPage() {
  return goToPage(1);
}

function goToPrevPage() {
  return goToPage(currentPage - 1);
}

function goToNextPage() {
  return goToPage(currentPage + 1);
}

function goToLastPage() {
  return goToPage(totalPages);
}

function setupFormSubmit() {
    const form = document.getElementById('film-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isUploading) return;

        const submitBtn = document.querySelector('#film-modal button[form="film-form"]');
        const originalBtnText = submitBtn?.innerHTML;
        const copertinaFile = document.getElementById('copertina-file')?.files[0];
        const copertinaPathInput = document.getElementById('copertina-path');

        try {
            let copertinaPath = copertinaPathInput?.value || '';

            if (copertinaFile) {
                isUploading = true;
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Caricamento...';
                }

                try {
                    const uploadResult = await API.uploadCover(copertinaFile);
                    copertinaPath = uploadResult.path;
                    if (copertinaPathInput) copertinaPathInput.value = copertinaPath;
                } catch (uploadError) {
                    handleApiError(uploadError);
                    return;
                }
            }

            const data = serializeForm('film-form');
            data.copertinaPath = copertinaPath;
            if (data.registaId) data.registaId = Number(data.registaId);
            if (data.durata) data.durata = Number(data.durata);
            delete data.copertinaFile;
            delete data.categoria;

            const selectedCats = Array.from(form.querySelectorAll('input[name="categoria"]:checked'))
              .map(cb => Number(cb.value));
            if (selectedCats.length > 0) {
              data.categorieIds = selectedCats;
            } else {
              data.categorieIds = [];
            }

            const editId = form.dataset.editId;

            try {
                if (editId) {
                    await API.updateFilm(editId, data);
                    showToast('Film aggiornato con successo');
                } else {
                    await API.createFilm(data);
                    showToast('Film creato con successo');
                }

                closeModal('film-modal');
                await loadFilms();
            } catch (error) {
                handleApiError(error);
            }
        } finally {
            isUploading = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText || 'Salva';
            }
        }
    });
}

async function editFilm(id) {
    try {
        const film = await API.getFilm(id);
        openModal('film-modal', 'Modifica Film');

        const form = document.getElementById('film-form');
        form.dataset.editId = id;

        form.querySelector('[name="titolo"]').value = film.titolo || '';
        form.querySelector('[name="dataProduzione"]').value = formatDateForInput(film.dataProduzione);
        form.querySelector('[name="durata"]').value = film.durata || '';
        form.querySelector('[name="registaId"]').value = film.registaId || '';
        form.querySelector('[name="filmatoPath"]').value = film.filmatoPath || '';
        
        const copertinaPathInput = document.getElementById('copertina-path');
        if (copertinaPathInput) copertinaPathInput.value = film.copertinaPath || '';
        
        const copertinaFileInput = document.getElementById('copertina-file');
        if (copertinaFileInput) copertinaFileInput.value = '';

        const filmCats = film.categorie || [];
        const filmCatIds = filmCats.map(c => Number(c.id));
        form.querySelectorAll('input[name="categoria"]').forEach(cb => {
          cb.checked = filmCatIds.includes(Number(cb.value));
        });
    } catch (error) {
        handleApiError(error);
    }
}

async function deleteFilm(id, title) {
  openDeleteModal(title, async () => {
    try {
      await API.deleteFilm(id);
      showToast('Film eliminato con successo');
      await loadFilms();
    } catch (error) {
      handleApiError(error);
    }
  });
}

window.goToPage = goToPage;
window.goToFirstPage = goToFirstPage;
window.goToPrevPage = goToPrevPage;
window.goToNextPage = goToNextPage;
window.goToLastPage = goToLastPage;
