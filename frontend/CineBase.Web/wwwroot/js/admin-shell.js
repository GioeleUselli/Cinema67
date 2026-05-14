(() => {
  const ADMIN_PATHS = new Set([
    '/dashboard.html',
    '/films.html',
    '/registi.html',
    '/cinemas.html',
    '/proiezioni.html',
    '/categorie.html',
    '/sale.html',
    '/ricarica-credito.html',
    '/validazione-biglietti.html',
    '/support-tickets.html',
    '/promozioni.html',
    '/admin-utenti.html',
    '/membership-admin.html',
    '/newsletter-admin.html',
    '/merch-admin.html',
    '/corriere.html',
    '/magazzino.html',
    '/admin-pacchi.html',
    '/feste-admin.html',
    '/rimborsi-admin.html',
    '/food-admin.html'
  ]);

  const PAGE_TITLES = {
    '/dashboard.html': 'Dashboard',
    '/films.html': 'Film',
    '/registi.html': 'Registi',
    '/cinemas.html': 'Cinema',
    '/proiezioni.html': 'Proiezioni',
    '/categorie.html': 'Categorie',
    '/sale.html': 'Sale',
    '/ricarica-credito.html': 'Ricarica Credito',
    '/validazione-biglietti.html': 'Validazione Biglietti',
    '/support-tickets.html': 'Support Tickets',
    '/promozioni.html': 'Promozioni',
    '/admin-utenti.html': 'Gestione Utenti',
    '/membership-admin.html': 'Membership',
    '/merch-admin.html': 'Merch Shop',
    '/corriere.html': 'Corriere',
    '/magazzino.html': 'Magazzino',
    '/admin-pacchi.html': 'Gestione Pacchi',
    '/feste-admin.html': 'Gestione Feste',
    '/rimborsi-admin.html': 'Gestione Rimborsi',
    '/food-admin.html': 'Food & Beverage'
  };

  function getUser() {
    if (typeof Auth === 'undefined' || !Auth || typeof Auth.getUser !== 'function') return null;
    return Auth.getUser();
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
  }

  function setActiveLinks() {
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll('[data-admin-link]').forEach((el) => {
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
    const userNameEl = document.getElementById('admin-user-name');
    const userAvatarEl = document.getElementById('admin-user-avatar');
    const userMenuNameEl = document.getElementById('admin-user-menu-name');

    if (userNameEl) userNameEl.textContent = user?.nome || user?.email || 'Utente';
    if (userMenuNameEl) userMenuNameEl.textContent = user?.email || '';
    if (userAvatarEl) {
      const first = (user?.nome || 'U').charAt(0);
      const second = (user?.cognome || 'N').charAt(0);
      userAvatarEl.textContent = `${first}${second}`.toUpperCase();
    }

    // Update console label based on role but show ALL links
    var consoleLabel = document.querySelector('#admin-shell-root .admin-console-label');
    if (consoleLabel) {
      var role = getNormalizedRole();
      if (role === 'corriere') consoleLabel.textContent = 'Area Corriere';
      else if (role === 'magazziniere') consoleLabel.textContent = 'Area Magazzino';
      else if (role === 'cinemastaff') consoleLabel.textContent = 'Area Staff Cinema';
    }
  }

  function getNormalizedRole() {
    var u = getUser();
    if (!u || !u.ruolo) return 'user';
    var r = String(u.ruolo).trim().toLowerCase();
    if (r === 'admin' || r === '2') return 'admin';
    if (r === 'poweruser' || r === '1') return 'poweruser';
    if (r === 'corriere' || r === '4') return 'corriere';
    if (r === 'magazziniere' || r === '5') return 'magazziniere';
    if (r === 'cinemastaff' || r === '3') return 'cinemastaff';
    return 'user';
  }

  function bindActions() {
    const sidebarToggle = document.getElementById('admin-sidebar-toggle');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    const userToggle = document.getElementById('admin-user-toggle');
    const userMenu = document.getElementById('admin-user-menu');
    const logoutBtn = document.getElementById('admin-logout-btn');

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
    const pageTitle = PAGE_TITLES[currentPath] || 'Area Admin';

    const shell = document.createElement('div');
    shell.innerHTML = `
      <div id="admin-shell-root" class="bg-brand-surface">
      <div id="admin-sidebar-backdrop" class="fixed inset-0 bg-black/60 z-40 hidden md:hidden"></div>
      <div class="flex w-full min-h-screen">
        <aside id="admin-sidebar" class="admin-sidebar w-64 flex-shrink-0 flex flex-col fixed md:relative inset-y-0 left-0 z-50 -translate-x-full md:translate-x-0 transition-transform duration-300 border-r border-brand-outline-variant/20">
          <div class="p-6">
            <a href="/index.html" class="flex flex-col items-center gap-2" style="color: rgb(168, 152, 136);">
              <img src="/assets/logo.png" alt="Cinema67" class="h-20 w-20 rounded-full object-cover border-2 border-brand-gold/40">
              <span class="font-serif text-base font-bold uppercase tracking-[0.2em] sidebar-text">Cinema67</span>
            </a>
          </div>
          <p class="admin-console-label px-6 pb-2 text-[10px] uppercase tracking-[0.24em] text-brand-gold">Admin console</p>
           <nav class="admin-sidebar-rail flex-1 px-4 space-y-1 overflow-y-auto min-h-0">
            <a data-admin-link href="/dashboard.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-gauge-high"></i>Dashboard</a>
            <a data-admin-link href="/films.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-film"></i>Film</a>
            <a data-admin-link href="/registi.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-user"></i>Registi</a>
            <a data-admin-link href="/cinemas.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-building"></i>Cinema</a>
            <a data-admin-link href="/proiezioni.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-clock"></i>Proiezioni</a>
            <a data-admin-link href="/categorie.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-tags"></i>Categorie</a>
            <div class="my-2 border-t border-brand-outline-variant/20"></div>
            <a data-admin-link href="/sale.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-chair"></i>Sale</a>
            <a data-admin-link href="/ricarica-credito.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-coins"></i>Ricarica Credito</a>
            <a data-admin-link href="/validazione-biglietti.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-qrcode"></i>Validazione</a>
             <a data-admin-link href="/support-tickets.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-headset"></i>Support Tickets</a>
             <a data-admin-link href="/promozioni.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-bullhorn"></i>Promozioni</a>
             <a data-admin-link href="/feste-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-calendar-days"></i>Feste</a>
             <a data-admin-link href="/rimborsi-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-undo"></i>Rimborsi</a>
             <a data-admin-link href="/food-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-utensils"></i>Food & Beverage</a>
             <a data-admin-link href="/merch-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-store"></i>Merch Shop</a>
             <a data-admin-link href="/admin-utenti.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-users-gear"></i>Gestione Utenti</a>
             <a data-admin-link href="/membership-admin.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-crown"></i>Membership</a>
             <div class="my-2 border-t border-brand-outline-variant/20"></div>
             <a data-admin-link href="/magazzino.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-boxes-packing"></i>Magazzino</a>
             <a data-admin-link href="/corriere.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-truck-fast"></i>Corriere</a>
             <a data-admin-link href="/admin-pacchi.html" class="flex items-center gap-3 px-4 py-3 rounded-xl"><i class="fa-solid fa-boxes-stacked"></i>Gestione Pacchi</a>
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
                <button id="admin-sidebar-toggle" class="md:hidden p-2 text-brand-on-surface hover:text-brand-gold" title="Apri menu" aria-label="Apri menu laterale">
                  <i class="fa-solid fa-bars text-xl"></i>
                </button>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.24em] text-brand-gold">Pannello operativo</p>
                  <h1 class="text-xl sm:text-2xl font-bold text-brand-on-surface">${pageTitle}</h1>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="relative">
                  <button id="admin-user-toggle" class="flex items-center gap-2 text-sm font-medium text-brand-on-surface">
                    <div id="admin-user-avatar" class="w-8 h-8 bg-brand-surface-container-highest rounded-full flex items-center justify-center text-brand-on-surface font-semibold">UN</div>
                    <span id="admin-user-name" class="hidden sm:inline">Utente</span>
                  </button>
                  <div id="admin-user-menu" class="hidden absolute right-0 mt-2 w-56 bg-brand-surface-container rounded-xl shadow-lg border border-brand-outline-variant/10 py-2">
                    <p id="admin-user-menu-name" class="px-4 py-2 text-xs text-brand-on-surface-variant"></p>
                    <a href="/profilo.html" class="block px-4 py-2 text-sm text-brand-on-surface hover:text-brand-gold hover:bg-brand-surface-container-high"><i class="fa-solid fa-user mr-2"></i>Profilo</a>
                    <a href="/profilo.html#prenotazioni" class="block px-4 py-2 text-sm text-brand-on-surface hover:text-brand-gold hover:bg-brand-surface-container-high"><i class="fa-solid fa-ticket mr-2"></i>Prenotazioni</a>
                    <hr class="my-1 border-brand-outline-variant/20">
                    <button id="admin-logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-brand-surface-container-high"><i class="fa-solid fa-sign-out-alt mr-2"></i>Logout</button>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div id="admin-shell-content" class="px-4 sm:px-6 lg:px-8 py-8"></div>
        </div>
      </div>
      </div>
    `;

    document.body.prepend(shell.firstElementChild);
    const target = document.getElementById('admin-shell-content');
    if (!target) return;
    main.className = '';
    target.appendChild(main);
  }

  function renderAdminShell() {
    const pathname = window.location.pathname.toLowerCase();
    if (!ADMIN_PATHS.has(pathname)) return;

    // Render admin shell for all elevated roles (sidebar filtered by role)
    var u = getUser();
    if (u && u.ruolo) {
      var r = String(u.ruolo).trim().toLowerCase();
      if (r === 'user' || r === '0') return;        // block normal users
      if (r === 'cinemastaff' || r === '3') return; // CinemaStaff uses staff-shell
    }

    if (document.getElementById('admin-shell-root')) return; // safety: already rendered
    if (document.getElementById('staff-shell-root')) return; // safety: staff-shell already rendered

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAdminShell);
  } else {
    renderAdminShell();
  }
})();
