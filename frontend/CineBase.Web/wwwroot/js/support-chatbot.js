(function () {
  const currentPath = (window.location.pathname || '').toLowerCase();
  const hiddenPaths = new Set(['/login.html', '/registrazione.html']);
  if (hiddenPaths.has(currentPath)) return;

  let conversation = null;
  let loading = false;
  let lastOpenTicketSnapshot = '';
  let escalationEligible = false;
  let userTurns = 0;

  function isAuthenticated() {
    return typeof window.Auth !== 'undefined' && !!window.Auth && typeof window.Auth.isLoggedIn === 'function' && window.Auth.isLoggedIn();
  }

  function localFaqReply(input) {
    const text = String(input || '').toLowerCase();
    if (text.includes('pagamento') || text.includes('carta') || text.includes('stripe')) {
      return 'Prova a ricaricare la pagina pagamento, verifica metodo (carta/credito/misto) e controlla il saldo. Se il problema continua, accedi e apri ticket assistenza.';
    }
    if (text.includes('biglietto') || text.includes('pdf') || text.includes('email')) {
      return 'Controlla in Profilo > I Miei Biglietti e scarica il PDF. Verifica anche spam/posta indesiderata. Se manca ancora, apri ticket con codice ordine.';
    }
    if (text.includes('login') || text.includes('password') || text.includes('accesso')) {
      return 'Verifica credenziali senza spazi, fai logout/login e riprova. Se non risolvi, accedi e apri un ticket per verifica account.';
    }
    return 'Posso aiutarti su pagamenti, biglietti, accesso e prenotazioni. Se vuoi aprire ticket, effettua login e premi "Non ho risolto, apri ticket".';
  }

  function shouldSuggestEscalationFromText(input) {
    const text = String(input || '').toLowerCase();
    return text.includes('non funziona')
      || text.includes('non va')
      || text.includes('non risolto')
      || text.includes('ancora')
      || text.includes('errore');
  }

  function setEscalationEligibility(eligible) {
    escalationEligible = !!eligible;
    const hint = document.getElementById('support-chat-escalate-hint');
    const ticketBtn = document.getElementById('support-chat-ticket');
    if (hint) hint.classList.toggle('hidden', !escalationEligible);
    if (ticketBtn) ticketBtn.classList.toggle('hidden', !escalationEligible);
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function renderMessage(msg) {
    const isUser = String(msg.role || '').toLowerCase() === 'user';
    const row = el('div', `support-chat-row ${isUser ? 'justify-end' : 'justify-start'}`);
    const bubble = el('div', `support-chat-bubble ${isUser ? 'support-chat-bubble-user' : 'support-chat-bubble-bot'}`);
    bubble.textContent = msg.message || '';
    row.appendChild(bubble);
    return row;
  }

  function updateConversationUI() {
    const messagesHost = document.getElementById('support-chat-messages');
    if (!messagesHost) return;
    messagesHost.innerHTML = '';

    const msgs = Array.isArray(conversation?.messages) ? conversation.messages : [];
    msgs.forEach(m => messagesHost.appendChild(renderMessage(m)));

    messagesHost.scrollTop = messagesHost.scrollHeight;

    const tickets = Array.isArray(conversation?.tickets) ? conversation.tickets : [];
    const ticketBadge = document.getElementById('support-chat-ticket-badge');
    if (ticketBadge) {
      ticketBadge.textContent = tickets.length ? `Ticket: ${tickets[0].code} (${tickets[0].status})` : 'Nessun ticket aperto';
    }

    const openTicket = tickets.find(t => {
      const s = String(t.status || '').toLowerCase();
      return s === 'open' || s === 'inprogress' || s === 'resolved' || s === 'closed';
    });

    const snapshot = openTicket ? `${openTicket.code}:${openTicket.status}` : '';
    if (snapshot && lastOpenTicketSnapshot && snapshot !== lastOpenTicketSnapshot) {
      const status = String(openTicket.status || 'aggiornato');
      if (typeof showToast === 'function') {
        showToast(`Aggiornamento ticket ${openTicket.code}: ${status}`, status.toLowerCase() === 'resolved' ? 'success' : 'info');
      }
    }
    if (snapshot) lastOpenTicketSnapshot = snapshot;

    if (!tickets.length && userTurns < 2) {
      setEscalationEligibility(false);
    }
  }

  function setLoading(state) {
    loading = state;
    const btn = document.getElementById('support-chat-send');
    const input = document.getElementById('support-chat-input');
    if (btn) btn.disabled = state;
    if (input) input.disabled = state;
  }

  function collectContext() {
    return {
      contextPage: window.location.pathname + window.location.search,
      contextOrderCode: new URLSearchParams(window.location.search).get('orderCode') || undefined
    };
  }

  async function loadConversation() {
    if (!isAuthenticated()) {
      conversation = {
        messages: [
          {
            role: 'Bot',
            message: "Ciao! Sono l'assistente Cinema67. Posso aiutarti subito con FAQ. Per aprire ticket devi essere autenticato."
          }
        ],
        tickets: []
      };
      updateConversationUI();
      return;
    }

    try {
      const data = await API.getSupportConversation();
      conversation = data;
      updateConversationUI();
    } catch (err) {
      console.error('Errore caricamento conversazione support:', err);
    }
  }

  async function sendMessage(customMessage) {
    if (loading) return;
    const input = document.getElementById('support-chat-input');
    const message = (customMessage || input?.value || '').trim();
    if (!message) return;

    setLoading(true);
    userTurns += 1;

    if (userTurns >= 3 || shouldSuggestEscalationFromText(message)) {
      setEscalationEligibility(true);
    }

    if (!isAuthenticated()) {
      conversation = conversation || { messages: [], tickets: [] };
      conversation.messages.push({ role: 'User', message });
      conversation.messages.push({ role: 'Bot', message: localFaqReply(message) });
      updateConversationUI();
      if (input && !customMessage) input.value = '';
      if (!escalationEligible && userTurns >= 4) setEscalationEligibility(true);
      setLoading(false);
      return;
    }

    try {
      const data = await API.sendSupportMessage({ message, ...collectContext() });
      conversation = data.conversation;
      updateConversationUI();

      if (input && !customMessage) input.value = '';

      const suggest = document.getElementById('support-chat-suggest');
      if (suggest) {
        suggest.innerHTML = '';
        (data.suggestedActions || []).slice(0, 3).forEach(label => {
          const b = el('button', 'support-chat-chip', label);
          b.type = 'button';
          b.addEventListener('click', () => sendMessage(label));
          suggest.appendChild(b);
        });
      }

      if (data.shouldEscalate) {
        setEscalationEligibility(true);
      }
    } catch (err) {
      console.error('Errore invio messaggio support:', err);
      if (typeof showToast === 'function') showToast('Errore invio messaggio assistenza', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function resetConversation() {
    if (!isAuthenticated() || loading) return;
    setLoading(true);
    try {
      await apiFetch('/support/conversation', { method: 'DELETE' });
      conversation = null;
      userTurns = 0;
      setEscalationEligibility(false);
      await loadConversation();
    } catch (e) { console.error(e); }
    setLoading(false);
  }
    if (loading) return;
    if (!escalationEligible) {
      if (typeof showToast === 'function') showToast('Proviamo ancora qualche step prima di aprire ticket.', 'info');
      return;
    }

    if (!isAuthenticated()) {
      if (typeof showToast === 'function') showToast('Effettua il login per aprire un ticket', 'info');
      if (window.Auth && typeof window.Auth.redirectToLogin === 'function') {
        window.Auth.redirectToLogin(window.location.pathname + window.location.search);
      }
      return;
    }

    const modal = document.getElementById('support-ticket-modal');
    if (!modal) return;

    const lastUserMsg = (conversation?.messages || []).filter(m => String(m.role || '').toLowerCase() === 'user').slice(-1)[0]?.message || '';
    const titleInput = document.getElementById('support-ticket-title');
    const descInput = document.getElementById('support-ticket-description');
    const priorityInput = document.getElementById('support-ticket-priority');

    if (titleInput && !titleInput.value.trim()) {
      titleInput.value = 'Problema assistenza piattaforma';
    }
    if (descInput && !descInput.value.trim()) {
      descInput.value = lastUserMsg ? `Dettagli iniziali: ${lastUserMsg}` : '';
    }
    if (priorityInput && !priorityInput.value) {
      priorityInput.value = 'Medium';
    }

    modal.classList.remove('hidden');
  }

  function closeTicketModal() {
    const modal = document.getElementById('support-ticket-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function submitTicket() {
    if (loading) return;
    const title = (document.getElementById('support-ticket-title')?.value || '').trim();
    const description = (document.getElementById('support-ticket-description')?.value || '').trim();
    const priority = (document.getElementById('support-ticket-priority')?.value || 'Medium').trim();

    if (!title || !description) {
      if (typeof showToast === 'function') showToast('Inserisci titolo e descrizione del ticket', 'error');
      return;
    }

    setLoading(true);
    try {
      await API.createSupportTicket({
        title,
        description,
        priority,
        ...collectContext(),
        contextMetadata: JSON.stringify({ userAgent: navigator.userAgent })
      });

      closeTicketModal();
      await loadConversation();
      setEscalationEligibility(false);
      userTurns = 0;
      if (typeof showToast === 'function') showToast('Ticket aperto con successo', 'success');
    } catch (err) {
      console.error('Errore apertura ticket:', err);
      if (typeof showToast === 'function') showToast('Errore apertura ticket', 'error');
    } finally {
      setLoading(false);
    }
  }

  function mountWidget() {
    const root = el('div', 'support-chat-root');
    root.innerHTML = `
      <button id="support-chat-toggle" class="support-chat-toggle" title="Apri assistenza" aria-label="Apri assistenza">
        <i class="fa-solid fa-headset"></i>
      </button>
      <section id="support-chat-panel" class="support-chat-panel hidden">
        <header class="support-chat-header">
          <div>
            <p class="support-chat-kicker">Supporto Cinema67</p>
            <h3>Assistente virtuale</h3>
          </div>
          <button id="support-chat-close" class="support-chat-close" title="Chiudi" aria-label="Chiudi">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div id="support-chat-ticket-badge" class="support-chat-ticket-badge">Nessun ticket aperto</div>
        <div id="support-chat-messages" class="support-chat-messages"></div>

        <div id="support-chat-suggest" class="support-chat-suggest">
          <button type="button" class="support-chat-chip">Problema pagamento</button>
          <button type="button" class="support-chat-chip">Biglietto non ricevuto</button>
          <button type="button" class="support-chat-chip">Problema accesso</button>
        </div>

        <p id="support-chat-escalate-hint" class="support-chat-escalate-hint hidden">Se non risolvi, apri un ticket all'admin.</p>

        <footer class="support-chat-footer">
          <input id="support-chat-input" type="text" class="support-chat-input" placeholder="Scrivi il tuo problema...">
          <button id="support-chat-send" class="support-chat-send" title="Invia" aria-label="Invia">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </footer>
        <div class="support-chat-actions">
          <button id="support-chat-reset" class="support-chat-ticket-btn" type="button" style="margin-bottom:0.3rem">
            <i class="fa-solid fa-arrows-rotate"></i> Nuova conversazione
          </button>
          <button id="support-chat-ticket" class="support-chat-ticket-btn hidden" type="button">
            <i class="fa-solid fa-life-ring"></i> Non ho risolto, apri ticket
          </button>
        </div>

        <div id="support-ticket-modal" class="support-ticket-modal hidden">
          <div class="support-ticket-modal-backdrop"></div>
          <div class="support-ticket-modal-card">
            <h4>Apri Ticket Assistenza</h4>
            <p class="support-ticket-modal-text">Compila i dettagli: il team admin ricevera subito il ticket con il contesto tecnico.</p>

            <label class="support-ticket-field">
              <span>Titolo</span>
              <input id="support-ticket-title" type="text" class="support-ticket-input" placeholder="Titolo problema">
            </label>

            <label class="support-ticket-field">
              <span>Descrizione</span>
              <textarea id="support-ticket-description" rows="4" class="support-ticket-input" placeholder="Descrivi il problema e i passaggi gia provati"></textarea>
            </label>

            <label class="support-ticket-field">
              <span>Priorita</span>
              <select id="support-ticket-priority" class="support-ticket-input">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>

            <div class="support-ticket-modal-actions">
              <button id="support-ticket-cancel" type="button" class="support-ticket-btn support-ticket-btn-secondary">Annulla</button>
              <button id="support-ticket-submit" type="button" class="support-ticket-btn support-ticket-btn-primary">Invia Ticket</button>
            </div>
          </div>
        </div>
      </section>
    `;

    document.body.appendChild(root);

    const toggle = document.getElementById('support-chat-toggle');
    const panel = document.getElementById('support-chat-panel');
    const close = document.getElementById('support-chat-close');
    const send = document.getElementById('support-chat-send');
    const input = document.getElementById('support-chat-input');
    const ticket = document.getElementById('support-chat-ticket');
    const suggest = document.getElementById('support-chat-suggest');
    const ticketCancel = document.getElementById('support-ticket-cancel');
    const ticketSubmit = document.getElementById('support-ticket-submit');
    const chatReset = document.getElementById('support-chat-reset');

    toggle?.addEventListener('click', () => {
      panel?.classList.toggle('hidden');
    });
    close?.addEventListener('click', () => panel?.classList.add('hidden'));
    send?.addEventListener('click', () => sendMessage());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
    ticket?.addEventListener('click', openTicket);
    ticketCancel?.addEventListener('click', closeTicketModal);
    ticketSubmit?.addEventListener('click', submitTicket);
    chatReset?.addEventListener('click', resetConversation);

    suggest?.querySelectorAll('.support-chat-chip').forEach((btn) => {
      btn.addEventListener('click', () => sendMessage(btn.textContent || ''));
    });
  }

  async function init() {
    mountWidget();
    setEscalationEligibility(false);
    await loadConversation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
