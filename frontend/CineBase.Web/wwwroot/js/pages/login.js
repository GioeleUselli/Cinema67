document.addEventListener('DOMContentLoaded', () => {
  if (!window.Auth) return;

  var params = new URLSearchParams(window.location.search);
  var accessToken = params.get('accessToken');
  var refreshToken = params.get('refreshToken');
  var errorMsg = params.get('error');
  var detailMsg = params.get('detail');
  var expired = params.get('expired');
  var redirect = params.get('redirect');

  if (errorMsg) {
    setTimeout(function(){
      var ed = document.getElementById('error-alert');
      var em = document.getElementById('error-message');
      if (ed && em) {
        em.textContent = 'Errore social login: ' + errorMsg + (detailMsg ? ' (' + decodeURIComponent(detailMsg) + ')' : '');
        ed.classList.remove('hidden');
      }
    }, 100);
  }

  if (accessToken && refreshToken) {
    Auth.saveTokens(accessToken, refreshToken);
    Auth.saveUser({ nome: params.get('name') || '', email: params.get('email') || '' });
    window.location.href = '/index.html';
    return;
  }

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');
  const errorAlert = document.getElementById('error-alert');
  const errorMessage = document.getElementById('error-message');
  const expiredAlert = document.getElementById('expired-alert');
  const togglePasswordBtn = document.getElementById('toggle-password');

  if (expired === 'true' && expiredAlert) {
    expiredAlert.classList.remove('hidden');
  }

  if (Auth.isLoggedIn()) {
    if (redirect) {
      window.location.href = redirect;
    } else {
      window.location.href = '/index.html';
    }
    return;
  }

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      const icon = togglePasswordBtn.querySelector('i');
      if (icon) {
        icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      }
    });
  }

  function showError(message) {
    if (errorAlert && errorMessage) {
      errorMessage.textContent = message;
      errorAlert.classList.remove('hidden');
    }
  }

  function hideError() {
    if (errorAlert) {
      errorAlert.classList.add('hidden');
    }
  }

  function setLoading(loading) {
    if (submitBtn) submitBtn.disabled = loading;
    if (btnText) btnText.classList.toggle('hidden', loading);
    if (btnLoader) btnLoader.classList.toggle('hidden', !loading);
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email) {
      showError('Inserisci la tua email');
      emailInput?.focus();
      return;
    }

    if (!password) {
      showError('Inserisci la password');
      passwordInput?.focus();
      return;
    }

    setLoading(true);

    try {
      await Auth.login(email, password, document.getElementById('remember-me')?.checked);
      
      var user = Auth.getUser();
      if (user && user.ruolo === 'User' && (user.cinemaPreferitoId == null || user.cinemaPreferitoId === 0)) {
        window.location.href = '/scegli-cinema.html';
        return;
      }

      if (redirect) {
        window.location.href = sanitizeRedirect(decodeURIComponent(redirect));
      } else {
        window.location.href = '/index.html';
      }
    } catch (err) {
      setLoading(false);
      showError(err.message || 'Credenziali non valide');
    }
  });
});
