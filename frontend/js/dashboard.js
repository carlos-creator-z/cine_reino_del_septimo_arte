'use strict';

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let allMovies      = [];
let activeFilter   = 'all';
let ticketQty      = 1;
let selectedMovieId   = null;
let selectedSchedule  = null;
let selectedSeats     = [];

const UNIT_PRICE = 25000;
const SEAT_ROWS  = 4;
const SEAT_COLS  = 8;


/* ============================================================
   UTILIDADES GENERALES
   ============================================================ */

/** Muestra una notificación tipo toast durante `d` milisegundos. */
function showToast(msg, d = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), d);
}

/** Genera un SVG de respaldo cuando no hay póster disponible. */
function fallbackPoster(title) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750">
    <rect width="500" height="750" fill="#1d1913"/>
    <text x="250" y="375" fill="#ffd45a" font-size="30" text-anchor="middle">${title}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

/** Clona el contenido de un <template> por su id. */
function cloneTpl(id) {
  return document.getElementById(id).content.cloneNode(true);
}


/* ============================================================
   AUTENTICACIÓN Y UI DE USUARIO
   ============================================================ */

/** Actualiza la barra superior y el sidebar según el estado de sesión. */
function updateAuthUI() {
  const user      = getUser();
  const topbarAuth  = document.getElementById('topbarAuth');
  const sidebarAuth = document.getElementById('sidebarAuth');

  if (user) {
    _renderLoggedInTopbar(topbarAuth, user);
    _renderLoggedInSidebar(sidebarAuth, user);

    document.getElementById('memberName').textContent   = user.name;
    document.getElementById('memberPoints').textContent = user.points.toLocaleString() + ' puntos';
    document.getElementById('memberBtn').textContent    = 'Renovar ahora';
  } else {
    _renderLoggedOutTopbar(topbarAuth);
    _renderLoggedOutSidebar(sidebarAuth);

    document.getElementById('memberName').textContent   = 'Inicia sesion';
    document.getElementById('memberPoints').textContent = '— puntos';
    document.getElementById('memberBtn').textContent    = 'Iniciar sesion';
  }
}

function _renderLoggedInTopbar(container, user) {
  container.textContent = '';

  const span  = document.createElement('span');
  span.className = 'topbar-user';
  span.innerHTML = `<span>♛ ${user.name}</span>`;

  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.textContent = 'Salir';
  btn.onclick   = logout;

  span.appendChild(btn);
  container.appendChild(span);
}

function _renderLoggedOutTopbar(container) {
  container.textContent = '';

  const btn = document.createElement('button');
  btn.type        = 'button';
  btn.className   = 'login-button';
  btn.textContent = 'Iniciar sesion';
  btn.onclick     = () => window.location.href = '/login.html';

  container.appendChild(btn);
}

function _renderLoggedInSidebar(container, user) {
  container.textContent = '';

  const div = document.createElement('div');
  div.className = 'sidebar-auth-info';
  div.innerHTML = `<strong>♛ ${user.name}</strong><span>${user.points} pts</span>`;

  const logoutBtn = document.createElement('button');
  logoutBtn.type        = 'button';
  logoutBtn.className   = 'sidebar-auth-btn';
  logoutBtn.textContent = 'Cerrar sesion';
  logoutBtn.onclick     = logout;
  div.appendChild(logoutBtn);

  if (user.role === 'admin') {
    const adminLink = document.createElement('a');
    adminLink.href          = '/admin.html';
    adminLink.className     = 'sidebar-auth-btn';
    adminLink.style.marginTop = '8px';
    adminLink.textContent   = 'Panel Admin';
    div.appendChild(adminLink);
  }

  container.appendChild(div);
}

function _renderLoggedOutSidebar(container) {
  container.textContent = '';

  const btn = document.createElement('button');
  btn.type        = 'button';
  btn.className   = 'sidebar-auth-btn';
  btn.textContent = 'Iniciar sesion';
  btn.onclick     = () => window.location.href = '/login.html';

  container.appendChild(btn);
}


/* ============================================================
   CARGA DE DATOS DESDE LA API
   ============================================================ */

/** Carga las ciudades disponibles en el selector. */
async function loadCities() {
  try {
    const cities = await api('/api/cities');
    if (!cities) return;

    const select = document.getElementById('citySelect');
    select.textContent = '';

    cities.forEach(city => {
      const option        = document.createElement('option');
      option.value        = city.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');
      option.textContent  = city;
      if (city === 'Bogota') option.selected = true;
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Error al cargar ciudades:', e);
  }
}

/** Carga todas las películas y las renderiza. */
async function loadMovies() {
  try {
    allMovies = await api('/api/movies');
    if (allMovies) renderMovies();
  } catch (e) {
    console.error('Error al cargar películas:', e);
  }
}

/** Carga y renderiza las películas próximas a estrenar. */
async function loadComingSoon() {
  try {
    const items = await api('/api/coming-soon');
    if (!items) return;

    const grid = document.getElementById('comingGrid');
    grid.textContent = '';

    items.forEach(item => {
      const card = cloneTpl('tplPosterCard');

      const img      = card.querySelector('.poster-frame img');
      img.src        = item.poster || fallbackPoster(item.title);
      img.alt        = item.title;
      img.onerror    = function () { this.onerror = null; this.src = fallbackPoster(item.title); };

      card.querySelector('.poster-title').textContent = item.title;
      card.querySelector('.poster-genre').textContent = item.genre;
      card.querySelector('.poster-date').textContent  = 'Estreno: ' + item.release_date;

      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Error al cargar próximos estrenos:', e);
  }
}

/** Carga y renderiza los productos de la tienda de alimentos. */
async function loadFoods() {
  try {
    const foods = await api('/api/foods');
    if (!foods) return;

    document.getElementById('foodCount').textContent = foods.length.toString().padStart(2, '0');

    const grid = document.getElementById('foodGrid');
    grid.textContent = '';

    foods.forEach(food => {
      const card = cloneTpl('tplFoodCard');

      const img   = card.querySelector('.food-card img');
      img.src     = food.image || '';
      img.alt     = food.name;

      card.querySelector('.food-name').textContent  = food.name;
      card.querySelector('.food-desc').textContent  = food.description || '';
      card.querySelector('.food-price').textContent = '$' + food.price.toLocaleString();

      card.querySelector('.food-card button').addEventListener('click', () => {
        if (!isLoggedIn()) { showToast('Inicia sesion primero'); return; }
        showToast('Agregado (demo)');
      });

      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Error al cargar alimentos:', e);
  }
}

/** Carga y renderiza las sedes filtradas por ciudad. */
async function loadVenues() {
  try {
    const city   = document.getElementById('citySelect').value;
    const venues = await api('/api/venues?city=' + city);
    if (!venues) return;

    const goldCount = venues.filter(v => v.services && v.services.toLowerCase().includes('gold')).length;
    document.getElementById('goldCount').textContent = goldCount.toString().padStart(2, '0');

    const list = document.getElementById('venueList');
    list.textContent = '';

    venues.forEach(venue => {
      const item = cloneTpl('tplVenueItem');
      item.querySelector('.venue-name').textContent     = venue.name;
      item.querySelector('.venue-address').textContent  = venue.address;
      item.querySelector('.venue-services').textContent = venue.services;
      list.appendChild(item);
    });
  } catch (e) {
    console.error('Error al cargar sedes:', e);
  }
}


/* ============================================================
   HISTORIAL DE COMPRAS
   ============================================================ */

/** Carga y renderiza el historial de compras del usuario autenticado. */
async function loadPurchaseHistory() {
  const section = document.getElementById('mis-compras');
  const grid    = document.getElementById('purchasesGrid');
  const user    = getUser();

  if (!user) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  grid.textContent = '';

  try {
    const purchases = await api('/api/sales/mis-compras');

    if (purchases.length === 0) {
      grid.innerHTML = '<p class="purchase-empty-msg">Aún no has realizado ninguna compra. ¡Explora la cartelera!</p>';
      return;
    }

    purchases.forEach(purchase => {
      const card = cloneTpl('tplPurchaseCard');

      const movieTitle  = purchase.movie?.title  || 'Película no disponible';
      const moviePoster = purchase.movie?.poster || fallbackPoster(movieTitle);
      const fecha       = new Date(purchase.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      const asientos    = purchase.seats?.length > 0 ? purchase.seats.join(', ') : 'General';

      const img   = card.querySelector('.purchase-card img');
      img.src     = moviePoster;
      img.alt     = movieTitle;
      img.onerror = function () { this.onerror = null; this.src = fallbackPoster(movieTitle); };

      card.querySelector('.purchase-movie').textContent   = movieTitle;
      card.querySelector('.purchase-meta').innerHTML      =
        `<strong>Fecha:</strong> ${fecha} &nbsp;|&nbsp; <strong>Horario:</strong> ${purchase.schedule}`;
      card.querySelector('.purchase-seats').innerHTML     =
        `<strong>Asientos:</strong> ${asientos}`;
      card.querySelector('.purchase-total').textContent   = '$' + purchase.total_price.toLocaleString();
      
      const statusSpan       = card.querySelector('.purchase-status');
      statusSpan.textContent = purchase.status === 'confirmed' ? 'Confirmada' : purchase.status;
      statusSpan.className   = 'purchase-status status-' + purchase.status;

      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Error al cargar compras:', e);
    grid.innerHTML = '<p class="purchase-empty-msg" style="color:var(--danger)">Error al cargar tu historial.</p>';
  }
}

/** Refresca el historial inmediatamente después de una compra. */
function refreshHistory() {
  loadPurchaseHistory();
}


/* ============================================================
   RENDERIZADO DE PELÍCULAS
   ============================================================ */

/** Filtra y renderiza las tarjetas de películas según búsqueda y categoría activa. */
function renderMovies() {
  const query   = document.getElementById('movieSearch').value.trim().toLowerCase();
  const filtered = allMovies.filter(movie => {
    const matchesFilter = activeFilter === 'all' || movie.category === activeFilter;
    const matchesSearch = (movie.title + ' ' + movie.genre + ' ' + movie.status)
      .toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  document.getElementById('activeMovies').textContent = filtered.length.toString().padStart(2, '0');

  const grid = document.getElementById('movieGrid');
  grid.textContent = '';

  if (!filtered.length) {
    const empty = document.createElement('article');
    empty.className  = 'empty-card';
    empty.innerHTML  = '<h3>No hay peliculas</h3><p>Prueba con otro filtro.</p>';
    grid.appendChild(empty);
    return;
  }

  filtered.forEach(movie => {
    const card = cloneTpl('tplMovieCard');

    const img   = card.querySelector('.poster-frame img');
    img.src     = movie.poster || fallbackPoster(movie.title);
    img.alt     = movie.title;
    img.onerror = function () { this.onerror = null; this.src = fallbackPoster(movie.title); };

    card.querySelector('.poster-frame figcaption').textContent = movie.status;
    card.querySelector('.movie-genre').textContent  = movie.status + ' - ' + movie.genre;
    card.querySelector('.movie-title').textContent  = movie.title;
    card.querySelector('.movie-desc').textContent   = movie.description || '';
    card.querySelector('.movie-meta').textContent   = movie.rating + ' | ' + movie.release_date;

    card.querySelector('.schedule-button').addEventListener('click', () => openMovieDetail(movie._id));

    grid.appendChild(card);
  });
}


/* ============================================================
   MODAL DE DETALLE DE PELÍCULA
   ============================================================ */

/** Abre el modal con la información completa de una película. */
function openMovieDetail(id) {
  const movie = allMovies.find(m => m._id === id);
  if (!movie) return;

  // Hero con póster de fondo
  document.getElementById('detailHero').style.backgroundImage =
    `linear-gradient(90deg,rgba(8,7,6,0.92),rgba(8,7,6,0.35)),url('${movie.poster}')`;

  // Datos principales
  document.getElementById('detailRating').textContent  = movie.rating;
  document.getElementById('detailTitle').textContent   = movie.title;
  document.getElementById('detailGenre').textContent   = movie.genre;
  document.getElementById('detailDirector').textContent = movie.director || '';
  document.getElementById('detailDuration').textContent = movie.duration || '';
  document.getElementById('detailActors').textContent  = movie.actors || '';
  document.getElementById('detailDate').textContent    = movie.release_date;
  document.getElementById('detailSynopsis').textContent = movie.synopsis || '';
  document.getElementById('detailScheduleCity').textContent =
    'Hoy en ' + document.getElementById('currentCity').textContent;

  // Póster
  const poster   = document.getElementById('detailPoster');
  poster.src     = movie.poster || fallbackPoster(movie.title);
  poster.alt     = movie.title;
  poster.onerror = function () { this.onerror = null; this.src = fallbackPoster(movie.title); };

  // Formatos disponibles
  const formatsContainer = document.getElementById('detailFormats');
  formatsContainer.textContent = '';
  (movie.formats || []).forEach(format => {
    const tag       = document.createElement('span');
    tag.className   = 'format-tag';
    tag.textContent = format;
    formatsContainer.appendChild(tag);
  });

  // Horarios disponibles
  const timesContainer = document.getElementById('detailTimes');
  timesContainer.textContent = '';
  (movie.schedules || []).forEach((schedule, index) => {
    const btn       = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'time-card';
    btn.innerHTML   = `<strong>${schedule}</strong><span>Sala ${index % 2 === 0 ? '5' : '1'}</span>`;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-card').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      openPurchaseModal(movie._id, schedule);
    });

    timesContainer.appendChild(btn);
  });

  // Botón de tráiler
  document.getElementById('trailerButton').onclick = () => {
    if (movie.trailer) window.open(movie.trailer, '_blank');
  };

  document.getElementById('movieModal').classList.add('open');
  document.body.classList.add('modal-open');
}

/** Cierra el modal de detalle de película. */
function closeMovieModal() {
  document.getElementById('movieModal').classList.remove('open');
  document.body.classList.remove('modal-open');
}


/* ============================================================
   SISTEMA DE ASIENTOS
   ============================================================ */

/** Genera el mapa de asientos consultando los ocupados en la BD. */
async function generateSeatMap() {
  const grid = document.getElementById('seatGrid');
  grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">Cargando asientos...</p>';
  selectedSeats = [];

  try {
    const occupiedSeats = await api(
      `/api/sales/seats?movieId=${selectedMovieId}&schedule=${encodeURIComponent(selectedSchedule)}`
    );

    grid.innerHTML = '';

    for (let row = 0; row < SEAT_ROWS; row++) {
      for (let col = 1; col <= SEAT_COLS; col++) {
        const seatId  = `${String.fromCharCode(65 + row)}${col}`;
        const btn     = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'seat';
        btn.textContent = seatId;

        if (occupiedSeats.includes(seatId)) {
          btn.classList.add('unavailable');
        } else {
          btn.addEventListener('click', () => toggleSeatSelection(seatId, btn));
        }

        grid.appendChild(btn);
      }
    }
  } catch (err) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Error al cargar asientos</p>';
  }
}

/** Alterna la selección de un asiento individual. */
function toggleSeatSelection(seatId, btn) {
  const index = selectedSeats.indexOf(seatId);

  if (index > -1) {
    selectedSeats.splice(index, 1);
    btn.classList.remove('selected');
  } else {
    if (selectedSeats.length >= 10) {
      showToast('⚠️ Máximo 10 asientos por compra', 3000);
      return;
    }
    selectedSeats.push(seatId);
    btn.classList.add('selected');
  }

  updatePurchaseTotal();
}

/** Recalcula y muestra el total según los asientos seleccionados. */
function updatePurchaseTotal() {
  ticketQty = selectedSeats.length;
  document.getElementById('pQty').textContent   = ticketQty;
  document.getElementById('pTotal').textContent = 'Total: $' + (UNIT_PRICE * ticketQty).toLocaleString();
}


/* ============================================================
   MODAL DE COMPRA
   ============================================================ */

/** Abre el modal de compra para una película y horario específicos. */
function openPurchaseModal(id, schedule) {
  const movie = allMovies.find(m => m._id === id);
  if (!movie) return;

  selectedMovieId  = id;
  selectedSchedule = schedule;

  const user = getUser();
  document.getElementById('purchaseForm').style.display     = user ? 'block' : 'none';
  document.getElementById('purchaseLoginMsg').style.display = user ? 'none'  : 'block';

  if (user) {
    document.getElementById('pMovieTitle').textContent  = movie.title;
    document.getElementById('pSchedule').textContent    = schedule;
    document.getElementById('pUnitPrice').textContent   = '$' + UNIT_PRICE.toLocaleString();
    generateSeatMap();
    updatePurchaseTotal();
  }

  document.getElementById('purchaseModal').classList.add('open');
  document.body.classList.add('modal-open');
}

/** Cierra el modal de compra. */
function closePurchaseModal() {
  document.getElementById('purchaseModal').classList.remove('open');
  document.body.classList.remove('modal-open');
}

/** Envía la compra a la API y muestra el resultado. */
async function confirmPurchase() {
  if (selectedSeats.length === 0) {
    showToast('⚠️ Selecciona al menos un asiento', 3000);
    return;
  }

  try {
    const result = await api('/api/sales', {
      method: 'POST',
      body: {
        movie:      selectedMovieId,
        schedule:   selectedSchedule,
        format:     '2D',
        unit_price: UNIT_PRICE,
        foods:      [],
        seats:      selectedSeats,
      },
    });

    closePurchaseModal();
    closeMovieModal();
    showToast(`🎬 ¡Compra exitosa! +${result.points_earned} puntos`, 4000);

    // Actualiza los puntos del usuario en sesión
    const updatedUser = await api('/api/auth/me');
    if (updatedUser) {
      const storage = localStorage.getItem('rsa_token') ? localStorage : sessionStorage;
      storage.setItem('rsa_user', JSON.stringify(updatedUser));
      updateAuthUI();
    }

    ticketQty = 1;
    refreshHistory();
  } catch (e) {
    showToast('Error: ' + e.message, 4000);
  }
}


/* ============================================================
   SCROLL SPY (resalta el enlace activo en la navegación)
   ============================================================ */

function setupScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-list a');
  const sections = Array.from(navLinks)
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateActiveLink() {
    let current  = sections[0];
    const middle = window.scrollY + window.innerHeight * 0.35;

    sections.forEach(section => {
      if (section.offsetTop <= middle) current = section;
    });

    // Si llegamos al final de la página, activa la última sección
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
    if (atBottom) current = sections[sections.length - 1];

    if (current) {
      navLinks.forEach(link =>
        link.classList.toggle('active', link.getAttribute('href') === '#' + current.id)
      );
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateActiveLink(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  updateActiveLink();
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

// Modales
document.getElementById('closeMovieModal').addEventListener('click', closeMovieModal);
document.getElementById('movieModalOverlay').addEventListener('click', closeMovieModal);
document.getElementById('closePurchaseModal').addEventListener('click', closePurchaseModal);
document.getElementById('purchaseModalOverlay').addEventListener('click', closePurchaseModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMovieModal(); closePurchaseModal(); }
});

// Compra
document.getElementById('confirmPurchaseBtn').addEventListener('click', confirmPurchase);

// Filtros de categoría
document.querySelectorAll('.segmented-control button').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.segmented-control button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMovies();
  });
});

// Búsqueda de películas
document.getElementById('movieSearch').addEventListener('input', renderMovies);

// Cambio de ciudad
document.getElementById('citySelect').addEventListener('change', function () {
  document.getElementById('currentCity').textContent = this.options[this.selectedIndex].text;
  loadVenues();
});

// Menú lateral (hamburguesa)
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
});
document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
});

// Scroll suave a secciones
document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () =>
    document.querySelector(btn.dataset.scroll).scrollIntoView({ behavior: 'smooth' })
  );
});

// Cierra el sidebar al hacer clic en un enlace de navegación
document.querySelectorAll('.nav-list a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-list a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  });
});


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  await loadCities();
  await Promise.all([
    loadMovies(),
    loadComingSoon(),
    loadFoods(),
    loadVenues(),
    loadPurchaseHistory(),
  ]);
  setupScrollSpy();
});