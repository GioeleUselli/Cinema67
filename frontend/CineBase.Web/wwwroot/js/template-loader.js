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
  var landingPaths = ['/', '/index.html', '/programmazione.html', '/scheda-film.html', '/my-cinemas.html', '/login.html', '/registrazione.html', '/profilo.html', '/membership.html', '/acquista.html', '/pagamento.html', '/esito-acquisto.html', '/forgot-password.html', '/reset-password.html', '/giftcard.html', '/riscatta-giftcard.html'];
  var adminShellPaths = ['/films.html', '/registi.html', '/cinemas.html', '/proiezioni.html', '/categorie.html', '/sale.html', '/ricarica-credito.html', '/validazione-biglietti.html', '/support-tickets.html', '/promozioni.html', '/admin-utenti.html', '/membership-admin.html', '/newsletter-admin.html', '/campaigns-admin.html'];

  if (adminShellPaths.indexOf(pathname) !== -1) {
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
    newsletterScript.src = '/js/newsletter-popup.js';
    newsletterScript.setAttribute('data-newsletter', 'true');
    document.body.appendChild(newsletterScript);
  }
}

document.addEventListener('DOMContentLoaded', loadLayoutComponents);
