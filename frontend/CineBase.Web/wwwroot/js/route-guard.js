var RouteGuard = (function () {
  var PAGE_PERMISSIONS = {
    '/index.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/programmazione.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/scheda-film.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/my-cinemas.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/scegli-cinema.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/login.html': { roles: ['anonimo'], authRequired: false, anonymousOnly: true },
    '/registrazione.html': { roles: ['anonimo'], authRequired: false, anonymousOnly: true },
    '/forgot-password.html': { roles: ['anonimo'], authRequired: false },
    '/reset-password.html': { roles: ['anonimo'], authRequired: false },
    '/shop.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/articolo.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/pagamento-merch.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/esito-acquisto-merch.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/tracking-merch.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/dashboard.html': { roles: ['poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/films.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/registi.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/cinemas.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/proiezioni.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/categorie.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/sale.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/ricarica-credito.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/validazione-biglietti.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/support-tickets.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/promozioni.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/admin-utenti.html': { roles: ['admin'], authRequired: true },
    '/membership-admin.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/newsletter-admin.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/corriere.html': { roles: ['corriere', 'poweruser', 'admin'], authRequired: true },
    '/magazzino.html': { roles: ['magazziniere', 'poweruser', 'admin'], authRequired: true },
    '/label-pacco.html': { roles: ['corriere', 'magazziniere', 'poweruser', 'admin'], authRequired: true },
    '/admin-pacchi.html': { roles: ['poweruser', 'admin'], authRequired: true },
    '/profilo.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/acquista.html': { roles: ['user', 'poweruser', 'admin'], authRequired: true },
    '/pagamento.html': { roles: ['user', 'poweruser', 'admin'], authRequired: true },
    '/esito-acquisto.html': { roles: ['user', 'poweruser', 'admin'], authRequired: true },
    '/feste.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/membership.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/giftcard.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/riscatta-giftcard.html': { roles: ['user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: true },
    '/privacy.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/cookie.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false },
    '/termini-condizioni.html': { roles: ['anonimo', 'user', 'poweruser', 'admin', 'corriere', 'magazziniere'], authRequired: false }
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

  async function tryProactiveRefresh() {
    var auth = getAuthSafe();
    if (!auth || typeof auth.refreshAccessToken !== 'function') return false;
    if (!getRefreshToken()) return false;

    try {
      await auth.refreshAccessToken();
      return true;
    } catch (e) {
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

    var isLoggedIn = isTokenValid();
    if (!isLoggedIn) {
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
        window.location.replace(redirect);
      } else {
        window.location.replace('/index.html');
      }
      return false;
    }

    if (permission.authRequired && !isLoggedIn) {
      var redirectUrl = pathname + window.location.search;
      window.location.replace('/login.html?redirect=' + encodeURIComponent(redirectUrl));
      return false;
    }

    if (!permission.roles.includes(role)) {
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
