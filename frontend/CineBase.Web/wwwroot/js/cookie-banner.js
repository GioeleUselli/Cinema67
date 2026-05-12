(function () {
  if (localStorage.getItem('cb_cookies_accepted') === 'true') return;

  var banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;';

  // Create a MutationObserver to detect theme changes
  function getThemeStyles() {
    var isDark = document.documentElement.classList.contains('dark');
    return {
      bg: isDark ? 'linear-gradient(135deg, #1c1713, #14100c)' : 'linear-gradient(135deg, #fbf4eb, #fdfaf6)',
      borderColor: isDark ? '#d4af37' : '#b8860b',
      textColor: isDark ? '#a89888' : '#6b5a4e',
      linkColor: isDark ? '#d4af37' : '#b8860b',
      btnBg: isDark ? '#d4af37' : '#b8860b',
      btnText: isDark ? '#0a0806' : '#ffffff',
      shadow: isDark ? '0 -4px 24px rgba(0,0,0,0.6)' : '0 -4px 24px rgba(0,0,0,0.15)'
    };
  }

  function renderBanner() {
    var s = getThemeStyles();
    banner.innerHTML =
      '<div style="position:relative;background:' + s.bg + ';border-top:2px solid ' + s.borderColor + ';padding:14px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;box-shadow:' + s.shadow + '">' +
        '<p style="color:' + s.textColor + ';font-size:13px;max-width:600px;margin:0">' +
          'Questo sito utilizza cookie tecnici e localStorage. Proseguendo accetti la nostra ' +
          '<a href="/cookie.html" style="color:' + s.linkColor + ';text-decoration:underline">Cookie Policy</a> e la ' +
          '<a href="/privacy.html" style="color:' + s.linkColor + ';text-decoration:underline">Privacy Policy</a>.' +
        '</p>' +
        '<div style="display:flex;gap:8px">' +
          '<a href="/cookie.html" style="display:inline-flex;align-items:center;justify-content:center;background:transparent;border:2px solid ' + s.textColor + ';color:' + s.textColor + ';border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;padding:8px 18px;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">Info</a>' +
          '<button id="cookie-accept-btn" style="display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg, ' + s.btnBg + ', ' + s.borderColor + ');color:' + s.btnText + ';border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;padding:8px 20px;letter-spacing:0.05em;text-transform:uppercase">Accetta</button>' +
        '</div>' +
      '</div>';
    bindButton();
  }

  function bindButton() {
    var btn = document.getElementById('cookie-accept-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        localStorage.setItem('cb_cookies_accepted', 'true');
        banner.remove();
      });
    }
  }

  renderBanner();
  document.body.appendChild(banner);

  // Listen for theme changes
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'class' && banner.parentNode) {
        renderBanner();
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
