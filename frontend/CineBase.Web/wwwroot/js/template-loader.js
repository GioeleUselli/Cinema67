var templateCache = {};

function executeInlineScripts(container) {
  var scripts = container.querySelectorAll('script');
  for (var i = 0; i < scripts.length; i++) {
    var scriptEl = document.createElement('script');
    scriptEl.textContent = scripts[i].textContent;
    container.appendChild(scriptEl);
    scripts[i].parentNode.removeChild(scripts[i]);
  }
}

async function loadComponent(elementId, componentPath) {
  var container = document.getElementById(elementId);
  if (!container) return;

  try {
    var html = templateCache[componentPath];

    if (!html) {
      var response = await fetch(componentPath + '?_=' + Date.now());
      if (!response.ok) throw new Error('Errore caricamento ' + componentPath);
      html = await response.text();
    }

    container.innerHTML = html;
    templateCache[componentPath] = html;
    executeInlineScripts(container);
  } catch (error) {
    console.error('Errore caricamento componente:', error);
  }
}

async function loadLayoutComponents() {
   var navbarContainer = document.getElementById('navbar-container');
   var footerContainer = document.getElementById('footer-container');

   if (!navbarContainer && !footerContainer) return;

   var pathname = (window.location.pathname || '').toLowerCase();
   var landingPaths = ['/', '/index.html', '/programmazione.html', '/scheda-film.html', '/my-cinemas.html', '/scegli-cinema.html', '/login.html', '/registrazione.html', '/profilo.html', '/membership.html', '/feste.html', '/acquista.html', '/pagamento.html', '/esito-acquisto.html', '/forgot-password.html', '/reset-password.html', '/giftcard.html', '/riscatta-giftcard.html', '/privacy.html', '/cookie.html', '/termini-condizioni.html', '/shop.html', '/articolo.html', '/pagamento-merch.html', '/esito-acquisto-merch.html', '/tracking-merch.html', '/label-pacco.html'];
   var staffShellPaths = ['/dashboard.html', '/ricarica-credito.html', '/validazione-biglietti.html', '/support-tickets.html', '/promozioni.html', '/feste-admin.html', '/rimborsi-admin.html', '/food-admin.html', '/merch-admin.html'];
   var adminShellPaths = ['/films.html', '/registi.html', '/cinemas.html', '/proiezioni.html', '/categorie.html', '/sale.html', '/ricarica-credito.html', '/validazione-biglietti.html', '/support-tickets.html', '/promozioni.html', '/admin-utenti.html', '/membership-admin.html', '/newsletter-admin.html', '/campaigns-admin.html', '/feste-admin.html', '/rimborsi-admin.html', '/analytics.html', '/food-admin.html', '/merch-admin.html', '/corriere.html', '/magazzino.html', '/admin-pacchi.html'];

   // Load appropriate shell based on path and user role
   if (staffShellPaths.indexOf(pathname) !== -1 || adminShellPaths.indexOf(pathname) !== -1) {
     // For staff/admin paths, check if user is CinemaStaff to load staff-shell
     var isCinemaStaff = false;
     if (typeof Auth !== 'undefined' && Auth && typeof Auth.getUser === 'function') {
       try {
         var user = Auth.getUser();
         if (user && user.ruolo) {
           var role = String(user.ruolo).trim().toLowerCase();
           isCinemaStaff = (role === 'cinemastaff' || role === '3');
         }
       } catch(e) {}
     }

     if (isCinemaStaff) {
       // Load staff-shell for CinemaStaff
       if (!document.querySelector('script[data-staff-shell="true"]')) {
         var staffShellScript = document.createElement('script');
         staffShellScript.src = '/js/staff-shell.js?v=1';
         staffShellScript.setAttribute('data-staff-shell', 'true');
         document.body.appendChild(staffShellScript);
       }
     } else {
       // Load admin-shell for others
       if (!document.querySelector('script[data-admin-shell="true"]')) {
         var adminShellScript = document.createElement('script');
         adminShellScript.src = '/js/admin-shell.js?v=100';
         adminShellScript.setAttribute('data-admin-shell', 'true');
         document.body.appendChild(adminShellScript);
       }
     }
     document.dispatchEvent(new Event('components:loaded'));
     return;
   }

  var isLandingPage = landingPaths.indexOf(pathname) !== -1;
  var navbarPath = isLandingPage ? '/components/navbar-landing.html' : '/components/navbar-admin.html';
  var footerPath = isLandingPage ? '/components/footer-landing.html' : '/components/footer-admin.html';

  await Promise.all([
    loadComponent('navbar-container', navbarPath),
    loadComponent('footer-container', footerPath)
  ]);

  document.dispatchEvent(new Event('components:loaded'));

  if (!document.querySelector('script[data-support-chatbot="true"]')) {
    var chatbotScript = document.createElement('script');
    chatbotScript.src = '/js/support-chatbot.js';
    chatbotScript.setAttribute('data-support-chatbot', 'true');
    document.body.appendChild(chatbotScript);
  }

  // Newsletter popup — only for non-authenticated users
  if (!document.querySelector('script[data-newsletter="true"]')) {
    var newsletterScript = document.createElement('script');
    newsletterScript.src = '/js/newsletter-popup.js?v=6';
    newsletterScript.setAttribute('data-newsletter', 'true');
    document.body.appendChild(newsletterScript);
  }
}

document.addEventListener('DOMContentLoaded', loadLayoutComponents);
