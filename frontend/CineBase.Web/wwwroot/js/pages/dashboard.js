var cachedFilms = [];
var cachedCinemas = [];
var cachedRegisti = [];

function getUserRole() {
  try {
    if (typeof Auth !== 'undefined' && Auth && Auth.getUserRole) {
      var rawRole = String(Auth.getUserRole()).trim().toLowerCase();
      if (!rawRole || rawRole === 'undefined' || rawRole === 'unknown') return null;
      if (rawRole === 'cinemastaff' || rawRole === '3') return 'cinemastaff';
      if (rawRole === 'admin' || rawRole === '2') return 'admin';
      if (rawRole === 'poweruser' || rawRole === '1') return 'poweruser';
    }
  } catch(e) {}
  return null;
}

document.addEventListener('DOMContentLoaded', async function () {
  if (window.__dashboardLoaded) return;
  window.__dashboardLoaded = true;

  var role = getUserRole();
  if (!role) {
    if (typeof RouteGuard !== 'undefined' && RouteGuard.whenReady) {
      await RouteGuard.whenReady();
      role = getUserRole();
    }
  }

  try {
    if (role === 'cinemastaff') {
      await renderCinemaStaffDashboard();
      return;
    }

    if (role === 'admin' || role === 'poweruser') {
      var results = await Promise.all([
        API.getFilms(),
        API.getRegisti(),
        API.getCinemas(),
        API.getShows(),
        API.getSupportTickets({ status: 'Open', page: 1, pageSize: 100 }),
        API.getSupportTickets({ status: 'InProgress', page: 1, pageSize: 100 })
      ]);

      var films = normalizeCollection(results[0]);
      var registi = normalizeCollection(results[1]);
      var cinemas = normalizeCollection(results[2]);
      var shows = normalizeCollection(results[3]);
      var openTickets = normalizeCollection(results[4]);
      var inProgressTickets = normalizeCollection(results[5]);

      cachedFilms = films;
      cachedCinemas = cinemas;
      cachedRegisti = registi;

      document.getElementById('stat-movies').textContent = films.length;
      document.getElementById('stat-directors').textContent = registi.length;
      document.getElementById('stat-cinemas').textContent = cinemas.length;
      document.getElementById('stat-screenings').textContent = shows.length;
      var supportCountEl = document.getElementById('support-open-count');
      if (supportCountEl) supportCountEl.textContent = String(openTickets.length + inProgressTickets.length);

      renderUpcomingShows(shows);
      renderTopRegisti(registi);
      renderCinemaAnalytics(cinemas, shows);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
});

async function renderCinemaStaffDashboard() {
  try {
    var staffCinemas = await API.getStaffMyCinemas();
    var cinemaNames = [];
    if (staffCinemas && staffCinemas.length) {
      staffCinemas.forEach(function(a) {
        if (a && a.cinema) cinemaNames.push(a.cinema.nome);
      });
    }

    document.getElementById('stat-movies').textContent = cinemaNames.length || '0';
    document.getElementById('stat-directors').textContent = '—';
    document.getElementById('stat-cinemas').textContent = cinemaNames.length || '0';
    document.getElementById('stat-screenings').textContent = '—';

    var tbody = document.getElementById('upcoming-screenings');
    if (tbody) {
      if (cinemaNames.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4"><div class="space-y-2">' +
          cinemaNames.map(function(n) {
            return '<div class="cine-premium-card p-3 text-sm font-semibold text-brand-on-surface"><i class="fa-solid fa-location-dot text-brand-red mr-2"></i>' + escapeHtml(n) + '</div>';
          }).join('') + '</div></td></tr>';
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessun cinema assegnato</td></tr>';
      }
    }

    var heading = document.querySelector('.cine-curtain-delay-3 h2');
    if (heading) heading.innerHTML = '<i class="fa-solid fa-building text-brand-gold"></i> I Miei Cinema Assegnati';

    // Hide bottom panels
    var el = document.querySelector('#dashboard-registi');
    if (el) el.style.display = 'none';
    el = document.getElementById('dashboard-analytics-content');
    if (el && el.parentElement) el.parentElement.style.display = 'none';

  } catch(e) {
    console.error('Error loading staff cinemas:', e);
  }
}

function getDashboardFilmTitle(filmId) {
  var film = cachedFilms.find(function (f) { return Number(f.id) === Number(filmId); });
  return film ? film.titolo : 'ID ' + filmId;
}

function getDashboardCinemaName(cinemaId) {
  var cinema = cachedCinemas.find(function (c) { return Number(c.id) === Number(cinemaId); });
  return cinema ? cinema.nome : 'ID ' + cinemaId;
}

function renderUpcomingShows(shows) {
  var tbody = document.getElementById('upcoming-screenings');
  if (!shows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-brand-on-surface-variant">Nessuno show in programma</td></tr>';
    return;
  }
  var now = new Date();
  tbody.innerHTML = shows.slice(0, 5).map(function (s) {
    var showDate = null;
    if (s.startAtUtc) showDate = new Date(s.startAtUtc);
    var isPast = showDate && showDate < now;
    var statusClass = isPast ? 'chip-past' : 'chip-active';
    var statusText = isPast ? 'Passato' : 'In programma';
    var formattedDate = showDate ? formatDate(s.startAtUtc) : '-';
    var formattedTime = showDate ? formatTime(s.startAtUtc) : '-';
    var filmTitle = escapeHtml(s.filmTitolo || getDashboardFilmTitle(s.filmId));
    var cinemaNome = escapeHtml(s.cinemaNome || getDashboardCinemaName(s.cinemaId));
    return '<tr class="row-hover"><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant font-mono">#' + s.id + '</td><td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-on-surface">' + filmTitle + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface">' + cinemaNome + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + formattedDate + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-brand-on-surface-variant">' + formattedTime + '</td><td class="px-6 py-4 whitespace-nowrap"><span class="chip-status ' + statusClass + '">' + statusText + '</span></td></tr>';
  }).join('');
}

function renderTopRegisti(registi) {
  var host = document.getElementById('dashboard-registi-content');
  if (!host) return;
  var top = registi.slice(0, 5);
  if (!top.length) { host.innerHTML = '<p class="text-sm text-brand-on-surface-variant">Nessun regista nel catalogo.</p>'; return; }
  host.innerHTML = top.map(function (r, i) {
    return '<div class="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-surface-container/50 transition-colors"><span class="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-xs font-bold text-brand-gold">' + (i + 1) + '</span><div><p class="text-sm font-medium text-brand-on-surface">' + escapeHtml(r.nome + ' ' + r.cognome) + '</p><p class="text-xs text-brand-on-surface-variant">' + escapeHtml(r.nazionalita || '—') + '</p></div></div>';
  }).join('');
}

function renderCinemaAnalytics(cinemas, shows) {
  var host = document.getElementById('dashboard-analytics-content');
  if (!host) return;
  var cinemaShowCount = {};
  shows.forEach(function (s) { var cid = s.cinemaId; cinemaShowCount[cid] = (cinemaShowCount[cid] || 0) + 1; });
  var data = cinemas.map(function (c) { return { nome: c.nome, count: cinemaShowCount[c.id] || 0 }; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
  if (!data.length) { host.innerHTML = '<p class="text-sm text-brand-on-surface-variant">Nessuna programmazione disponibile.</p>'; return; }
  var max = data[0].count || 1;
  host.innerHTML = data.map(function (d) {
    var pct = Math.round((d.count / max) * 100);
    return '<div class="mb-3"><div class="flex justify-between text-sm mb-1"><span class="text-brand-on-surface font-medium">' + escapeHtml(d.nome) + '</span><span class="text-brand-gold font-bold">' + d.count + '</span></div><div class="h-2 rounded-full bg-brand-surface-container overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-brand-red to-brand-gold transition-all duration-700" style="width:' + pct + '%"></div></div></div>';
  }).join('');
}
