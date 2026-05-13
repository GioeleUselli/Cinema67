// Configurazione base
const API_BASE_URL = 'http://localhost:5000';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

function getAuthSafe() {
  return typeof window !== 'undefined' && window.Auth ? window.Auth : null;
}

function isAdminAreaPath(pathname) {
  const adminPaths = new Set([
    '/dashboard.html',
    '/films.html',
    '/registi.html',
    '/cinemas.html',
    '/proiezioni.html',
    '/categorie.html',
    '/sale.html',
    '/ricarica-credito.html',
    '/validazione-biglietti.html',
    '/support-tickets.html',
    '/admin-utenti.html',
    '/membership-admin.html',
    '/newsletter-admin.html',
    '/campaigns-admin.html',
    '/merch-admin.html'
  ]);
  return adminPaths.has((pathname || '').toLowerCase());
}

function enforceAdminAreaAccess() {
  const auth = getAuthSafe();
  if (!auth) return true;
  if (!isAdminAreaPath(window.location.pathname)) return true;

  if (!auth.isLoggedIn()) {
    const redirectUrl = window.location.pathname + window.location.search;
    auth.redirectToLogin(redirectUrl);
    return false;
  }

  var role = String(auth.getUserRole ? auth.getUserRole() : '').trim().toLowerCase();
  if (role === '2' || role === 'admin') role = 'admin';
  else if (role === '1' || role === 'poweruser') role = 'poweruser';
  else if (role === '0' || role === 'user') role = 'user';
  if (role === 'admin' || role === 'poweruser') {
    return true;
  }

  window.location.href = '/index.html?forbidden=true';
  return false;
}

async function parseSuccessfulResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

// Helper function per fetch con error handling e retry su 401
async function apiFetch(endpoint, options = {}) {
  if (!enforceAdminAreaAccess()) {
    throw { status: 403, message: 'Non autorizzato ad accedere a questa pagina' };
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const auth = getAuthSafe();
  const accessToken = auth?.getAccessToken?.();
  if (accessToken) {
    defaultOptions.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
  } catch {
    throw {
      status: 0,
      message: 'Impossibile connettersi al server. Verifica che il servizio sia attivo.'
    };
  }

  if (response.status === 401 && !options._noRetry && auth) {

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          try {
            const retryOptions = {
              ...requestOptions,
              _noRetry: true,
              headers: {
                ...requestOptions.headers,
                Authorization: `Bearer ${newToken}`
              }
            };
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, retryOptions);
            if (retryResponse.ok) {
              resolve(parseSuccessfulResponse(retryResponse));
            } else {
              throw { status: retryResponse.status, message: 'Richiesta fallita dopo refresh' };
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    isRefreshing = true;

    try {
      await auth.refreshAccessToken();
      const newToken = auth.getAccessToken();
      onTokenRefreshed(newToken);
      isRefreshing = false;

      const retryOptions = {
        ...requestOptions,
        _noRetry: true,
        headers: {
          ...requestOptions.headers,
          Authorization: `Bearer ${newToken}`
        }
      };
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, retryOptions);

      if (retryResponse.ok) {
        return parseSuccessfulResponse(retryResponse);
      }

      throw { status: retryResponse.status, message: 'Richiesta fallita dopo refresh' };
    } catch (refreshError) {
      isRefreshing = false;
      auth.clearAuth();
      const redirectUrl = window.location.pathname + window.location.search;
      auth.redirectToLogin(redirectUrl);
      throw { status: 401, message: 'Sessione scaduta' };
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let message = 'Errore di rete';
    let errors;

    if (contentType.includes('application/json')) {
      const errorJson = await response.json().catch(() => null);
      if (errorJson) {
        if (typeof errorJson === 'string') {
          message = errorJson;
        } else {
          message = errorJson.message || errorJson.title || message;
          errors = errorJson.errors;
        }
      }
    } else {
      const errorText = await response.text().catch(() => '');
      if (errorText) {
        message = errorText;
      }
    }

    throw { status: response.status, message, errors };
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const bodyText = await response.text().catch(() => '');
    throw {
      status: 502,
      message: `Risposta non valida dal backend (${contentType || 'content-type assente'})`,
      details: bodyText.slice(0, 200)
    };
  }

  return response.json();
}

// API Object
const API = {
  // Registi
  getRegisti: (params = {}) => {
    const query = new URLSearchParams();

    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', String(params.search));

    const queryString = query.toString();
    return apiFetch(`/registi${queryString ? `?${queryString}` : ''}`);
  },
  getRegista: (id) => apiFetch(`/registi/${id}`),
  createRegista: (data) => apiFetch('/registi', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  updateRegista: (id, data) => apiFetch(`/registi/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  deleteRegista: (id) => apiFetch(`/registi/${id}`, { method: 'DELETE' }),
  getFilmsByRegista: (id) => apiFetch(`/registi/${id}/films`),
  
  // Film
  getFilms: (params = {}) => {
    const query = new URLSearchParams();

    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', String(params.search));

    const queryString = query.toString();
    return apiFetch(`/films${queryString ? `?${queryString}` : ''}`);
  },
  getFilm: (id) => apiFetch(`/films/${id}`),
  createFilm: (data) => apiFetch('/films', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  updateFilm: (id, data) => apiFetch(`/films/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
deleteFilm: (id) => apiFetch(`/films/${id}`, { method: 'DELETE' }),

    uploadCover: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/media/covers`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw {
                status: response.status,
                message: errorText || 'Errore durante upload copertina'
            };
        }

        return response.json();
    },

    // Cinema
  getCinemas: (params = {}) => {
    const query = new URLSearchParams();

    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', String(params.search));

    const queryString = query.toString();
    return apiFetch(`/cinemas${queryString ? `?${queryString}` : ''}`);
  },
  getCinema: (id) => apiFetch(`/cinemas/${id}`),
  createCinema: (data) => apiFetch('/cinemas', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  updateCinema: (id, data) => apiFetch(`/cinemas/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  deleteCinema: (id) => apiFetch(`/cinemas/${id}`, { method: 'DELETE' }),
  
  // Proiezioni (deprecated — use Shows endpoints)
  getProiezioni: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', String(params.search));
    const queryString = query.toString();
    return apiFetch(`/proiezioni${queryString ? `?${queryString}` : ''}`);
  },
  getProiezione: (id) => apiFetch(`/proiezioni/${id}`),

  // Profilo
  getProfilo: () => apiFetch('/profilo'),
  updateProfilo: (data) => apiFetch('/profilo', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Categorie
  getCategorie: () => apiFetch('/categorie'),
  getCategoria: (id) => apiFetch(`/categorie/${id}`),
  createCategoria: (data) => apiFetch('/categorie', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCategoria: (id, data) => apiFetch(`/categorie/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCategoria: (id) => apiFetch(`/categorie/${id}`, { method: 'DELETE' }),

  // Admin Utenti
  getUtenti: () => apiFetch('/admin/utenti'),
  updateRuolo: (id, data) => apiFetch(`/admin/utenti/${id}/ruolo`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Programmazione v2 (film-centric)
  getProgrammazioneFilms: (params = {}) => {
    const query = new URLSearchParams();
    if (params.tab) query.set('tab', params.tab);
    if (params.search) query.set('search', params.search);
    if (params.categoriaId) query.set('categoriaId', String(params.categoriaId));
    if (params.cinemaId) query.set('cinemaId', String(params.cinemaId));
    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    const queryString = query.toString();
    return apiFetch(`/programmazione/films${queryString ? `?${queryString}` : ''}`);
  },
  getProgrammazioneCinemas: (params = {}) => {
    const query = new URLSearchParams();
    if (params.lat != null) query.set('lat', String(params.lat));
    if (params.lng != null) query.set('lng', String(params.lng));
    const queryString = query.toString();
    return apiFetch(`/programmazione/cinemas${queryString ? `?${queryString}` : ''}`);
  },
  getCinemaPreferito: () => apiFetch('/profilo/cinema-preferito'),
  setCinemaPreferito: (cinemaId) => {
    if (cinemaId == null) {
      return apiFetch('/profilo/cinema-preferito', { method: 'PUT' });
    }
    return apiFetch(`/profilo/cinema-preferito/${cinemaId}`, { method: 'PUT' });
  },

  // Scheda film
  getFilmScheda: (filmId, cinemaId) => {
    const query = cinemaId ? `?cinemaId=${cinemaId}` : '';
    return apiFetch(`/films/${filmId}/scheda${query}`);
  },

  // My cinemas - lista cinema
  getMyCinemas: () => apiFetch('/my-cinemas'),

  // My cinemas - programmazione giornaliera cinema
  getCinemaSchedule: (cinemaId, date) => {
    const query = date ? `?date=${date}` : '';
    return apiFetch(`/my-cinemas/${cinemaId}/schedule${query}`);
  },

  // Checkout - Seat map
  getSeatMap: (showId) => apiFetch(`/checkout/shows/${showId}/seat-map`),

  // Checkout - Hold posti
  createHold: (showId, salaPostoIds, ticketTypes) => apiFetch('/checkout/holds', {
    method: 'POST',
    body: JSON.stringify({ showId, salaPostoIds, ticketTypes: ticketTypes || undefined })
  }),

  // Checkout - Refresh hold (keep-alive)
  refreshHold: (holdToken) => apiFetch(`/checkout/holds/${encodeURIComponent(holdToken)}/refresh`, {
    method: 'POST'
  }),

  // Checkout - Release hold
  releaseHold: (holdToken) => apiFetch(`/checkout/holds/${encodeURIComponent(holdToken)}`, {
    method: 'DELETE'
  }),

  // Checkout - Crea ordine pendente
  createOrdine: (holdToken, idempotencyKey, discountCode) => {
    const headers = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return apiFetch('/checkout/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ holdToken, idempotencyKey: idempotencyKey || undefined, discountCode: discountCode || undefined })
    });
  },

  // Checkout - Lista ordini utente
  getOrdini: () => apiFetch('/checkout/orders'),

  // Checkout - Dettaglio ordine
  getOrdine: (orderId) => apiFetch(`/checkout/orders/${orderId}`),

  // Checkout - Paga ordine
  payOrdine: (orderId, metodoPagamento, importoCreditoRichiesto, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return apiFetch(`/checkout/orders/${orderId}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        metodoPagamento,
        importoCreditoRichiesto: importoCreditoRichiesto || null,
        idempotencyKey: idempotencyKey || undefined
      })
    });
  },

  // Checkout - Annulla ordine pendente
  cancelOrdine: (orderId) => apiFetch(`/checkout/orders/${orderId}/cancel`, {
    method: 'POST'
  }),

  // Checkout - Crea sessione Stripe Checkout hosted
  createStripeCheckoutSession: (orderId, payload, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return apiFetch(`/checkout/orders/${orderId}/stripe-checkout-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || {})
    });
  },

  // Checkout - Stato checkout hosted
  getCheckoutStatus: (orderId) => apiFetch(`/checkout/orders/${orderId}/checkout-status`),

  // Checkout - Riconcilia sessione Stripe
  reconcileCheckoutSession: (orderId) => apiFetch(`/checkout/orders/${orderId}/reconcile-checkout-session`, {
    method: 'POST'
  }),

  // Frontend runtime config
  getFrontendConfig: () => apiFetch('/config/frontend'),

  // Checkout - Download PDF ordine
  getOrdinePdf: async (orderId) => {
    const auth = getAuthSafe();
    const accessToken = auth?.getAccessToken?.();
    const response = await fetch(`${API_BASE_URL}/checkout/orders/${orderId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!response.ok) throw { status: response.status, message: 'Errore download PDF' };
    return response.blob();
  },

  // Checkout - Lista biglietti utente
  getBiglietti: () => apiFetch('/checkout/tickets'),

  // Checkout - Dettaglio biglietto
  getBiglietto: (ticketId) => apiFetch(`/checkout/tickets/${ticketId}`),

  // Credito - Saldo e movimenti
  getCreditoMe: () => apiFetch('/credito/me'),

  // Sale (admin)
  getSale: (cinemaId) => apiFetch(`/cinemas/${cinemaId}/sale`),
  getSala: (salaId) => apiFetch(`/sale/${salaId}`),
  createSala: (cinemaId, data) => apiFetch(`/cinemas/${cinemaId}/sale`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSala: (salaId, data) => apiFetch(`/sale/${salaId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteSala: (salaId) => apiFetch(`/sale/${salaId}`, { method: 'DELETE' }),
  getSalaPosti: (salaId) => apiFetch(`/sale/${salaId}/posti`),
  saveSalaPosti: (salaId, data) => apiFetch(`/sale/${salaId}/posti`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Shows (admin)
  getShows: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params.cinemaId) query.set('cinemaId', String(params.cinemaId));
    if (params.filmId) query.set('filmId', String(params.filmId));
    if (params.date) query.set('date', params.date);
    const queryString = query.toString();
    return apiFetch(`/shows${queryString ? `?${queryString}` : ''}`);
  },
  getShow: (id) => apiFetch(`/shows/${id}`),
  getShowPricing: (showId) => apiFetch(`/shows/${showId}/pricing`),
  createShow: (data) => apiFetch('/shows', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateShow: (id, data) => apiFetch(`/shows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteShow: (id) => apiFetch(`/shows/${id}`, { method: 'DELETE' }),

  // Credito Admin
  getUserByEmail: (email) => apiFetch(`/admin/credito/users?email=${encodeURIComponent(email)}`),
  getRicariche: (email) => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return apiFetch(`/admin/credito/ricariche${query}`);
  },
  ricaricaCredito: (data) => apiFetch('/admin/credito/ricariche', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Validazione Biglietti
  lookupTicket: (code) => apiFetch(`/admin/tickets/validate/${encodeURIComponent(code)}`),
  validateTicket: (data) => apiFetch('/admin/tickets/validate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Supporto chatbot/ticket (utente)
  getSupportConversation: () => apiFetch('/support/conversation'),
  sendSupportMessage: (data) => apiFetch('/support/chat', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createSupportTicket: (data) => apiFetch('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Supporto ticket (admin)
  getSupportTickets: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.search) query.set('search', params.search);
    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    const queryString = query.toString();
    return apiFetch(`/admin/support/tickets${queryString ? `?${queryString}` : ''}`);
  },
  getSupportTicket: (ticketId) => apiFetch(`/admin/support/tickets/${ticketId}`),
  updateSupportTicket: (ticketId, data) => apiFetch(`/admin/support/tickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getSupportAdmins: () => apiFetch('/admin/support/admins'),

  getPromotionsActive: () => apiFetch('/promotions/active'),
  getPromotions: function (params) {
    var q = new URLSearchParams();
    if (params && params.active != null) q.set('active', params.active);
    return apiFetch('/admin/promotions' + (q.toString() ? '?' + q.toString() : ''));
  },
  getPromotion: function (id) { return apiFetch('/admin/promotions/' + id); },
  createPromotion: function (data) { return apiFetch('/admin/promotions', { method: 'POST', body: JSON.stringify(data) }); },
  updatePromotion: function (id, data) { return apiFetch('/admin/promotions/' + id, { method: 'PUT', body: JSON.stringify(data) }); },
  deletePromotion: function (id) { return apiFetch('/admin/promotions/' + id, { method: 'DELETE' }); },
  claimPromotion: function (id) { return apiFetch('/promotions/' + id + '/claim', { method: 'POST' }); },

  changePassword: function (data) { return apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }); },
  changeEmail: function (data) { return apiFetch('/auth/change-email', { method: 'POST', body: JSON.stringify(data) }); },
  forgotPassword: function (data) { return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }); },
  resetPassword: function (data) { return apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }); },

  getUsersAdmin: function (params) {
    var q = new URLSearchParams();
    if (params && params.search) q.set('search', params.search);
    if (params && params.role) q.set('role', params.role);
    if (params && params.page) q.set('page', String(params.page));
    if (params && params.pageSize) q.set('pageSize', String(params.pageSize));
    return apiFetch('/admin/utenti' + (q.toString() ? '?' + q.toString() : ''));
  },
  createUserAdmin: function (data) { return apiFetch('/admin/utenti', { method: 'POST', body: JSON.stringify(data) }); },
  updateUserRole: function (id, data) { return apiFetch('/admin/utenti/' + id + '/ruolo', { method: 'PUT', body: JSON.stringify(data) }); },
  updateUserCinema: function (id, data) { return apiFetch('/admin/utenti/' + id + '/cinema', { method: 'PUT', body: JSON.stringify(data) }); },

  // ── Gift Card ──
  getMieGiftCard: function () { return apiFetch('/giftcard/mie'); },
  getGiftCardByCodice: function (codice) { return apiFetch('/giftcard/' + encodeURIComponent(codice)); },
  acquistaGiftCard: function (data) { return apiFetch('/giftcard/acquista', { method: 'POST', body: JSON.stringify(data) }); },
  acquistaCarrelloGiftCard: function (data) { return apiFetch('/giftcard/acquista-carrello', { method: 'POST', body: JSON.stringify(data) }); },
  riscattaGiftCard: function (data) { return apiFetch('/giftcard/riscatta', { method: 'POST', body: JSON.stringify(data) }); },
  confermaStripeGiftCard: function (data) { return apiFetch('/giftcard/conferma-stripe', { method: 'POST', body: JSON.stringify(data) }); },
  confermaCarrelloGiftCard: function (data) { return apiFetch('/giftcard/conferma-carrello', { method: 'POST', body: JSON.stringify(data) }); },
  getAllGiftCard: function () { return apiFetch('/admin/giftcard/'); },
  disattivaGiftCard: function (id) { return apiFetch('/admin/giftcard/' + id + '/disattiva', { method: 'POST' }); },

  // ── Membership ──
  getMembershipCard: function () { return apiFetch('/membership/card'); },
  getPuntiStorico: function () { return apiFetch('/membership/punti'); },
  getPremiMembership: function () { return apiFetch('/membership/premi'); },
  riscattaPremio: function (premioId) { return apiFetch('/membership/premi/' + premioId + '/riscatta', { method: 'POST' }); },
  getMieiRiscatti: function () { return apiFetch('/membership/riscatti'); },
  attivaMembership: function () { return apiFetch('/membership/attiva', { method: 'POST' }); },
  stripeMembershipCheckout: function () { return apiFetch('/membership/stripe-checkout', { method: 'POST' }); },
  confermaStripeMembership: function (data) { return apiFetch('/membership/conferma-stripe', { method: 'POST', body: JSON.stringify(data) }); },
  updateMembershipProfile: function (data) { return apiFetch('/membership/profile', { method: 'PUT', body: JSON.stringify(data) }); },
  processaCompleanni: function () { return apiFetch('/admin/membership/processa-compleanni', { method: 'POST' }); },
  processaFestivita: function (data) { return apiFetch('/admin/membership/processa-festivita', { method: 'POST', body: JSON.stringify(data) }); },
  getCampaigns: function () { return apiFetch('/admin/membership/campaigns'); },
  updateCampaign: function (id, data) { return apiFetch('/admin/membership/campaigns/' + id, { method: 'PUT', body: JSON.stringify(data) }); },
  getCompleanniOggi: function () { return apiFetch('/admin/membership/compleanni-oggi'); },
  addCampaign: function (data) { return apiFetch('/admin/membership/campaigns', { method: 'POST', body: JSON.stringify(data) }); },
  processaFestivitaAuto: function () { return apiFetch('/admin/membership/processa-festivita-auto', { method: 'POST' }); },
  deleteCampaign: function (id) { return apiFetch('/admin/membership/campaigns/' + id, { method: 'DELETE' }); },

  // ── Party Booking ──
  createPartyBooking: function (data) { return apiFetch('/party/prenota', { method: 'POST', body: JSON.stringify(data) }); },
  getMyPartyBookings: function () { return apiFetch('/party/mie'); },
  confirmPartyBooking: function (id) { return apiFetch('/party/conferma/' + id, { method: 'POST' }); },
  getAllPartyBookings: function () { return apiFetch('/admin/party/'); },
  updatePartyStatus: function (id, status) { return apiFetch('/admin/party/' + id + '/status', { method: 'POST', body: JSON.stringify({ status: status }) }); },
  scanPartyQr: function (data) { return apiFetch('/admin/party/scan', { method: 'POST', body: JSON.stringify(data) }); },
  autoCompleteParties: function () { return apiFetch('/admin/party/auto-complete', { method: 'POST' }); },

  // ── Show Cancellation ──
  previewCancelShow: function (showId) { return apiFetch('/admin/shows/' + showId + '/cancel/preview'); },
  cancelShow: function (showId, data) { return apiFetch('/admin/shows/' + showId + '/cancel', { method: 'POST', body: JSON.stringify(data) }); },
  getShowCancellations: function () { return apiFetch('/admin/cancellations/list'); },
  getAllRefunds: function () { return apiFetch('/admin/cancellations/refunds'); },
  getManualReviews: function () { return apiFetch('/admin/cancellations/manual-reviews'); },
  resolveManualReview: function (id, resolution) { return apiFetch('/admin/cancellations/manual-reviews/' + id + '/resolve', { method: 'POST', body: JSON.stringify({ resolution: resolution }) }); },
  processRefunds: function (id) { return apiFetch('/admin/cancellations/' + id + '/process-refunds', { method: 'POST' }); },
  retryRefunds: function (id) { return apiFetch('/admin/cancellations/' + id + '/retry-refunds', { method: 'POST' }); },
  sendCancelEmails: function (id) { return apiFetch('/admin/cancellations/' + id + '/send-emails', { method: 'POST' }); },
  manualRefund: function (data) { return apiFetch('/admin/cancellations/manual-refund', { method: 'POST', body: JSON.stringify(data) }); },
  submitPartyFeedback: function (data) { return apiFetch('/party/feedback', { method: 'POST', body: JSON.stringify(data) }); },
  getAllMembershipCards: function () { return apiFetch('/admin/membership/cards'); },
  toggleMembership: function (userId) { return apiFetch('/admin/membership/' + userId + '/toggle', { method: 'POST' }); },

  // ── Newsletter ──
  getNewsletterSubscribers: function () { return apiFetch('/admin/newsletter/subscribers'); },
  adminAddSubscriber: function (data) { return apiFetch('/admin/newsletter/subscribe', { method: 'POST', body: JSON.stringify(data) }); },
  removeNewsletterSubscriber: function (id) { return apiFetch('/admin/newsletter/subscribers/' + id, { method: 'DELETE' }); },
  inviaNewsletter: function (data) { return apiFetch('/admin/newsletter/send', { method: 'POST', body: JSON.stringify(data) }); },

  // ── Food & Beverage ──
  getFoodMenu: function () { return apiFetch('/food/menu'); },
  addFoodToOrder: function (ordineId, data) { return apiFetch('/food/order/' + ordineId, { method: 'POST', body: JSON.stringify(data) }); },
  getOrderFood: function (ordineId) { return apiFetch('/food/order/' + ordineId); },
  getAllFoodItems: function () { return apiFetch('/admin/food'); },
  createFoodItem: function (data) { return apiFetch('/admin/food', { method: 'POST', body: JSON.stringify(data) }); },
  updateFoodItem: function (id, data) { return apiFetch('/admin/food/' + id, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteFoodItem: function (id) { return apiFetch('/admin/food/' + id, { method: 'DELETE' }); },

  // ── Referral ──
  generateReferral: function () { return apiFetch('/referral/generate', { method: 'POST' }); },

  // ── Analytics ──
  getAnalyticsRevenue: function (params) {
    var q = new URLSearchParams();
    if (params && params.dal) q.set('dal', params.dal);
    if (params && params.al) q.set('al', params.al);
    if (params && params.cinemaId) q.set('cinemaId', String(params.cinemaId));
    return apiFetch('/admin/analytics/revenue' + (q.toString() ? '?' + q.toString() : ''));
  },
  getAnalyticsTopFilms: function (params) {
    var q = new URLSearchParams();
    if (params && params.dal) q.set('dal', params.dal);
    if (params && params.al) q.set('al', params.al);
    if (params && params.limit) q.set('limit', String(params.limit));
    return apiFetch('/admin/analytics/top-films' + (q.toString() ? '?' + q.toString() : ''));
  },
  getAnalyticsTimeSlots: function (params) {
    var q = new URLSearchParams();
    if (params && params.dal) q.set('dal', params.dal);
    if (params && params.al) q.set('al', params.al);
    return apiFetch('/admin/analytics/time-slots' + (q.toString() ? '?' + q.toString() : ''));
  },
  getAnalyticsCinemaComparison: function (params) {
    var q = new URLSearchParams();
    if (params && params.dal) q.set('dal', params.dal);
    if (params && params.al) q.set('al', params.al);
    return apiFetch('/admin/analytics/cinema-comparison' + (q.toString() ? '?' + q.toString() : ''));
  },
  getAnalyticsDashboard: function () { return apiFetch('/admin/analytics/dashboard'); },

  // ── Merch Shop ──
  getMerchItems: function () { return apiFetch('/merch/items'); },
  createMerchOrder: function (data) { return apiFetch('/merch/orders', { method: 'POST', body: JSON.stringify(data) }); },
  getMyMerchOrders: function () { return apiFetch('/merch/orders/mie'); },
  getAllMerchOrders: function () { return apiFetch('/admin/merch/orders'); },
  updateMerchOrderStatus: function (id, status) { return apiFetch('/admin/merch/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ stato: status }) }); },
  getAllMerchItems: function () { return apiFetch('/admin/merch/items'); },
  createMerchItem: function (data) { return apiFetch('/admin/merch/items', { method: 'POST', body: JSON.stringify(data) }); },
  updateMerchItem: function (id, data) { return apiFetch('/admin/merch/items/' + id, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteMerchItem: function (id) { return apiFetch('/admin/merch/items/' + id, { method: 'DELETE' }); },
  getMerchItemById: function (id) { return apiFetch('/merch/items/' + id); },
  getMerchOrder: function (id) { return apiFetch('/merch/orders/' + id); },
  payMerchOrder: function (id, metodo, importoCredito) { return apiFetch('/merch/orders/' + id + '/pay', { method: 'POST', body: JSON.stringify({ metodoPagamento: metodo, importoCreditoRichiesto: importoCredito || 0 }) }); },
  createMerchStripeCheckoutSession: function (id, payload) { return apiFetch('/merch/orders/' + id + '/stripe-checkout-session', { method: 'POST', body: JSON.stringify(payload) }); },
  cancelMerchOrder: function (id) { return apiFetch('/merch/orders/' + id + '/cancel', { method: 'POST' }); },
  getMerchCheckoutStatus: function (id) { return apiFetch('/merch/orders/' + id + '/checkout-status'); },
  reconcileMerchCheckoutSession: function (id) { return apiFetch('/merch/orders/' + id + '/reconcile-checkout-session', { method: 'POST' }); },

  validateDiscount: function (codice) { return apiFetch('/merch/discounts/validate?codice=' + encodeURIComponent(codice)); },
  getShipmentTracking: function (orderId) { return apiFetch('/merch/orders/' + orderId + '/tracking'); },

  uploadMerchImage: async function (file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    const auth = getAuthSafe();
    const accessToken = auth?.getAccessToken?.();
    if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
    const response = await fetch(`${API_BASE_URL}/media/merch`, { method: 'POST', body: formData, headers: headers });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw { status: response.status, message: errorText || 'Errore durante upload immagine merch' };
    }
    return response.json();
  },

  addMerchItemImage: async function (itemId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    const auth = getAuthSafe();
    const accessToken = auth?.getAccessToken?.();
    if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
    const response = await fetch(`${API_BASE_URL}/admin/merch/items/${itemId}/images`, { method: 'POST', body: formData, headers: headers });
    if (!response.ok) throw { status: response.status, message: 'Errore upload immagine' };
    return response.json();
  },

  deleteMerchItemImage: function (itemId, imageId) { return apiFetch('/admin/merch/items/' + itemId + '/images/' + imageId, { method: 'DELETE' }); },

  addMerchItemVariant: function (itemId, data) { return apiFetch('/admin/merch/items/' + itemId + '/variants', { method: 'POST', body: JSON.stringify(data) }); },
  updateMerchItemVariant: function (itemId, variantId, data) { return apiFetch('/admin/merch/items/' + itemId + '/variants/' + variantId, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteMerchItemVariant: function (itemId, variantId) { return apiFetch('/admin/merch/items/' + itemId + '/variants/' + variantId, { method: 'DELETE' }); }
};
