(function() {
  var STORAGE_KEY = 'cb_newsletter_dismissed';
  if (localStorage.getItem(STORAGE_KEY)) return;

  setTimeout(function() {
    if (typeof Auth !== 'undefined' && Auth && typeof Auth.isLoggedIn === 'function' && Auth.isLoggedIn()) return;

    var overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.3s ease';
    overlay.innerHTML =
      '<div class="cine-premium-card p-8 w-full max-w-[440px] relative overflow-hidden text-center" style="animation: fadeIn 0.4s ease 0.15s both">' +
        '<div class="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-gold/8 blur-3xl pointer-events-none"></div>' +
        '<button id="nl-close" class="absolute top-3 right-3 text-brand-on-surface-variant hover:text-brand-on-surface p-1"><i class="fa-solid fa-xmark"></i></button>' +
        '<span class="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-4"><i class="fa-solid fa-envelope-open-text text-2xl text-brand-red"></i></span>' +
        '<h3 class="font-serif text-xl font-bold text-brand-on-surface mb-2">Unisciti alla Newsletter</h3>' +
        '<p class="text-sm text-brand-on-surface-variant mb-2">Ricevi offerte esclusive, anteprime e <strong class="text-brand-gold">-15% sul primo acquisto</strong>.</p>' +
        '<form id="nl-form" class="flex gap-2 mt-4">' +
          '<input type="email" id="nl-email" class="ghost-input flex-1 px-4 py-2.5 rounded-xl text-sm" placeholder="La tua email" required>' +
          '<button type="submit" class="btn-gold text-sm px-5 py-2.5 whitespace-nowrap">Iscriviti</button>' +
        '</form>' +
        '<p id="nl-result" class="hidden text-sm mt-3 font-bold"></p>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) { overlay.remove(); localStorage.setItem(STORAGE_KEY, '1'); }
    });

    document.getElementById('nl-close').addEventListener('click', function() {
      overlay.remove(); localStorage.setItem(STORAGE_KEY, '1');
    });

    document.getElementById('nl-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('nl-email').value.trim();
      if (!email) return;
      var resultEl = document.getElementById('nl-result');
      resultEl.classList.remove('hidden');
      resultEl.className = 'text-sm mt-3 font-bold text-brand-on-surface-variant';
      resultEl.textContent = 'Iscrizione in corso...';
      try {
        var resp = await fetch('http://localhost:5000/newsletter/iscriviti', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        var text = await resp.text();
        try {
          var data = JSON.parse(text);
          if (data.codiceSconto) {
            resultEl.className = 'text-sm mt-3 font-bold p-3 rounded-xl bg-brand-gold/10 text-brand-gold';
            resultEl.innerHTML = 'Iscritto! Il tuo codice sconto: <span class="font-mono text-lg block mt-1">' + data.codiceSconto + '</span><span class="text-xs font-normal block mt-1">-' + data.percentualeSconto + '% sul primo acquisto</span>';
            document.getElementById('nl-form').classList.add('hidden');
            setTimeout(function() { overlay.remove(); localStorage.setItem(STORAGE_KEY, '1'); }, 5000);
          } else {
            resultEl.className = 'text-sm mt-3 font-bold text-brand-on-surface-variant';
            resultEl.textContent = data.messaggio || 'Già iscritto!';
          }
        } catch(jsonErr) {
          resultEl.className = 'text-sm mt-3 font-bold text-brand-error';
          resultEl.textContent = 'Errore server: ' + (resp.status === 500 ? 'Database non aggiornato. Esegui dotnet ef database update' : text.substring(0, 100));
        }
      } catch(e) {
        resultEl.className = 'text-sm mt-3 font-bold text-brand-error';
        resultEl.textContent = 'Backend non raggiungibile. Avvia il server.';
      }
    });
  }, 4000);
})();
