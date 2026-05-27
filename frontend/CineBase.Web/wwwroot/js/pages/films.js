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
let currentFilmTab = 'manuale';
let tmdbSelectedFilm = null;

document.addEventListener('DOMContentLoaded', function () {
  Promise.all([
    loadRegistiList(),
    loadCategorieList()
  ]).then(function () {
    populateRegistiSelect();
    populateCategorieCheckboxes();
    populateRegistiSelectTmdb();
    populateCategorieCheckboxesTmdb();
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

function populateRegistiSelectTmdb() {
  const select = document.getElementById('regista-select-tmdb');
  if (!select) return;

  select.innerHTML = '<option value="">Seleziona regista</option>';
  allRegisti.forEach(regista => {
    const option = document.createElement('option');
    option.value = String(regista.id);
    option.textContent = `${regista.nome} ${regista.cognome}`;
    select.appendChild(option);
  });
}

function populateCategorieCheckboxesTmdb() {
  const container = document.getElementById('categorie-checkboxes-tmdb');
  if (!container) return;

  container.innerHTML = allCategorie.map(cat => `
    <label class="inline-flex items-center gap-1 cursor-pointer">
      <input type="checkbox" name="categoria-tmdb" value="${cat.id}" class="w-4 h-4 rounded border-brand-outline text-brand-gold focus:ring-brand-gold">
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
    var imageUrl;
    if (film.copertinaPath) {
      if (film.copertinaPath.indexOf('/media/') === 0) {
        imageUrl = 'http://localhost:5000' + film.copertinaPath;
      } else if (film.copertinaPath.indexOf('http://') === 0 || film.copertinaPath.indexOf('https://') === 0) {
        imageUrl = film.copertinaPath;
      } else {
        imageUrl = '/assets/images/defaults/cover-default.jpg';
      }
    } else {
      imageUrl = '/assets/images/defaults/cover-default.jpg';
    }
    return '<tr class="row-hover"><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + film.id + '</td><td class="px-6 py-4 whitespace-nowrap"><div class="h-10 w-8 flex-shrink-0 bg-brand-surface-container rounded overflow-hidden"><img class="h-full w-full object-cover" src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(film.titolo) + '"></div></td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-on-surface">' + escapeHtml(film.titolo) + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + formatDate(film.dataProduzione) + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + escapeHtml(getRegistaName(film)) + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + (film.durata || '-') + ' min</td><td class="px-6 py-4 whitespace-nowrap">' + categorieBadges + '</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onclick="editFilm(' + film.id + ')" class="text-brand-gold hover:text-brand-gold-dark mr-3"><i class="fa-solid fa-pencil"></i></button><button onclick="deleteFilm(' + film.id + ', \'' + escapeHtml(film.titolo).replace(/'/g, '\\\'') + '\')" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash"></i></button></td></tr>';
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

  const newReleases = films.filter(f => f.dataRilascio && new Date(f.dataRilascio) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length;
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

function switchFilmTab(tab) {
    currentFilmTab = tab;
    const manualTab = document.getElementById('film-manual-tab');
    const tmdbTab = document.getElementById('film-tmdb-tab');
    const tabManualBtn = document.getElementById('tab-manuale');
    const tabTmdbBtn = document.getElementById('tab-tmdb');

    if (tab === 'manuale') {
        manualTab.classList.remove('hidden');
        tmdbTab.classList.add('hidden');
        tabManualBtn.classList.add('border-brand-gold', 'text-brand-gold');
        tabManualBtn.classList.remove('border-transparent', 'text-brand-on-surface-variant');
        tabTmdbBtn.classList.remove('border-brand-gold', 'text-brand-gold');
        tabTmdbBtn.classList.add('border-transparent', 'text-brand-on-surface-variant');
    } else {
        manualTab.classList.add('hidden');
        tmdbTab.classList.remove('hidden');
        tabManualBtn.classList.remove('border-brand-gold', 'text-brand-gold');
        tabManualBtn.classList.add('border-transparent', 'text-brand-on-surface-variant');
        tabTmdbBtn.classList.add('border-brand-gold', 'text-brand-gold');
        tabTmdbBtn.classList.remove('border-transparent', 'text-brand-on-surface-variant');
    }
}

function setupPositionToggle() {
    // Manual tab
    const positionRadios = document.querySelectorAll('input[name="posizione"]');
    positionRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const dataRilascioField = document.getElementById('data-rilascio-field');
            if (e.target.value === 'nuove-uscite') {
                dataRilascioField.classList.remove('hidden');
                document.getElementById('data-rilascio-input').required = true;
            } else {
                dataRilascioField.classList.add('hidden');
                document.getElementById('data-rilascio-input').required = false;
            }
        });
    });

    // TMDB tab
    const positionRadiosTmdb = document.querySelectorAll('input[name="posizione-tmdb"]');
    positionRadiosTmdb.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'nuove-uscite') {
                document.getElementById('data-rilascio-field-tmdb').classList.remove('hidden');
                document.getElementById('data-rilascio-input-tmdb').required = true;
            } else {
                document.getElementById('data-rilascio-field-tmdb').classList.add('hidden');
                document.getElementById('data-rilascio-input-tmdb').required = false;
            }
        });
    });
}

async function searchTmdbFilms() {
    const query = document.getElementById('tmdb-search-input').value.trim();
    if (!query) {
        showToast('Inserisci un titolo da cercare');
        return;
    }

    try {
        const results = await API.searchTmdbFilms(query);
        displayTmdbResults(results);
    } catch (error) {
        handleApiError(error);
    }
}

function displayTmdbResults(results) {
    const container = document.getElementById('tmdb-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = '<p class="text-sm text-brand-on-surface-variant text-center py-8">Nessun risultato trovato</p>';
        return;
    }

    container.innerHTML = results.map(film => `
        <div class="border border-brand-outline rounded-lg p-3 cursor-pointer hover:bg-brand-surface-container transition-colors"
             onclick="selectTmdbFilm(${film.id})">
            <div class="flex gap-3">
                ${film.posterPath ? `<img src="https://image.tmdb.org/t/p/w92${film.posterPath}" alt="${escapeHtml(film.title)}" class="h-20 w-14 object-cover rounded flex-shrink-0">` : `<div class="h-20 w-14 bg-brand-surface-container rounded flex-shrink-0"></div>`}
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-brand-on-surface truncate">${escapeHtml(film.title)}</p>
                    <p class="text-xs text-brand-on-surface-variant">${film.releaseDate || 'N/A'}</p>
                    <p class="text-xs text-brand-on-surface-variant line-clamp-2 mt-1">${escapeHtml(film.overview || 'Nessuna trama disponibile')}</p>
                </div>
            </div>
        </div>
    `).join('');
}

async function selectTmdbFilm(tmdbId) {
    try {
        // Show loading state
        const resultsContainer = document.getElementById('tmdb-results');
        const originalHtml = resultsContainer.innerHTML;
        resultsContainer.innerHTML = '<p class="text-center text-brand-on-surface-variant py-4">Caricamento dettagli...</p>';

        // Fetch full details from backend TMDB service
        const detail = await API.getTmdbFilmDetail(tmdbId);

        tmdbSelectedFilm = detail;
        document.getElementById('tmdb-selected-id').value = tmdbId;

        // Populate details
        document.getElementById('tmdb-selected-title').textContent = detail.title || 'N/A';
        document.getElementById('tmdb-selected-date').textContent = detail.releaseDate ? 
            new Date(detail.releaseDate).toLocaleDateString('it-IT') : 'Data non disponibile';
        document.getElementById('tmdb-runtime-value').textContent = detail.runtime || 120;
        document.getElementById('tmdb-selected-overview').textContent = detail.overview || 'Nessuna trama disponibile';
        document.getElementById('tmdb-selected-director').textContent = detail.directorName || 'Regista sconosciuto';
        
        // Genres
        const genresContainer = document.getElementById('tmdb-selected-genres');
        genresContainer.innerHTML = (detail.genres || []).map(g => 
            `<span class="inline-block bg-brand-gold text-brand-on-primary px-2 py-1 rounded text-xs">${escapeHtml(g)}</span>`
        ).join('');

        // Cast
        const castText = (detail.cast || []).slice(0, 5).join(', ');
        document.getElementById('tmdb-selected-cast').textContent = castText || 'Cast non disponibile';

        // Poster
        if (detail.posterPath) {
            document.getElementById('tmdb-selected-poster').src = `https://image.tmdb.org/t/p/w342${detail.posterPath}`;
        }

        // Show selected film details panel
        document.getElementById('tmdb-selected').classList.remove('hidden');

        // Restore results
        resultsContainer.innerHTML = originalHtml;

        // Highlight the selected film
        document.querySelectorAll('#tmdb-results > div').forEach((el, idx) => {
            if (idx === Array.from(document.querySelectorAll('#tmdb-results > div')).findIndex(e => 
                e.onclick && e.onclick.toString().includes(tmdbId))) {
                el.classList.add('border-brand-gold', 'border-2');
            } else {
                el.classList.remove('border-brand-gold', 'border-2');
            }
        });

        // Pre-select director if exists
        
        showToast('Film selezionato! Scegli posizione e data rilascio');
    } catch (error) {
        console.error('Error selecting TMDB film:', error);
        showToast('Errore nel caricamento dettagli film');
    }
}

async function submitFilmForm() {
    if (currentFilmTab === 'manuale') {
        submitManualFilm();
    } else {
        submitTmdbFilm();
    }
}

async function submitManualFilm() {
    const form = document.getElementById('film-form');
    if (!form.checkValidity()) {
        showToast('Completa tutti i campi obbligatori');
        return;
    }

    const submitBtn = document.getElementById('film-submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    const copertinaFile = document.getElementById('copertina-file')?.files[0];
    const copertinaPathInput = document.getElementById('copertina-path');

    try {
        let copertinaPath = copertinaPathInput?.value || '';

        if (copertinaFile) {
            isUploading = true;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Caricamento...';

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
        const posizione = data.posizione;
        delete data.posizione;
        
        data.copertinaPath = copertinaPath;
        if (data.registaId) data.registaId = Number(data.registaId);
        if (data.durata) data.durata = Number(data.durata);
        delete data.copertinaFile;
        delete data.categoria;

        const selectedCats = Array.from(form.querySelectorAll('input[name="categoria"]:checked'))
          .map(cb => Number(cb.value));
        data.categorieIds = selectedCats;

        // Handle position
        if (posizione === 'nuove-uscite') {
            const dataRilascio = document.getElementById('data-rilascio-input').value;
            if (!dataRilascio) {
                showToast('Data rilascio obbligatoria per film in Nuove Uscite');
                return;
            }
            data.dataRilascio = dataRilascio;
        } else {
            data.dataRilascio = null;
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
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText || 'Salva';
    }
}

async function submitTmdbFilm() {
    const tmdbId = document.getElementById('tmdb-selected-id').value;
    const tmdbIdNum = Number(tmdbId);
    
    if (!tmdbId || tmdbIdNum <= 0) {
        showToast('Seleziona un film da TMDB');
        return;
    }

    const posizioneRadio = document.querySelector('input[name="posizione-tmdb"]:checked');
    if (!posizioneRadio) {
        showToast('Seleziona una posizione (Evidenza o Nuove Uscite)');
        return;
    }
    const posizione = posizioneRadio.value;
    
    const submitBtn = document.getElementById('film-submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Importazione...';

        const data = {
            tmdbId: tmdbIdNum,
            registaId: 0,  // Backend will auto-fetch from TMDB
            categorieIds: [],  // Categories are optional
            posizione: posizione
        };

        if (posizione === 'nuove-uscite') {
            const dataRilascio = document.getElementById('data-rilascio-input-tmdb').value;
            if (!dataRilascio) {
                showToast('Data rilascio obbligatoria per film in Nuove Uscite');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }
            data.dataRilascio = dataRilascio;
        }

        await API.importTmdbFilm(data);
        showToast('Film importato con successo');
        closeModal('film-modal');
        await loadFilms();
    } catch (error) {
        handleApiError(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText || 'Salva';
    }
}

function setupFormSubmit() {
    // This is now handled by submitFilmForm() called on button click
    setupPositionToggle();
}

async function editFilm(id) {
    try {
        const film = await API.getFilm(id);
        switchFilmTab('manuale'); // Reset to manual tab
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

        // Set posizione based on dataRilascio
        const posizione = film.dataRilascio ? 'nuove-uscite' : 'evidenza';
        form.querySelector(`input[name="posizione"][value="${posizione}"]`).checked = true;
        
        if (film.dataRilascio) {
            document.getElementById('data-rilascio-field').classList.remove('hidden');
            document.getElementById('data-rilascio-input').value = film.dataRilascio;
        } else {
            document.getElementById('data-rilascio-field').classList.add('hidden');
            document.getElementById('data-rilascio-input').value = '';
        }

        // Reset TMDB tab
        tmdbSelectedFilm = null;
        document.getElementById('tmdb-selected-id').value = '';
        document.getElementById('tmdb-selected').classList.add('hidden');
        document.getElementById('tmdb-search-input').value = '';
        document.getElementById('tmdb-results').innerHTML = '<p class="text-sm text-brand-on-surface-variant text-center py-8">Inizia a cercare per vedere i risultati</p>';
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
