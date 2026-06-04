(function() {
  var STORAGE_KEY = 'cb_newsletter_dismissed';
  if (localStorage.getItem(STORAGE_KEY)) return;

  setTimeout(function() {
    if (typeof Auth !== 'undefined' && Auth && typeof Auth.isLoggedIn === 'function' && Auth.isLoggedIn()) return;

    var card = document.createElement('div');
    card.id = 'nl-card';
    card.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:10000;width:min(90vw,400px);animation:fadeIn 0.3s ease;';

    card.innerHTML =
      '<div style="background:var(--brand-surface-container-lowest);border:2px solid var(--brand-gold);border-radius:1.2rem;padding:1.5rem;text-align:center;position:relative;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.35);">' +
        '<div style="position:absolute;top:-2rem;right:-2rem;width:6rem;height:6rem;border-radius:50%;background:var(--brand-gold);opacity:0.06;filter:blur(2rem);pointer-events:none;"></div>' +
        '<button onclick="var c=document.getElementById(\'nl-card\');if(c)c.remove();localStorage.setItem(\'' + STORAGE_KEY + '\',\'1\')" style="position:absolute;top:0.5rem;right:0.5rem;background:none;border:none;cursor:pointer;color:var(--brand-on-surface-variant);font-size:1rem;padding:0.25rem;"><i class="fa-solid fa-xmark"></i></button>' +
        '<span style="display:inline-flex;width:3.5rem;height:3.5rem;border-radius:1rem;background:rgba(185,28,28,0.1);align-items:center;justify-content:center;margin-bottom:1rem;"><i class="fa-solid fa-envelope-open-text" style="font-size:1.5rem;color:var(--brand-red);"></i></span>' +
        '<h3 style="font-family:\'DM Serif Display\',Georgia,serif;font-size:1.25rem;font-weight:bold;color:var(--brand-on-surface);margin-bottom:0.5rem;">Unisciti alla Newsletter</h3>' +
        '<p style="font-size:0.875rem;color:var(--brand-on-surface-variant);margin-bottom:0.5rem;">Ricevi offerte esclusive, anteprime e <strong style="color:var(--brand-gold);">-15% sul primo acquisto</strong>.</p>' +
        '<form id="nl-form" style="display:flex;gap:0.5rem;margin-top:1rem;">' +
          '<input type="email" id="nl-email" required placeholder="La tua email" style="flex:1;padding:0.625rem 1rem;border-radius:0.75rem;border:1px solid var(--brand-outline-variant);background:var(--brand-surface-container-high);color:var(--brand-on-surface);font-size:0.875rem;outline:none;">' +
          '<button type="submit" style="background:linear-gradient(135deg,var(--brand-gold),var(--brand-gold-dark));color:white;border:none;border-radius:0.75rem;padding:0.625rem 1.25rem;font-weight:700;font-size:0.875rem;cursor:pointer;white-space:nowrap;">Iscriviti</button>' +
        '</form>' +
        '<p id="nl-result" style="display:none;font-size:0.875rem;margin-top:0.75rem;font-weight:bold;"></p>' +
      '</div>';

    document.body.appendChild(card);

    document.getElementById('nl-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('nl-email').value.trim();
      if (!email) return;
      var resultEl = document.getElementById('nl-result');
      resultEl.style.display = 'block';
      resultEl.style.color = 'var(--brand-on-surface-variant)';
      resultEl.textContent = 'Iscrizione in corso...';
      try {
        var apiBase = (window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__.apiBaseUrl) || 'http://localhost:5000';
        var resp = await fetch(apiBase + '/newsletter/iscriviti', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        var text = await resp.text();
        try {
          var data = JSON.parse(text);
          if (data.codiceSconto) {
            resultEl.style.cssText = 'display:block;font-size:0.875rem;margin-top:0.75rem;font-weight:bold;padding:0.75rem;border-radius:0.75rem;background:rgba(184,134,11,0.1);color:var(--brand-gold);';
            resultEl.innerHTML = 'Iscritto! Il tuo codice sconto: <span style="font-family:monospace;font-size:1.125rem;display:block;margin-top:0.25rem;">' + data.codiceSconto + '</span><span style="font-size:0.75rem;font-weight:normal;display:block;margin-top:0.25rem;">-' + data.percentualeSconto + '% sul primo acquisto</span>';
            document.getElementById('nl-form').style.display = 'none';
            setTimeout(function() { card.remove(); localStorage.setItem(STORAGE_KEY, '1'); }, 5000);
          } else {
            resultEl.style.display = 'block';
            resultEl.style.color = 'var(--brand-on-surface-variant)';
            resultEl.style.fontWeight = 'bold';
            resultEl.textContent = data.messaggio || 'Già iscritto!';
          }
        } catch(jsonErr) {
          resultEl.style.display = 'block';
          resultEl.style.color = 'var(--brand-error)';
          resultEl.style.fontWeight = 'bold';
          resultEl.textContent = 'Errore server.';
        }
      } catch(e) {
        resultEl.style.display = 'block';
        resultEl.style.color = 'var(--brand-error)';
        resultEl.style.fontWeight = 'bold';
        resultEl.textContent = 'Backend non raggiungibile.';
      }
    });
  }, 4000);
})();
