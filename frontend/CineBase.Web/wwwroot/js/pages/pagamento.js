let orderId = null;
let ordine = null;
let creditoData = null;
let frontendConfig = null;
let countdownInterval = null;
let checkoutExpiresAt = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth?.isLoggedIn?.()) {
    window.location.replace('/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
    return;
  }

  var params = new URLSearchParams(window.location.search);
  orderId = parseInt(params.get('orderId'));

  if (!orderId) {
    showError('Parametro orderId mancante');
    return;
  }

  await Promise.all([loadOrdine(), loadCredito(), loadFrontendConfig()]);

  if (!ordine) return;
  if (ordine.stato !== 'Pending') {
    window.location.href = '/esito-acquisto.html?orderId=' + ordine.id;
    return;
  }

  renderOrderSummary();
  setupPaymentOptions();
  setupActions();
  startCountdown();
});

async function loadFrontendConfig() {
  try {
    frontendConfig = await API.getFrontendConfig();
  } catch {
    frontendConfig = null;
  }
}

async function loadOrdine() {
  try {
    ordine = await API.getOrdine(orderId);
    if (!ordine) {
      showError('Ordine non trovato');
      return;
    }
  } catch (error) {
    showError(error.message || 'Errore caricamento ordine');
  }
}

async function loadCredito() {
  try {
    creditoData = await API.getCreditoMe();
  } catch {
    creditoData = { saldoAttuale: 0 };
  }
}

function renderOrderSummary() {
  hideLoading();
  document.getElementById('main-content').classList.remove('hidden');

  document.getElementById('credit-balance').textContent = formatCurrency(creditoData?.saldoAttuale || 0);

  const container = document.getElementById('order-summary');
  const startDate = new Date(ordine.startAtUtc);
  const dateOptions = { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
  const dateStr = startDate.toLocaleDateString('it-IT', dateOptions);

  container.innerHTML = `
    <div class="flex justify-between text-sm">
      <span class="text-brand-on-surface-variant">Film</span>
      <span class="font-medium text-brand-on-surface">${ordine.filmTitolo}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-brand-on-surface-variant">Cinema</span>
      <span class="font-medium text-brand-on-surface">${ordine.cinemaNome}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-brand-on-surface-variant">Sala</span>
      <span class="font-medium text-brand-on-surface">${ordine.salaNome}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-brand-on-surface-variant">Data e ora</span>
      <span class="font-medium text-brand-on-surface">${dateStr}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-brand-on-surface-variant">Numero biglietti</span>
      <span class="font-medium text-brand-on-surface">${ordine.numeroBiglietti}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-brand-on-surface-variant">Codice ordine</span>
      <span class="font-mono text-brand-on-surface">${ordine.codiceOrdine}</span>
    </div>
  `;

  document.getElementById('order-total').textContent = formatCurrency(ordine.totaleLordo);
  updatePayButtonText();
}

function setupPaymentOptions() {
  const saldo = creditoData?.saldoAttuale || 0;
  const totale = ordine?.totaleLordo || 0;

  const optionCredito = document.getElementById('option-credito');
  const optionMisto = document.getElementById('option-misto');
  const creditOnlyDesc = document.getElementById('credit-only-desc');

  if (saldo < totale) {
    optionCredito.querySelector('input').disabled = true;
    optionCredito.classList.add('opacity-50', 'cursor-not-allowed');
    creditOnlyDesc.textContent = `Credito insufficiente (disponibili ${formatCurrency(saldo)})`;
  }

  if (saldo <= 0) {
    optionMisto.querySelector('input').disabled = true;
    optionMisto.classList.add('opacity-50', 'cursor-not-allowed');
  }

  const slider = document.getElementById('credit-slider');
  slider.max = Math.min(saldo, totale);
  slider.value = 0;

  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', () => {
      onPaymentMethodChange(radio.value);
    });
  });

  slider.addEventListener('input', () => {
    updateSplitDisplay();
  });
}

function onPaymentMethodChange(method) {
  const stripeInfoSection = document.getElementById('stripe-info-section');
  const sliderSection = document.getElementById('credit-slider-section');
  const saldo = creditoData?.saldoAttuale || 0;
  const totale = ordine?.totaleLordo || 0;

  sliderSection.classList.add('hidden');
  stripeInfoSection.classList.add('hidden');

  switch (method) {
    case 'carta':
      stripeInfoSection.classList.remove('hidden');
      break;
    case 'credito':
      break;
    case 'misto':
      sliderSection.classList.remove('hidden');
      stripeInfoSection.classList.remove('hidden');
      const slider = document.getElementById('credit-slider');
      slider.max = Math.min(saldo, totale);
      slider.value = Math.min(saldo, totale);
      updateSplitDisplay();
      break;
  }

  updatePayButtonText();
}

function updateSplitDisplay() {
  const slider = document.getElementById('credit-slider');
  const creditAmount = parseFloat(slider.value);
  const totale = ordine?.totaleLordo || 0;
  const cardAmount = totale - creditAmount;

  document.getElementById('credit-amount-label').textContent = `Credito: ${formatCurrency(creditAmount)}`;
  document.getElementById('card-amount-label').textContent = `Carta: ${formatCurrency(cardAmount)}`;

  updatePayButtonText();
}

function updatePayButtonText() {
  const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'carta';
  const totale = ordine?.totaleLordo || 0;
  let amount = totale;

  if (method === 'credito') {
    amount = totale;
  } else if (method === 'misto') {
    const slider = document.getElementById('credit-slider');
    const creditUsed = parseFloat(slider?.value || 0);
    amount = totale - creditUsed;
  }

  const btnText = document.getElementById('pay-button-text');
  if (method === 'credito') {
    btnText.textContent = `Paga ${formatCurrency(totale)} con credito`;
  } else if (method === 'misto' && amount <= 0) {
    btnText.textContent = `Paga ${formatCurrency(totale)} con credito`;
  } else {
    btnText.textContent = `Paga ${formatCurrency(amount)} con carta`;
  }
}

function setupActions() {
  const btnPay = document.getElementById('btn-pay');
  const btnCancel = document.getElementById('btn-cancel');

  btnPay.addEventListener('click', async () => {
    await handlePayment();
  });

  btnCancel.addEventListener('click', async () => {
    if (!confirm('Sei sicuro? I posti saranno rilasciati e potrai riprovare dalla programmazione.')) return;

    btnCancel.disabled = true;
    btnCancel.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Annullamento...';

    try {
      await API.cancelOrdine(orderId);
      window.location.href = ordine && ordine.showId ? '/acquista.html?showId=' + ordine.showId : '/programmazione.html';
    } catch (error) {
      handleApiError(error);
      btnCancel.disabled = false;
      btnCancel.innerHTML = '<i class="fa-solid fa-arrow-left mr-2"></i>Annulla e torna ai posti';
    }
  });

  window.addEventListener('beforeunload', function () {
    if (orderId && navigator.sendBeacon) {
      var data = new Blob([JSON.stringify({})], { type: 'application/json' });
      navigator.sendBeacon(API_BASE_URL + '/checkout/orders/' + orderId + '/cancel', data);
    }
  });
}

async function handlePayment() {
  const btnPay = document.getElementById('btn-pay');
  btnPay.disabled = true;
  btnPay.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Elaborazione pagamento...';

  try {
    const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'carta';
    let importoCreditoRichiesto = null;

    if (method === 'credito') {
      importoCreditoRichiesto = ordine.totaleLordo;
    } else if (method === 'misto') {
      const slider = document.getElementById('credit-slider');
      importoCreditoRichiesto = parseFloat(slider.value);
    }

    if (method === 'credito' && (creditoData?.saldoAttuale || 0) >= ordine.totaleLordo) {
      const metodoPagamento = 'Credito';
      const idempotencyKey = `pay-${orderId}-${Date.now()}`;
      const result = await API.payOrdine(orderId, metodoPagamento, importoCreditoRichiesto, idempotencyKey);

      if (result.statoPagamento === 'Paid' || result.ordine?.stato === 'Paid') {
        window.location.href = `/esito-acquisto.html?orderId=${orderId}&success=true`;
      } else {
        showToast(result.messaggio || 'Pagamento in elaborazione', 'info');
        setTimeout(() => {
          window.location.href = `/esito-acquisto.html?orderId=${orderId}`;
        }, 2000);
      }
      return;
    }

    if (method === 'misto' && importoCreditoRichiesto > 0 && (creditoData?.saldoAttuale || 0) >= importoCreditoRichiesto) {
      const idempotencyKey = `checkout-${orderId}-${Date.now()}`;
      const session = await API.createStripeCheckoutSession(orderId, {
        metodoPagamento: 'Misto',
        importoCreditoRichiesto
      }, idempotencyKey);

      if (session?.stripeCheckoutUrl) {
        window.location.href = session.stripeCheckoutUrl;
        return;
      }

      showToast('Errore nella creazione della sessione Stripe Checkout', 'danger');
      btnPay.disabled = false;
      btnPay.innerHTML = '<i class="fa-solid fa-lock mr-2"></i><span id="pay-button-text">Riprova pagamento</span>';
      return;
    }

    const idempotencyKey = `checkout-${orderId}-${Date.now()}`;
    const session = await API.createStripeCheckoutSession(orderId, {
      metodoPagamento: 'Carta'
    }, idempotencyKey);

    if (session?.stripeCheckoutUrl) {
      window.location.href = session.stripeCheckoutUrl;
    } else {
      showToast('Errore nella creazione della sessione di pagamento', 'danger');
      btnPay.disabled = false;
      btnPay.innerHTML = '<i class="fa-solid fa-lock mr-2"></i><span id="pay-button-text">Riprova pagamento</span>';
    }
  } catch (error) {
    handleApiError(error);
    btnPay.disabled = false;
    btnPay.innerHTML = '<i class="fa-solid fa-lock mr-2"></i><span id="pay-button-text">Riprova pagamento</span>';
    updatePayButtonText();
  }
}

function getStripePublishableKey() {
  const configKey = frontendConfig?.stripePublishableKey;
  if (configKey) return configKey;
  return '';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

function hideLoading() {
  document.getElementById('loading-state').classList.add('hidden');
}

function showError(message) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('main-content').classList.add('hidden');
  var msgEl = document.getElementById('error-message');
  if (msgEl) msgEl.textContent = message;
}

function startCountdown() {
  var card = document.getElementById('countdown-card');
  var timerEl = document.getElementById('countdown-timer');
  if (!card || !timerEl) return;

  if (ordine && ordine.checkoutExpiresAtUtc) {
    checkoutExpiresAt = new Date(ordine.checkoutExpiresAtUtc + (ordine.checkoutExpiresAtUtc.indexOf('Z') === -1 && ordine.checkoutExpiresAtUtc.indexOf('+') === -1 ? 'Z' : ''));
  }
  if (!checkoutExpiresAt || isNaN(checkoutExpiresAt.getTime())) {
    checkoutExpiresAt = new Date(Date.now() + 4 * 60 * 1000);
  }
  card.classList.remove('hidden');

  function tick() {
    var now = new Date();
    var diff = Math.max(0, Math.floor((checkoutExpiresAt - now) / 1000));
    var mins = Math.floor(diff / 60);
    var secs = diff % 60;
    timerEl.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    if (diff <= 30) timerEl.style.color = 'var(--brand-error)';
    if (diff <= 0) {
      clearInterval(countdownInterval);
      card.innerHTML = '<div class="flex items-center gap-2"><i class="fa-solid fa-circle-exclamation text-brand-error"></i><span class="text-sm font-semibold text-brand-error">Tempo scaduto</span></div><p class="text-xs text-brand-on-surface-variant mt-1">Ordine annullato. Torna alla programmazione per riprovare.</p>';
      var payBtn = document.getElementById('btn-pay');
      if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'Ordine scaduto'; }
    }
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}
