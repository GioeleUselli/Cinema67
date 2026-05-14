let allCinemas = [];
let selectedCinemaId = null;
let currentLookupData = null;
let scannerStream = null;
let scannerAnimationId = null;
let scannerActive = false;
let recentValidations = [];
let validationMode = 'normal'; // 'normal' | 'auto'
let autoValidatePending = false;

function normalizeCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

document.addEventListener('DOMContentLoaded', async () => {
  loadValidationMode();
  await loadCinemas();
  populateCinemaSelect();
  setupInputListeners();
  updateModeUI();
  checkQueryCode();
});

function loadValidationMode() {
  try {
    const saved = localStorage.getItem('cb_validation_mode');
    if (saved === 'auto') validationMode = 'auto';
  } catch (e) { /* ignore */ }
}

function saveValidationMode() {
  try {
    localStorage.setItem('cb_validation_mode', validationMode);
  } catch (e) { /* ignore */ }
}

function setValidationMode(mode) {
  validationMode = mode;
  saveValidationMode();
  updateModeUI();
}

function updateModeUI() {
  const normalBtn = document.getElementById('btn-mode-normal');
  const autoBtn = document.getElementById('btn-mode-auto');
  const hint = document.getElementById('auto-mode-hint');
  const lookupBtn = document.getElementById('btn-lookup');
  const description = document.getElementById('mode-description');

  if (normalBtn && autoBtn) {
    if (validationMode === 'auto') {
      normalBtn.classList.remove('btn-gold');
      normalBtn.classList.add('btn-outline-brand');
      autoBtn.classList.remove('btn-outline-brand');
      autoBtn.classList.add('btn-gold');
    } else {
      normalBtn.classList.remove('btn-outline-brand');
      normalBtn.classList.add('btn-gold');
      autoBtn.classList.remove('btn-gold');
      autoBtn.classList.add('btn-outline-brand');
    }
  }

  if (hint) {
    hint.classList.toggle('hidden', validationMode !== 'auto');
  }

  if (lookupBtn) {
    if (validationMode === 'auto') {
      lookupBtn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Valida';
      lookupBtn.classList.add('bg-brand-emerald');
    } else {
      lookupBtn.innerHTML = '<i class="fa-solid fa-search mr-2"></i>Verifica';
      lookupBtn.classList.remove('bg-brand-emerald');
    }
  }

  if (description) {
    description.textContent = validationMode === 'auto'
      ? 'Modalità rapida: inserisci il codice e la validazione parte automaticamente'
      : 'Valida i biglietti all\'ingresso del cinema';
  }
}

async function loadCinemas() {
  try {
    // Determine if user is CinemaStaff
    let isCinemaStaff = false;
    try {
      if (typeof Auth !== 'undefined' && Auth && Auth.getUserRole) {
        var rawRole = String(Auth.getUserRole()).trim().toLowerCase();
        isCinemaStaff = (rawRole === 'cinemastaff' || rawRole === '3');
      }
    } catch(e) {}

    // Load appropriate cinema list based on role
    if (isCinemaStaff) {
      // CinemaStaff: only load their assigned cinemas
      // API returns UserCinemaAssignment objects with Cinema property
      var assignments = normalizeCollection(await API.getStaffMyCinemas());
      // Extract Cinema objects from assignments
      allCinemas = assignments
        .map(a => a.Cinema)
        .filter(c => c && c.id); // Filter out null/invalid cinemas
    } else {
      // Admin/PowerUser: load all cinemas
      allCinemas = normalizeCollection(await API.getCinemas());
    }
  } catch (e) {
    console.error('Error loading cinemas:', e);
  }
}

function populateCinemaSelect() {
  const select = document.getElementById('validazione-cinema');
  if (!select) return;
  select.innerHTML = '<option value="">Seleziona cinema operativo...</option>' +
    allCinemas.map(c => `<option value="${c.id}">${c.nome} - ${c.citta}</option>`).join('');

  const saved = localStorage.getItem('cb_validation_cinema');
  if (saved && allCinemas.some(c => String(c.id) === saved)) {
    select.value = saved;
    selectedCinemaId = Number(saved);
  }

  select.addEventListener('change', () => {
    selectedCinemaId = select.value ? Number(select.value) : null;
    if (selectedCinemaId) {
      localStorage.setItem('cb_validation_cinema', String(selectedCinemaId));
    } else {
      localStorage.removeItem('cb_validation_cinema');
    }
  });
}

function setupInputListeners() {
  const input = document.getElementById('ticket-code-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validationMode === 'auto') {
        autoValidate();
      } else {
        lookupTicket();
      }
    }
  });
}

function checkQueryCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('codice');
  if (!code) return;

  const input = document.getElementById('ticket-code-input');
  if (!input) return;
  input.value = code;

  if (validationMode === 'auto') {
    if (selectedCinemaId) {
      // Cinema già noto — valida subito con un piccolo delay per stabilità DOM
      setTimeout(() => autoValidate(), 150);
    } else {
      // Auto mode ma cinema non ancora selezionato — avviso chiaro
      showToast('Seleziona il cinema operativo per attivare la validazione automatica', 'warning');
      document.getElementById('ticket-code-input')?.focus();
    }
  } else {
    lookupTicket();
  }
}

async function autoValidate() {
  if (autoValidatePending) return;

  if (!selectedCinemaId) {
    showToast('Seleziona il cinema operativo prima di validare', 'warning');
    return;
  }

  const code = document.getElementById('ticket-code-input')?.value?.trim();
  if (!code) {
    showToast('Inserisci un codice biglietto', 'warning');
    return;
  }

  autoValidatePending = true;
  const btn = document.getElementById('btn-lookup');
  const statusEl = document.getElementById('auto-validate-status');
  const lookupResult = document.getElementById('lookup-result');
  const validationResult = document.getElementById('validation-result');
  const input = document.getElementById('ticket-code-input');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Validazione...';
  }
  if (statusEl) statusEl.classList.remove('hidden');
  if (lookupResult) lookupResult.classList.add('hidden');
  if (validationResult) validationResult.classList.add('hidden');

  try {
    const result = await API.validateTicket({
      codiceBiglietto: code,
      cinemaId: selectedCinemaId
    });

    if (validationResult) {
      validationResult.classList.remove('hidden');
      if (result.success) {
        const ticket = result.ticket;
        validationResult.innerHTML = renderValidationSuccess(result, ticket);
        if (ticket) addRecentValidation({
          codiceBiglietto: ticket.codiceBiglietto || code,
          filmTitolo: ticket.filmTitolo,
          salaNome: ticket.salaNome,
          fila: ticket.fila,
          numero: ticket.numero
        }, true);
      } else {
        validationResult.innerHTML = renderValidationError(result);
      }
    }

    if (input) {
      input.value = '';
      input.focus();
    }
    currentLookupData = null;
  } catch (error) {
    handleApiError(error);
    if (validationResult) {
      validationResult.classList.remove('hidden');
      validationResult.innerHTML = renderExceptionError(error);
    }
  } finally {
    autoValidatePending = false;
    if (btn) {
      if (validationMode === 'auto') {
        btn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Valida';
        btn.classList.add('bg-brand-emerald');
      } else {
        btn.innerHTML = '<i class="fa-solid fa-search mr-2"></i>Verifica';
      }
      btn.disabled = false;
    }
    if (statusEl) statusEl.classList.add('hidden');
  }
}

async function lookupTicket() {
  if (validationMode === 'auto' && selectedCinemaId) {
    await autoValidate();
    return;
  }

  const code = document.getElementById('ticket-code-input')?.value?.trim();
  if (!code) {
    showToast('Inserisci un codice biglietto', 'warning');
    return;
  }

  const lookupResult = document.getElementById('lookup-result');
  const lookupDetail = document.getElementById('lookup-detail');
  const lookupActions = document.getElementById('lookup-actions');
  const validationResult = document.getElementById('validation-result');

  if (validationResult) validationResult.classList.add('hidden');
  if (lookupDetail) lookupDetail.innerHTML = '<p class="text-sm text-brand-on-surface-variant">Caricamento...</p>';
  if (lookupActions) lookupActions.innerHTML = '';
  if (lookupResult) lookupResult.classList.remove('hidden');

  try {
    const ticket = await API.lookupTicket(code);
    currentLookupData = ticket;
    renderLookupDetail(ticket);
  } catch (error) {
    currentLookupData = null;
    if (lookupResult) lookupResult.classList.remove('hidden');
    if (lookupDetail) {
      lookupDetail.innerHTML = `<div class="p-4 bg-brand-error-container rounded-xl">
        <p class="text-sm font-medium text-brand-error"><i class="fa-solid fa-circle-exclamation mr-2"></i>Biglietto non trovato o non valido</p>
        <p class="text-xs text-brand-on-surface-variant mt-1">${error.message || 'Codice non riconosciuto'}</p>
      </div>`;
    }
    if (lookupActions) lookupActions.innerHTML = '';
  }
}

function renderLookupDetail(ticket) {
  const lookupDetail = document.getElementById('lookup-detail');
  const lookupActions = document.getElementById('lookup-actions');
  if (!lookupDetail || !lookupActions) return;

  const alreadyValidated = ticket.stato === 'Validated' || ticket.validatoAtUtc;
  const startDate = ticket.startAtUtc ? new Date(ticket.startAtUtc).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  lookupDetail.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-3 bg-brand-surface-container rounded-xl">
        <p class="text-xs text-brand-on-surface-variant">Film</p>
        <p class="text-sm font-semibold text-brand-on-surface">${ticket.filmTitolo || '-'}</p>
      </div>
      <div class="p-3 bg-brand-surface-container rounded-xl">
        <p class="text-xs text-brand-on-surface-variant">Cinema</p>
        <p class="text-sm font-semibold text-brand-on-surface">${ticket.cinemaNome || '-'} - ${ticket.cinemaCitta || ''}</p>
      </div>
      <div class="p-3 bg-brand-surface-container rounded-xl">
        <p class="text-xs text-brand-on-surface-variant">Data/Ora</p>
        <p class="text-sm font-semibold text-brand-on-surface">${startDate}</p>
      </div>
      <div class="p-3 bg-brand-surface-container rounded-xl">
        <p class="text-xs text-brand-on-surface-variant">Posto</p>
        <p class="text-sm font-semibold text-brand-on-surface">${ticket.salaNome || 'Sala'} - ${ticket.settore || ''} Fila ${ticket.fila} Posto ${ticket.numero}</p>
      </div>
      <div class="p-3 bg-brand-surface-container rounded-xl">
        <p class="text-xs text-brand-on-surface-variant">Codice Biglietto</p>
        <p class="text-sm font-mono font-semibold text-brand-on-surface">${ticket.codiceBiglietto || '-'}</p>
      </div>
      <div class="p-3 bg-brand-surface-container rounded-xl">
        <p class="text-xs text-brand-on-surface-variant">Stato</p>
        <p class="text-sm font-semibold ${alreadyValidated ? 'text-brand-emerald' : 'text-brand-gold'}">${alreadyValidated ? 'Già Validato' : 'Non Validato'}</p>
      </div>
    </div>
  `;

  if (alreadyValidated) {
    lookupActions.innerHTML = `
      <div class="w-full p-4 bg-brand-surface-container rounded-xl">
        <p class="text-sm text-brand-on-surface-variant">
          <i class="fa-solid fa-circle-check text-brand-emerald mr-2"></i>
          Questo biglietto è già stato validato
          ${ticket.validatoAtUtc ? `il ${new Date(ticket.validatoAtUtc).toLocaleString('it-IT')}` : ''}
        </p>
      </div>
    `;
  } else {
    lookupActions.innerHTML = `
      <button onclick="validateTicket()" class="btn-gold px-6 py-3 rounded-lg text-sm font-medium w-full sm:w-auto" id="btn-validate">
        <i class="fa-solid fa-check mr-2"></i>Valida Biglietto
      </button>
      <p class="text-xs text-brand-on-surface-variant self-end">Assicurati che il cinema operativo sia corretto</p>
    `;
  }
}

async function validateTicket() {
  if (!currentLookupData) return;

  if (!selectedCinemaId) {
    showToast('Seleziona il cinema operativo prima di validare', 'warning');
    return;
  }

  const btn = document.getElementById('btn-validate');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Validazione...';
  }

  try {
    const result = await API.validateTicket({
      codiceBiglietto: currentLookupData.codiceBiglietto,
      cinemaId: selectedCinemaId
    });

    const validationResult = document.getElementById('validation-result');
    if (validationResult) {
      validationResult.classList.remove('hidden');
      if (result.success) {
        validationResult.innerHTML = renderValidationSuccess(result, currentLookupData);
        addRecentValidation(currentLookupData, true);
      } else {
        validationResult.innerHTML = renderValidationError(result);
      }
    }

    document.getElementById('lookup-result').classList.add('hidden');
    document.getElementById('ticket-code-input').value = '';
    currentLookupData = null;
    document.getElementById('ticket-code-input').focus();
  } catch (error) {
    handleApiError(error);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Valida Biglietto';
    }
  }
}

function renderValidationSuccess(result, ticket) {
  const startDate = ticket?.startAtUtc ? new Date(ticket.startAtUtc).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  return `
    <div class="card-elevated p-6 mb-6 validazione-success rounded-xl">
      <div class="flex items-center gap-3 mb-4">
        <i class="fa-solid fa-circle-check text-2xl"></i>
        <div>
          <p class="text-lg font-bold">Biglietto Validato</p>
          <p class="text-sm opacity-90">${result.message || 'Validazione completata con successo'}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm opacity-90">
        <div><span class="text-xs opacity-70">Film</span><p class="font-medium">${ticket?.filmTitolo || '-'}</p></div>
        <div><span class="text-xs opacity-70">Posto</span><p class="font-medium">F${ticket?.fila || '-'} P${ticket?.numero || '-'}</p></div>
        <div><span class="text-xs opacity-70">Data/Ora</span><p class="font-medium">${startDate}</p></div>
      </div>
    </div>
  `;
}

function renderValidationError(result) {
  return `
    <div class="card-elevated p-6 mb-6 validazione-error rounded-xl">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-circle-xmark text-2xl"></i>
        <div>
          <p class="text-lg font-bold">Validazione Fallita</p>
          <p class="text-sm opacity-90">${result.message || 'Impossibile validare il biglietto'}</p>
        </div>
      </div>
    </div>
  `;
}

function renderExceptionError(error) {
  return `
    <div class="card-elevated p-6 mb-6 validazione-error rounded-xl">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-circle-xmark text-2xl"></i>
        <div>
          <p class="text-lg font-bold">Validazione Fallita</p>
          <p class="text-sm opacity-90">${error.message || 'Impossibile validare il biglietto'}</p>
        </div>
      </div>
    </div>
  `;
}

function addRecentValidation(ticket, success) {
  recentValidations.unshift({
    codice: ticket.codiceBiglietto || '-',
    film: ticket.filmTitolo || '-',
    posto: `${ticket.salaNome || '-'} - F${ticket.fila || '-'} P${ticket.numero || '-'}`,
    time: new Date().toLocaleTimeString('it-IT'),
    success
  });

  if (recentValidations.length > 10) recentValidations.pop();
  renderRecentValidations();
}

function renderRecentValidations() {
  const container = document.getElementById('recent-validations');
  if (!container) return;

  if (!recentValidations.length) {
    container.innerHTML = '<p class="text-sm text-brand-on-surface-variant">Nessuna validazione recente</p>';
    return;
  }

  container.innerHTML = recentValidations.map(v => `
    <div class="flex items-center justify-between py-2 border-b border-brand-outline-variant/10 last:border-0">
      <div class="flex items-center gap-3">
        <i class="fa-solid ${v.success ? 'fa-circle-check text-brand-emerald' : 'fa-circle-xmark text-brand-error'}"></i>
        <div>
          <p class="text-sm font-medium text-brand-on-surface">${v.film}</p>
          <p class="text-xs text-brand-on-surface-variant">${v.posto} — ${v.codice}</p>
        </div>
      </div>
      <span class="text-xs text-brand-on-surface-variant">${v.time}</span>
    </div>
  `).join('');
}

// ---- Scanner QR/Barcode ----

async function toggleScanner() {
  if (scannerActive) {
    stopScanner();
  } else {
    await startScanner();
  }
}

async function startScanner() {
  const container = document.getElementById('scanner-container');
  const video = document.getElementById('scanner-video');
  const toggleBtn = document.getElementById('btn-scan-toggle');
  if (!container || !video) return;

  if ('BarcodeDetector' in window) {
    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      if (formats.length > 0) {
        scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = scannerStream;
        container.classList.remove('hidden');
        scannerActive = true;
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-stop text-brand-error text-xl"></i>';

        const detector = new BarcodeDetector({ formats });
        startBarcodeDetection(video, detector);
        return;
      }
    } catch (e) {
      console.warn('BarcodeDetector failed:', e);
    }
  }

  showToast('Scanner non supportato su questo browser. Inserisci il codice manualmente.', 'warning');
}

function startBarcodeDetection(video, detector) {
  const detect = async () => {
    if (!scannerActive) return;
    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        const input = document.getElementById('ticket-code-input');
        if (input) input.value = code;
        stopScanner();
        if (validationMode === 'auto' && selectedCinemaId) {
          autoValidate();
        } else {
          lookupTicket();
        }
        return;
      }
    } catch (e) { /* retry */ }
    scannerAnimationId = requestAnimationFrame(detect);
  };
  detect();
}

function stopScanner() {
  scannerActive = false;
  if (scannerAnimationId) {
    cancelAnimationFrame(scannerAnimationId);
    scannerAnimationId = null;
  }
  if (scannerStream) {
    scannerStream.getTracks().forEach(track => track.stop());
    scannerStream = null;
  }
  const container = document.getElementById('scanner-container');
  const toggleBtn = document.getElementById('btn-scan-toggle');
  if (container) container.classList.add('hidden');
  if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-qrcode text-xl"></i>';
}
