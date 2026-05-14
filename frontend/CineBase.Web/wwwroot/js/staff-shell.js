(() => {
  const STAFF_PATHS = new Set([
    '/dashboard.html',
    '/ricarica-credito.html',
    '/validazione-biglietti.html',
    '/support-tickets.html',
    '/promozioni.html',
    '/feste-admin.html',
    '/rimborsi-admin.html',
    '/food-admin.html',
    '/merch-admin.html'
  ]);

  const PAGE_TITLES = {
    '/dashboard.html': 'Dashboard',
    '/ricarica-credito.html': 'Ricarica Credito',
    '/validazione-biglietti.html': 'Validazione Biglietti',
    '/support-tickets.html': 'Support Tickets',
    '/promozioni.html': 'Promozioni',
    '/feste-admin.html': 'Gestione Feste',
    '/rimborsi-admin.html': 'Gestione Rimborsi',
    '/food-admin.html': 'Food & Beverage',
    '/merch-admin.html': 'Merch Shop'
  };

  function getUser() {
    if (typeof Auth === 'undefined' || !Auth || typeof Auth.getUser !== 'function') return null;
    return Auth.getUser();
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('staff-sidebar');
    const backdrop = document.getElementById('staff-sidebar-backdrop');
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
  }

  function setActiveLinks() {
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll('[data-staff-link]').forEach((el) => {
      const href = (el.getAttribute('href') || '').toLowerCase();
      if (href === currentPath) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function updateUserUI() {
    const user = getUser();
    const userNameEl = document.getElementById('staff-user-name');
    const userAvatarEl = document.getElementById('staff-user-avatar');
    const userMenuNameEl = document.getElementById('staff-user-menu-name');

    if (userNameEl) userNameEl.textContent = user?.nome || user?.email || 'Utente';
    if (userMenuNameEl) userMenuNameEl.textContent = user?.email || '';
    if (userAvatarEl) {
      const first = (user?.nome || 'U').charAt(0);
      const second = (user?.cognome || 'N').charAt(0);
      userAvatarEl.textContent = `${first}${second}`.toUpperCase();
    }
  }

  function bindActions() {
    const sidebarToggle = document.getElementById('staff-sidebar-toggle');
    const backdrop = document.getElementById('staff-sidebar-backdrop');
    const userToggle = document.getElementById('staff-user-toggle');
    const userMenu = document.getElementById('staff-user-menu');
    const logoutBtn = document.getElementById('staff-logout-btn');

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (backdrop) backdrop.addEventListener('click', toggleSidebar);

    if (userToggle && userMenu) {
      userToggle.addEventListener('click', () => {
        userMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', (event) => {
        if (!userToggle.contains(event.target) && !userMenu.contains(event.target)) {
          userMenu.classList.add('hidden');
        }
      });
    }

    const handleLogout = () => {
      if (typeof Auth === 'undefined' || !Auth || typeof Auth.logout !== 'function') {
        window.location.href = '/index.html';
        return;
      }
      Auth.logout().finally(() => {
        window.location.href = '/index.html';
      });
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  }

  function renderShell(main) {
    const currentPath = window.location.pathname.toLowerCase();
    const pageTitle = PAGE_TITLES[currentPath] || 'Area Staff';

    const shell = document.createElement('div');
    shell.innerHTML = `
      <div id="staff-shell-root" class="bg-brand-surface">
      <div id="staff-sidebar-backdrop" class="fixed inset-0 bg-black/60 z-40 hidden md:hidden"></div>
      <div class="flex w-full min-h-screen">
        <aside id="staff-sidebar" class="staff-sidebar w-64 flex-shrink-0 flex flex-col fixed md:relative inset-y-0 left-0 z-50 -translate-x-full md:translate-x-0 transition-transform duration-300 border-r border-brand-outline-variant/20">
          <div class="p-6">
            <a href="/index.html" class="flex flex-col items-center gap-2" style="color: rgb(168, 152, 136);">
              <img src="/assets/logo.png" alt="Cinema67" class="h-20 w-20 rounded-full object-cover border-2 border-brand-gold/40">
              <span class="font-serif text-base font-bold uppercase tracking-[0.2em] sidebar-text">Cinema67</span>
            </a>
          </div>
          <p class="staff-console-label px-6 pb-2 text-[10px] uppercase tracking-[0.24em] text-brand-gold">Area Staff Cinema</p>
          <nav class="staff-sidebar-rail flex-1 px-4 space-y-1">
            <a data-staff-link href="/dashboard.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-gauge-high"></i>Dashboard</a>
            <div class="my-2 border-t border-brand-outline-variant/20"></div>
            <a data-staff-link href="/ricarica-credito.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-coins"></i>Ricarica Credito</a>
            <a data-staff-link href="/validazione-biglietti.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-qrcode"></i>Validazione</a>
            <a data-staff-link href="/support-tickets.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-headset"></i>Support Tickets</a>
            <a data-staff-link href="/promozioni.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-bullhorn"></i>Promozioni</a>
            <div class="my-2 border-t border-brand-outline-variant/20"></div>
            <a data-staff-link href="/feste-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-calendar-days"></i>Gestione Feste</a>
            <a data-staff-link href="/rimborsi-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-undo"></i>Rimborsi</a>
            <a data-staff-link href="/food-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-utensils"></i>Food & Beverage</a>
            <a data-staff-link href="/merch-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-store"></i>Merch Shop</a>
          </nav>
          <div class="p-4 border-t border-brand-outline-variant/20 space-y-1">
            <button onclick="Cinema67Theme.toggle()" class="sidebar-theme-toggle w-full px-4 py-3 rounded-xl text-left">
              <i class="fa-solid fa-moon theme-toggle-icon-moon"></i>
              <i class="fa-solid fa-sun theme-toggle-icon-sun hidden"></i>
              <span class="theme-toggle-label">Cambia tema</span>
            </button>
            <a href="/profilo.html" class="flex items-center gap-3 px-4 py-3 rounded-xl text-brand-sidebar-text hover:text-brand-gold transition-colors">
              <i class="fa-solid fa-user-gear"></i>
              Profilo
            </a>
          </div>
        </aside>

        <div class="flex-1 min-h-screen overflow-x-auto">
          <header class="bg-brand-surface-container-lowest/95 backdrop-blur-xl ambient-shadow-sm border-b border-brand-outline-variant/15 sticky top-0 z-30">
            <div class="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <button id="staff-sidebar-toggle" class="md:hidden p-2 text-brand-on-surface hover:text-brand-gold" title="Apri menu" aria-label="Apri menu laterale">
                  <i class="fa-solid fa-bars text-xl"></i>
                </button>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.24em] text-brand-gold">Operazioni Cinema</p>
                  <h1 class="text-xl sm:text-2xl font-bold text-brand-on-surface">${pageTitle}</h1>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="relative">
                  <button id="staff-user-toggle" class="flex items-center gap-2 text-sm font-medium text-brand-on-surface">
                    <div id="staff-user-avatar" class="w-8 h-8 bg-brand-surface-container-highest rounded-full flex items-center justify-center text-brand-on-surface font-semibold">UN</div>
                    <span id="staff-user-name" class="hidden sm:inline">Utente</span>
                  </button>
                  <div id="staff-user-menu" class="hidden absolute right-0 mt-2 w-56 bg-brand-surface-container rounded-xl shadow-lg border border-brand-outline-variant/10 py-2">
                    <p id="staff-user-menu-name" class="px-4 py-2 text-xs text-brand-on-surface-variant"></p>
                    <a href="/profilo.html" class="block px-4 py-2 text-sm text-brand-on-surface hover:text-brand-gold hover:bg-brand-surface-container-high"><i class="fa-solid fa-user mr-2"></i>Profilo</a>
                    <a href="/profilo.html#prenotazioni" class="block px-4 py-2 text-sm text-brand-on-surface hover:text-brand-gold hover:bg-brand-surface-container-high"><i class="fa-solid fa-ticket mr-2"></i>Prenotazioni</a>
                    <hr class="my-1 border-brand-outline-variant/20">
                    <button id="staff-logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-brand-surface-container-high"><i class="fa-solid fa-sign-out-alt mr-2"></i>Logout</button>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div id="staff-shell-content" class="px-4 sm:px-6 lg:px-8 py-8"></div>
        </div>
      </div>
      </div>
    `;

    document.body.prepend(shell.firstElementChild);
    const target = document.getElementById('staff-shell-content');
    if (!target) return;
    main.className = '';
    target.appendChild(main);
  }

  document.addEventListener('DOMContentLoaded', () => {
    var pathname = window.location.pathname.toLowerCase();
    if (!STAFF_PATHS.has(pathname)) return;

    // Only render for CinemaStaff users
    var user = getUser();
    if (!user || !user.ruolo) return;
    var role = String(user.ruolo).trim().toLowerCase();
    if (role !== 'cinemastaff' && role !== '3') return;

    const main = document.querySelector('main');
    if (!main) return;

    const navbarContainer = document.getElementById('navbar-container');
    const footerContainer = document.getElementById('footer-container');
    if (navbarContainer) navbarContainer.remove();
    if (footerContainer) footerContainer.remove();

    renderShell(main);
    bindActions();
    setActiveLinks();
    updateUserUI();
  });
})();
