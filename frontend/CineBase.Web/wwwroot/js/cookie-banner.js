(function () {
  if (localStorage.getItem('cb_cookies_accepted') === 'true') return;

  var banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML =
    '<div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1e293b,#0f172a);border-top:2px solid #f59e0b;padding:16px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;box-shadow:0 -4px 24px rgba(0,0,0,0.5)">' +
      '<p style="color:#cbd5e1;font-size:13px;max-width:600px;margin:0">' +
        'Questo sito utilizza cookie tecnici e localStorage per garantire la migliore esperienza di navigazione. ' +
        'Proseguendo accetti la nostra <a href="/cookie.html" style="color:#f59e0b;text-decoration:underline">Cookie Policy</a> e la ' +
        '<a href="/privacy.html" style="color:#f59e0b;text-decoration:underline">Privacy Policy</a>.' +
      '</p>' +
      '<button id="cookie-accept-btn" style="background:#f59e0b;color:#0f172a;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap">Accetta</button>' +
    '</div>';

  document.body.appendChild(banner);

  var acceptBtn = document.getElementById('cookie-accept-btn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      localStorage.setItem('cb_cookies_accepted', 'true');
      banner.remove();
    });
  }
})();
