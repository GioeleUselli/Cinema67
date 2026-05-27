// Home Page JavaScript
let featuredInterval;
let currentFeaturedIndex = 0;
let featuredEntries = [];
var allPromos = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupScrollReveal();
  const params = new URLSearchParams(window.location.search);
  if (params.get("forbidden") === "true") {
    showToast("Non hai i permessi per accedere all'area admin", "warning");
  }
  await loadFeaturedFilms();
  loadPromotionsBanners();
  
  // Load recommended films if user is logged in
  if (typeof Auth !== 'undefined' && Auth?.isLoggedIn?.()) {
    loadRecommendedFilms();
  }
});

async function loadPromotionsBanners() {
  var container = document.getElementById('promo-banners');
  if (!container) return;
  try {
    var promos = await API.getPromotionsActive();
    allPromos = promos || [];
    if (!promos || !promos.length) {
      container.innerHTML = '<p class="text-sm text-brand-on-surface-variant col-span-full text-center">Nessuna promozione attiva al momento.</p>';
      return;
    }
    var typeLabels = { MoviePromo: 'Promo Film', FoodBundle: 'Combo Cibo', GeneralAd: 'Pubblicità', Event: 'Evento', Discount: 'Sconto' };
    container.innerHTML = promos.map(function (p) {
      var bg = getPromoBannerImage(p);
      var discountInfo = '';
      if (p.discountPercent) {
        discountInfo = '<span class="promo-card-price">-' + p.discountPercent + '%</span>';
      } else if (p.price) {
        discountInfo = '<span class="promo-card-price">' + formatCurrency(p.price) + '</span>';
      }
      return '<div class="promo-card" style="' + bg + '" onclick="openPromoDetail(' + p.id + ')">' +
        '<div class="promo-card-inner">' +
          '<span class="promo-card-tag">' + (typeLabels[p.type] || p.type) + '</span>' +
          '<div class="promo-card-logo">CINEMA67</div>' +
          '<p class="promo-card-title">' + escapeHtml(p.title) + '</p>' +
          '<p class="promo-card-desc">' + escapeHtml(p.description) + '</p>' +
          discountInfo +
          '<span class="promo-card-watermark">' + getPromoIcon(p.type) + '</span>' +
        '</div></div>';
    }).join('');

    var reel = container;
    var prev = document.getElementById('promo-prev');
    var next = document.getElementById('promo-next');
    if (prev) prev.onclick = function() { reel.scrollBy({ left: -320, behavior: 'smooth' }); };
    if (next) next.onclick = function() { reel.scrollBy({ left: 320, behavior: 'smooth' }); };
  } catch (e) { console.error('Promo load error:', e); }
}

window.openPromoDetail = function(promoId) {
  var promo = allPromos.find(function(p) { return p.id === promoId; });
  if (!promo) return;
  var overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4';
  overlay.style.animation = 'fadeIn 0.3s ease';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  var hasDiscount = promo.discountPercent && promo.discountCode;
  var usageInfo = promo.maxUsage ? (promo.maxUsage - promo.usageCount) + ' utilizzi rimasti' : 'Illimitato';
  
  overlay.innerHTML =
    '<div class="cine-premium-card p-8 w-full max-w-[480px] relative overflow-hidden text-center" style="animation: fadeIn 0.4s ease 0.15s both">' +
      '<div class="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-gold/8 blur-3xl pointer-events-none"></div>' +
      '<button onclick="this.closest(\'.fixed\').remove()" class="absolute top-3 right-3 text-brand-on-surface-variant hover:text-brand-on-surface p-1"><i class="fa-solid fa-xmark"></i></button>' +
      '<span class="text-xs uppercase tracking-[0.2em] text-brand-gold font-bold mb-2 block">' + (promo.type === 'Discount' ? 'Sconto' : 'Promozione') + '</span>' +
      '<h3 class="font-serif text-2xl font-bold text-brand-on-surface mb-3">' + escapeHtml(promo.title) + '</h3>' +
      '<p class="text-sm text-brand-on-surface-variant mb-4">' + escapeHtml(promo.description) + '</p>' +
      (hasDiscount ? 
        '<div class="bg-brand-surface-container/50 rounded-xl p-4 mb-4">' +
          '<p class="text-xs text-brand-on-surface-variant mb-2">CODICE SCONTO</p>' +
          '<p class="text-2xl font-bold text-brand-gold font-mono tracking-wider">' + promo.discountCode + '</p>' +
          '<p class="text-lg font-bold text-brand-on-surface font-serif mt-2">-' + promo.discountPercent + '%</p>' +
          '<button onclick="copyPromoCode(\'' + promo.discountCode + '\')" class="btn-gold text-sm mt-3 px-4 py-2"><i class="fa-solid fa-copy mr-1.5"></i> Copia Codice</button>' +
        '</div>' :
        (promo.price ? '<p class="text-2xl font-bold text-brand-gold font-serif mb-4">' + formatCurrency(promo.price) + '</p>' : '')
      ) +
      (promo.linkUrl ? '<a href="' + promo.linkUrl + '" class="btn-outline-brand text-xs inline-block mt-2">Scopri di più</a>' : '') +
      '<p class="text-xs text-brand-on-surface-variant mt-4">' + usageInfo + '</p>' +
    '</div>';

  document.body.appendChild(overlay);
};

window.copyPromoCode = function(code) {
  navigator.clipboard.writeText(code).then(function() { showToast('Codice copiato! Usalo al checkout.', 'success'); });
};

function getPromoIcon(type) {
  var map = { MoviePromo: '🎬', FoodBundle: '🍿', GeneralAd: '📢', Event: '🎪', Discount: '🏷️' };
  return map[type] || '✨';
}

function getPromoBannerImage(promo) {
  var palettes = {
    MoviePromo:   'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #1c1108 100%)',
    FoodBundle:   'linear-gradient(135deg, #7f1d1d 0%, #b8860b 50%, #1c1108 100%)',
    GeneralAd:    'linear-gradient(135deg, #1c1108 0%, #b91c1c 50%, #7f1d1d 100%)',
    Event:        'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #b8860b 100%)',
    Discount:     'linear-gradient(135deg, #b8860b 0%, #1c1108 50%, #b91c1c 100%)'
  };
  if (promo.imagePath) {
    return 'background:linear-gradient(135deg, rgba(20,16,12,0.75), rgba(20,16,12,0.4)),url(' + promo.imagePath + ') center/cover';
  }
  return 'background:' + (palettes[promo.type] || palettes.GeneralAd);
}

async function loadFeaturedFilms() {
  const featuredGrid = document.getElementById("featured-grid");
  if (!featuredGrid) return;
  try {
    const [filmsResponse, proiezioniResponse] = await Promise.all([
      API.getFilms({ page: 1, pageSize: 100 }),
      API.getProiezioni()
    ]);
    const films = Array.isArray(filmsResponse) ? filmsResponse : Array.isArray(filmsResponse?.items) ? filmsResponse.items : Array.isArray(filmsResponse?.$values) ? filmsResponse.$values : [];
    const proiezioni = Array.isArray(proiezioniResponse) ? proiezioniResponse : Array.isArray(proiezioniResponse?.items) ? proiezioniResponse.items : Array.isArray(proiezioniResponse?.$values) ? proiezioniResponse.$values : [];
    const featured = buildFeaturedSelection(films, proiezioni);
    initFeaturedFilms(featured);
  } catch (error) {
    handleApiError(error);
    featuredGrid.innerHTML = '<p class="text-brand-on-surface col-span-full text-center">Errore nel caricamento dei film in evidenza</p>';
  }
}

function buildFeaturedSelection(films, proiezioni) {
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const upcoming = proiezioni.filter((p) => { const date = new Date(p.data || p.ora); return Number.isFinite(date.getTime()) && date >= new Date() && date <= next7Days; });
  const countByFilm = new Map();
  upcoming.forEach((p) => { const filmId = Number(p.filmId); countByFilm.set(filmId, (countByFilm.get(filmId) || 0) + 1); });
  const filmsWithScore = films.map((film) => ({ film, score: countByFilm.get(Number(film.id)) || 0, releaseDate: new Date(film.dataProduzione || 0) })).sort((a, b) => { if (b.score !== a.score) return b.score - a.score; return b.releaseDate - a.releaseDate; });
  return filmsWithScore.slice(0, 5);
}

function getCoverImage(copertinaPath) {
  if (!copertinaPath) return "/assets/images/defaults/cover-default.jpg";
  if (copertinaPath.startsWith("/media/")) return `http://localhost:5000${copertinaPath}`;
  if (!copertinaPath.includes("/") && !copertinaPath.startsWith("http")) return `http://localhost:5000/media/${copertinaPath}`;
  if (copertinaPath.startsWith("http")) return copertinaPath;
  return "/assets/images/defaults/cover-default.jpg";
}

function getDirectorName(film) {
  const flatName = [film?.registaNome, film?.registaCognome].filter(Boolean).join(" ").trim();
  if (flatName) return flatName;
  const nestedName = [film?.regista?.nome, film?.regista?.cognome].filter(Boolean).join(" ").trim();
  return nestedName || "Regista sconosciuto";
}

function initFeaturedFilms(entries) {
  featuredEntries = entries;
  if (!featuredEntries.length) { const featuredGrid = document.getElementById("featured-grid"); featuredGrid.innerHTML = '<p class="text-brand-on-surface col-span-full text-center">Nessun film disponibile</p>'; return; }
  updateFeaturedDisplay(0);
  if (featuredInterval) clearInterval(featuredInterval);
  if (featuredEntries.length > 1) { featuredInterval = setInterval(() => { currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredEntries.length; updateFeaturedDisplay(currentFeaturedIndex); }, 6000); }
}

window.setActiveFeatured = function (index) {
  if (featuredInterval) clearInterval(featuredInterval);
  currentFeaturedIndex = index;
  updateFeaturedDisplay(currentFeaturedIndex);
  if (featuredEntries.length > 1) { featuredInterval = setInterval(() => { currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredEntries.length; updateFeaturedDisplay(currentFeaturedIndex); }, 6000); }
};

window.addEventListener("resize", () => { if (!featuredEntries.length) return; updateFeaturedDisplay(currentFeaturedIndex); });

function updateFeaturedDisplay(activeIndex) {
  const featuredGrid = document.getElementById("featured-grid");
  if (!featuredGrid) return;
  const heroEntry = featuredEntries[activeIndex];
  const sideEntries = featuredEntries.filter((_, idx) => idx !== activeIndex);
  featuredGrid.innerHTML = `${renderHeroCard(heroEntry.film, heroEntry.score)}<div class="lg:col-span-1 flex flex-col gap-4 lg:gap-[18px] h-full">${sideEntries.map((entry, idx) => { const originalIndex = featuredEntries.indexOf(entry); return renderCompactCard(entry.film, entry.score, originalIndex); }).join("")}</div>`;
}

function renderHeroCard(film, score) {
  const badge = score > 0 ? "Top della Settimana" : "Nuovo Arrivo";
  const subBadge = score > 0 ? `${score} proiezioni` : "";
  const categorie = film.categorie || [];
  const badgeHtml = categorie.length ? categorie.map(c => `<span class="bg-brand-surface/80 backdrop-blur-sm text-brand-on-surface text-xs px-2 py-0.5 rounded">${c.nome}</span>`).join('') : `<span class="bg-brand-gold text-xs font-bold px-2 py-1 rounded">${film.genere || "Film"}</span>`;
  const isLoggedIn = typeof Auth !== 'undefined' && Auth?.isLoggedIn?.() || false;
  const cta = isLoggedIn ? `<a href="/programmazione.html" class="btn-gold shadow-lg transform transition-transform hover:scale-105">Vai alla Programmazione</a>` : `<a href="/programmazione.html" class="btn-outline-brand-light transform transition-transform hover:scale-105 backdrop-blur-sm">Scopri Orari</a>`;
  return `<div class="card-elevated overflow-hidden group transition-all lg:col-span-2 relative w-full max-w-full h-[118vw] min-h-[420px] max-h-[780px] lg:h-[930px] lg:max-h-none rounded-xl animate-fade-in"><div class="absolute inset-0 bg-slate-950"><img src="${getCoverImage(film.copertinaPath)}" alt="${film.titolo}" class="w-full h-full object-contain sm:object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"><div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent lg:via-transparent lg:bg-gradient-to-r lg:from-gray-950 lg:to-transparent opacity-50"></div><div class="absolute inset-0 bg-gradient-to-t from-gray-950/50 via-gray-950/20 to-transparent opacity-40"></div></div><div class="absolute top-4 left-4 right-4 flex items-center justify-between z-10"><span class="bg-brand-gold text-sm font-bold px-3 py-1 rounded shadow-md text-brand-dark">${badge}</span>${subBadge ? `<span class="bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded border border-white/10">${subBadge}</span>` : ""}</div><div class="absolute bottom-0 left-0 right-0 p-6 lg:p-10 z-10 flex flex-col justify-end h-full"><div class="flex flex-wrap gap-2 mb-3">${badgeHtml}</div><h3 class="text-white font-bold text-3xl lg:text-5xl mb-3 drop-shadow-xl leading-tight line-clamp-2">${film.titolo}</h3><p class="text-gray-100 text-xl mb-6 flex items-center gap-4 font-medium drop-shadow-lg"><span><i class="fa-solid fa-video mr-2 text-brand-gold"></i>${getDirectorName(film)}</span>${film.durata ? `<span><i class="fa-regular fa-clock mr-1"></i>${film.durata} min</span>` : ""}</p><div class="flex">${cta}</div></div></div>`;
}

function renderCompactCard(film, score, originalIndex) {
  const badge = score > 0 ? "In Programmazione" : "Novità";
  return `<div class="card-elevated flex overflow-hidden group transition-all hover:ring-2 hover:ring-brand-gold/70 cursor-pointer animate-fade-in bg-brand-surface h-[180px] sm:h-[198px] lg:h-[213px]" onclick="setActiveFeatured(${originalIndex})"><div class="w-[28%] lg:w-[32%] bg-slate-800 relative overflow-hidden flex-shrink-0"><img src="${getCoverImage(film.copertinaPath)}" alt="${film.titolo}" class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"></div><div class="p-3 lg:p-4 flex flex-col justify-center flex-1 overflow-hidden lg:justify-between"><div class="flex justify-between items-start mb-1 lg:mb-2"><span class="text-[10px] lg:text-[11px] uppercase tracking-wider text-brand-gold font-bold truncate pr-1">${badge}</span>${score > 0 ? `<span class="text-[10px] lg:text-[11px] text-brand-on-surface-variant font-medium flex-shrink-0"><i class="fa-solid fa-calendar-day mr-1"></i>${score}</span>` : ""}</div><h3 class="text-brand-on-surface font-bold text-sm sm:text-base lg:text-[1.1rem] mb-1 line-clamp-2 group-hover:text-brand-gold transition-colors leading-tight">${film.titolo}</h3><p class="text-brand-on-surface-variant text-xs lg:text-[13px] font-medium truncate mt-auto"><i class="fa-solid fa-video text-[10px] mr-1 opacity-70"></i> ${getDirectorName(film)}</p></div></div>`;
}

window.handlePrenotaFilm = function(filmId) { window.location.href = `/programmazione.html`; };

function setupScrollReveal() {
  var sections = document.querySelectorAll('#promo-section, #featured .cine-section-kicker, #featured .cine-section-title, #featured .cine-info-card, #featured-grid');
  var observer = new IntersectionObserver(function(entries) { entries.forEach(function(entry) { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; observer.unobserve(entry.target); } }); }, { threshold: 0.1 });
  sections.forEach(function(el) { el.style.opacity = '0'; el.style.transform = 'translateY(30px)'; el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; observer.observe(el); });
}

async function loadRecommendedFilms() {
  const recommendedSection = document.getElementById('recommended-section');
  const recommendedGrid = document.getElementById('recommended-grid');
  if (!recommendedSection || !recommendedGrid) return;

  try {
    // Fetch recommended films from backend endpoint
    const response = await fetch('/profilo/raccomandati', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Auth?.getToken?.() || localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not logged in or session expired
        recommendedSection.classList.add('hidden');
        return;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const films = await response.json();

    if (!films || films.length === 0) {
      // No recommendations available
      recommendedSection.classList.add('hidden');
      return;
    }

    // Show the recommended section
    recommendedSection.classList.remove('hidden');

    // Render the recommended films
    recommendedGrid.innerHTML = films.map(film => renderRecommendedCard(film)).join('');
  } catch (error) {
    console.error('Error loading recommended films:', error);
    recommendedSection.classList.add('hidden');
  }
}

function renderRecommendedCard(film) {
  const categorie = film.categorie || [];
  const badgeHtml = categorie.length 
    ? categorie.slice(0, 2).map(c => `<span class="text-[10px] uppercase tracking-wider text-brand-gold font-bold">${c.nome}</span>`).join('')
    : '<span class="text-[10px] uppercase tracking-wider text-brand-gold font-bold">Film</span>';
  
  return `
    <a href="/programmazione.html" class="card-elevated overflow-hidden group transition-all hover:ring-2 hover:ring-brand-gold/70 cursor-pointer animate-fade-in bg-brand-surface">
      <div class="relative overflow-hidden bg-slate-800 aspect-[2/3]">
        <img src="${getCoverImage(film.copertinaPath)}" alt="${film.titolo}" class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p class="text-white text-xs font-medium truncate"><i class="fa-solid fa-video mr-1 text-brand-gold"></i> ${getDirectorName(film)}</p>
        </div>
      </div>
      <div class="p-3">
        <div class="flex flex-wrap gap-1 mb-2">
          ${badgeHtml}
        </div>
        <h3 class="text-brand-on-surface font-bold text-sm mb-1 line-clamp-2 group-hover:text-brand-gold transition-colors">${film.titolo}</h3>
        <p class="text-brand-on-surface-variant text-xs truncate">${film.durata ? film.durata + ' min' : 'Film'}</p>
      </div>
    </a>
  `;
}
