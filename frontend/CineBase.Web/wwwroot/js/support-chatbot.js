(function () {
  const landingPaths = new Set([
    '/',
    '/index.html',
    '/programmazione.html',
    '/scheda-film.html',
    '/my-cinemas.html',
    '/profilo.html',
    '/acquista.html',
    '/pagamento.html',
    '/esito-acquisto.html'
  ]);

  const currentPath = (window.location.pathname || '').toLowerCase();
  if (!landingPaths.has(currentPath)) return;
  if (typeof window.Auth === 'undefined' || !window.Auth || !window.Auth.isLoggedIn()) return;

  let conversation = null;
  let loading = false;
  let lastOpenTicketSnapshot = '';

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
        const hint = document.getElementById('support-chat-escalate-hint');
        if (hint) hint.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Errore invio messaggio support:', err);
      if (typeof showToast === 'function') showToast('Errore invio messaggio assistenza', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openTicket() {
    if (loading) return;
    const title = prompt('Titolo ticket (breve):', 'Problema assistenza piattaforma');
    if (!title) return;
    const description = prompt('Descrivi il problema in dettaglio:');
    if (!description) return;

    setLoading(true);
    try {
      await API.createSupportTicket({
        title,
        description,
        priority: 'Medium',
        ...collectContext(),
        contextMetadata: JSON.stringify({ userAgent: navigator.userAgent })
      });

      await loadConversation();
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
            <p class="support-chat-kicker">Supporto CineAura</p>
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
          <button id="support-chat-ticket" class="support-chat-ticket-btn" type="button">
            <i class="fa-solid fa-life-ring"></i> Non ho risolto, apri ticket
          </button>
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

    suggest?.querySelectorAll('.support-chat-chip').forEach((btn) => {
      btn.addEventListener('click', () => sendMessage(btn.textContent || ''));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    mountWidget();
    await loadConversation();
  });
})();
