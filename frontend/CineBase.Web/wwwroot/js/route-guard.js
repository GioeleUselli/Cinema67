var RouteGuard = (function () {
  var PAGE_PERMISSIONS = {
    '/index.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/programmazione.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/scheda-film.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/my-cinemas.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/scegli-cinema.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/login.html': { roles: ['anonimo'], authRequired: false, anonymousOnly: true },
    '/registrazione.html': { roles: ['anonimo'], authRequired: false, anonymousOnly: true },
    '/forgot-password.html': { roles: ['anonimo'], authRequired: false },
    '/reset-password.html': { roles: ['anonimo'], authRequired: false },
    '/shop.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/articolo.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/pagamento-merch.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/esito-acquisto-merch.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/tracking-merch.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/dashboard.html': { roles: ['poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/films.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/registi.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/cinemas.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/proiezioni.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/categorie.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/sale.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/ricarica-credito.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/validazione-biglietti.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/support-tickets.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/promozioni.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/admin-utenti.html': { roles: ['admin'], authRequired: true },
    '/membership-admin.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/newsletter-admin.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/corriere.html': { roles: ['corriere', 'poweruser', 'admin'], authRequired: true },
    '/magazzino.html': { roles: ['magazziniere', 'poweruser', 'admin'], authRequired: true },
    '/label-pacco.html': { roles: ['corriere', 'magazziniere', 'poweruser', 'admin'], authRequired: true },
    '/admin-pacchi.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/profilo.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/acquista.html': { roles: ['user', 'poweruser', 'admin'], authRequired: true },
    '/pagamento.html': { roles: ['user', 'poweruser', 'admin'], authRequired: true },
    '/esito-acquisto.html': { roles: ['user', 'poweruser', 'admin'], authRequired: true },
    '/feste.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/feste-admin.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/membership.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/giftcard.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/riscatta-giftcard.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: true },
    '/rimborsi-admin.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/food-admin.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/merch-admin.html': { roles: ['poweruser', 'admin', 'cinemastaff'], authRequired: true },
    '/privacy.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/cookie.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false },
    '/termini-condizioni.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere', 'cinemastaff'], authRequired: false }
  };

  var ACCESS_TOKEN_KEY = 'cb_access_token';
  var REFRESH_TOKEN_KEY = 'cb_refresh_token';

  function normalizeRole(role) {
    if (role == null) return 'anonimo';
    var value = String(role).trim().toLowerCase();
    if (value === '2' || value === 'admin') return 'admin';
    if (value === '1' || value === 'poweruser') return 'poweruser';
    if (value === '4' || value === 'corriere') return 'corriere';
    if (value === '5' || value === 'magazziniere') return 'magazziniere';
    if (value === '3' || value === 'cinemastaff') return 'cinemastaff';
    if (value === '0' || value === 'user') return 'user';
    return 'anonimo';
  }

  function parseJwt(token) {
    try {
      var parts = token.split('.');
      if (parts.length < 2) return null;
      var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  function getAccessToken() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  function getRefreshToken() {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  function getAuthSafe() {
    if (typeof window === 'undefined') return null;
    return window.Auth || null;
  }

  var refreshAttempted = false;
  
  async function tryProactiveRefresh() {
    // Prevent infinite refresh loops
    if (refreshAttempted) return false;
    
    var auth = getAuthSafe();
    if (!auth || typeof auth.refreshAccessToken !== 'function') return false;
    if (!getRefreshToken()) return false;

    refreshAttempted = true;
    try {
      await auth.refreshAccessToken();
      return true;
    } catch (e) {
      // Mark this as a failed refresh attempt to prevent retries
      localStorage.setItem('_refresh_failed', 'true');
      return false;
    }
  }

  function isTokenValid() {
    var token = getAccessToken();
    if (!token) return false;
    var payload = parseJwt(token);
    if (!payload) return false;
    return payload.exp > Math.ceil(Date.now() / 1000);
  }

  function getRoleFromToken() {
    var token = getAccessToken();
    if (!token) return null;
    var payload = parseJwt(token);
    if (!payload) return null;
    return payload.role || null;
  }

  async function check() {
    var pathname = window.location.pathname;
    var pageKey = pathname.toLowerCase();
    var permission = PAGE_PERMISSIONS[pageKey];
    if (!permission) return true;

    // Detect and prevent redirect loops
    var lastRedirect = sessionStorage.getItem('_last_redirect');
    var lastRedirectCount = parseInt(sessionStorage.getItem('_redirect_count') || '0', 10);
    
    if (lastRedirect === pathname && lastRedirectCount > 2) {
      // We're in a redirect loop - clear auth and go to login
      localStorage.removeItem('_refresh_failed');
      localStorage.removeItem('_check_attempted');
      window.location.replace('/login.html?error=' + encodeURIComponent('Errore di sessione, rieffettua l\'accesso'));
      return false;
    }

    var isLoggedIn = isTokenValid();
    if (!isLoggedIn && !localStorage.getItem('_refresh_failed')) {
      var refreshed = await tryProactiveRefresh();
      if (refreshed) {
        isLoggedIn = isTokenValid();
      }
    }

    var role = normalizeRole(isLoggedIn ? getRoleFromToken() : null);

    if (permission.anonymousOnly && isLoggedIn) {
      var params = new URLSearchParams(window.location.search);
      var redirect = params.get('redirect');
      if (redirect && redirect.indexOf('/') === 0 && redirect.indexOf('//') !== 0) {
        sessionStorage.setItem('_last_redirect', pathname);
        sessionStorage.setItem('_redirect_count', String(lastRedirectCount + 1));
        window.location.replace(redirect);
      } else {
        sessionStorage.setItem('_last_redirect', pathname);
        sessionStorage.setItem('_redirect_count', String(lastRedirectCount + 1));
        window.location.replace('/index.html');
      }
      return false;
    }

    if (permission.authRequired && !isLoggedIn) {
      var redirectUrl = pathname + window.location.search;
      sessionStorage.setItem('_last_redirect', pathname);
      sessionStorage.setItem('_redirect_count', String(lastRedirectCount + 1));
      window.location.replace('/login.html?redirect=' + encodeURIComponent(redirectUrl));
      return false;
    }

    if (!permission.roles.includes(role)) {
      sessionStorage.setItem('_last_redirect', pathname);
      sessionStorage.setItem('_redirect_count', String(lastRedirectCount + 1));
      window.location.replace('/index.html?forbidden=true');
      return false;
    }

    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      check();
    });
  } else {
    check();
  }

  return { check: check, normalizeRole: normalizeRole, PAGE_PERMISSIONS: PAGE_PERMISSIONS };
})();

if (typeof window !== 'undefined') {
  window.RouteGuard = RouteGuard;
}
