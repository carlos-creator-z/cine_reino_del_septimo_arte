'use strict';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const currentUser = getUser();
if (!currentUser || currentUser.role !== 'admin') { window.location.href = '/'; }

// ─── Utilidades ───────────────────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function formatCurrency(amount) {
  return '$' + (amount || 0).toLocaleString();
}

// ─── Navegación ───────────────────────────────────────────────────────────────
const navLinks  = document.querySelectorAll('.admin-nav a');
const sections  = document.querySelectorAll('.admin-section');
const pageTitle = document.getElementById('adminPageTitle');

const sectionLoaders = {
  'sec-dashboard': () => loadDashboard(),
  'sec-movies'   : () => loadMovies(),
  'sec-coming'   : () => loadComingSoon(),
  'sec-foods'    : () => loadFoods(),
  'sec-venues'   : () => loadVenues(),
  'sec-users'    : () => loadUsers(),
  'sec-sales'    : () => loadSales(),
};

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    sections.forEach(sec => {
      sec.style.display = sec.id === targetId ? 'block' : 'none';
    });

    pageTitle.textContent = link.textContent;
    sectionLoaders[targetId]?.();
  });
});

// ─── Sesión ───────────────────────────────────────────────────────────────────
document.getElementById('adminUserName').textContent = currentUser ? currentUser.name : 'Admin';
document.getElementById('adminLogoutBtn').addEventListener('click', logout);

// ─── Menú Móvil ────────────────────────────────────────────────────────────────
const adminMenuToggle = document.getElementById('adminMenuToggle');
const adminSidebar = document.querySelector('.admin-sidebar');

if (adminMenuToggle && adminSidebar) {
  // Abrir/Cerrar menú
  adminMenuToggle.addEventListener('click', () => {
    adminSidebar.classList.toggle('open');
  });

  // Cerrar menú al hacer clic en un enlace de navegación
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        adminSidebar.classList.remove('open');
      }
    });
  });

  // Cerrar menú si se hace clic fuera de él
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 && !adminSidebar.contains(e.target) && !adminMenuToggle.contains(e.target)) {
      adminSidebar.classList.remove('open');
    }
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const stats = await api('/api/sales/stats');
    if (!stats) return;

    document.getElementById('statRevenue').textContent      = formatCurrency(stats.totalRevenue);
    document.getElementById('statTickets').textContent      = stats.totalTickets;
    document.getElementById('statSales').textContent        = stats.totalSales;
    document.getElementById('statUsers').textContent        = stats.totalUsers;
    document.getElementById('statTodayRevenue').textContent = formatCurrency(stats.todayRevenue);
    document.getElementById('statTodayTickets').textContent = stats.todayTickets;

    const tbody7 = document.getElementById('tableLast7');
    tbody7.textContent = '';
    (stats.last7 || []).forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d._id}</td><td>${formatCurrency(d.revenue)}</td><td>${d.tickets}</td><td>${d.count}</td>`;
      tbody7.appendChild(tr);
    });

    const tbodyTop = document.getElementById('tableTopMovies');
    tbodyTop.textContent = '';
    (stats.topMovies || []).forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m.title}</td><td>${m.tickets}</td><td>${formatCurrency(m.revenue)}</td>`;
      tbodyTop.appendChild(tr);
    });
  } catch (e) { console.error(e); }
}

// ─── Helper modales ───────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.classList.remove('modal-open');
}

// ─── Películas ────────────────────────────────────────────────────────────────
async function loadMovies() {
  try {
    const movies = await api('/api/movies');
    if (!movies) return;

    const tbody = document.getElementById('tableMovies');
    tbody.textContent = '';

    movies.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Poster"><img src="${m.poster}" alt="" style="width:50px;height:70px;object-fit:cover;border-radius:4px;"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect width=%221%22 height=%221%22 fill=%22%231d1913%22/></svg>'"></td>
        <td data-label="Titulo"><strong>${m.title}</strong></td>
        <td data-label="Genero">${m.genre}</td>
        <td data-label="Estado"><span class="status-tag">${m.status}</span></td>
        <td data-label="Acciones">
          <button type="button" class="btn-sm btn-edit"   data-id="${m._id}">Editar</button>
          <button type="button" class="btn-sm btn-delete" data-id="${m._id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit')  .forEach(btn => btn.addEventListener('click', () => editMovie(btn.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteMovie(btn.dataset.id)));
  } catch (e) { console.error(e); }
}

function openMovieModal(movie = null) {
  document.getElementById('movieId').value       = movie ? movie._id         : '';
  document.getElementById('mTitle').value        = movie ? movie.title       : '';
  document.getElementById('mGenre').value        = movie ? movie.genre       : '';
  document.getElementById('mCategory').value     = movie ? movie.category    : 'accion';
  document.getElementById('mStatus').value       = movie ? movie.status      : 'Estreno';
  document.getElementById('mRating').value       = movie ? movie.rating      : '';
  document.getElementById('mDate').value         = movie ? movie.release_date: '';   
  document.getElementById('mDirector').value     = movie ? movie.director    : '';
  document.getElementById('mDuration').value     = movie ? movie.duration    : '';
  document.getElementById('mActors').value       = movie ? movie.actors      : '';
  document.getElementById('mDescription').value  = movie ? movie.description : '';
  document.getElementById('mSynopsis').value     = movie ? movie.synopsis    : '';
  document.getElementById('mTrailer').value      = movie ? movie.trailer     : '';
  document.getElementById('mFormats').value      = movie ? (movie.formats   || []).join(', ') : '';
  document.getElementById('mSchedules').value    = movie ? (movie.schedules || []).join(', ') : '';
  document.getElementById('mPoster').value       = '';
  document.getElementById('movieModalTitle').textContent = movie ? 'Editar pelicula' : 'Agregar pelicula';
  openModal('movieModal');
}

async function editMovie(id) {
  try {
    const movies = await api('/api/movies');
    const movie  = movies.find(m => m._id === id);
    if (movie) openMovieModal(movie);
  } catch (e) { showToast('Error al cargar pelicula', 3000); }
}

async function deleteMovie(id) {
  if (!confirm('¿Estás seguro de eliminar esta película?')) return;
  try {
    await api(`/api/movies/${id}`, { method: 'DELETE' });
    showToast('Película eliminada', 2000);
    loadMovies();
  } catch (e) { showToast('Error: ' + e.message, 3000); }
}

document.getElementById('btnAddMovie').addEventListener('click', () => openMovieModal());
['closeMovieModal', 'movieModalOverlay', 'cancelMovie'].forEach(id =>
  document.getElementById(id).addEventListener('click', () => closeModal('movieModal'))
);

document.getElementById('movieForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id       = document.getElementById('movieId').value;
  const formData = new FormData(document.getElementById('movieForm'));
  const parseList = v => JSON.stringify(v.split(',').map(s => s.trim()).filter(Boolean));
  formData.set('formats',   parseList(formData.get('formats')));
  formData.set('schedules', parseList(formData.get('schedules')));
  try {
    if (id) {
      await api(`/api/movies/${id}`, { method: 'PUT', body: formData });
      showToast('Película actualizada', 2000);
    } else {
      await api('/api/movies', { method: 'POST', body: formData });
      showToast('Película creada', 2000);
    }
    closeModal('movieModal');
    loadMovies();
  } catch (e) { showToast('Error: ' + e.message, 3000); }
});

// ─── Coming Soon ──────────────────────────────────────────────────────────────
async function loadComingSoon() {
  try {
    const items = await api('/api/coming-soon');
    if (!items) return;

    const tbody = document.getElementById('tableComing');
    tbody.textContent = '';

    items.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Poster"><img src="${c.poster}" alt="" style="width:50px;height:70px;object-fit:cover;border-radius:4px;"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect width=%221%22 height=%221%22 fill=%22%231d1913%22/></svg>'"></td>
        <td data-label="Titulo"><strong>${c.title}</strong></td>
        <td data-label="Genero">${c.genre}</td>
        <td data-label="Fecha">${c.release_date}</td>
        <td data-label="Acciones">
          <button type="button" class="btn-sm btn-edit"   data-id="${c._id}">Editar</button>
          <button type="button" class="btn-sm btn-delete" data-id="${c._id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', async () => {
        const items = await api('/api/coming-soon');
        const item  = items.find(i => i._id === btn.dataset.id);
        if (item) openComingModal(item);
      })
    );
    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar?')) return;
        await api(`/api/coming-soon/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Eliminado', 2000);
        loadComingSoon();
      })
    );
  } catch (e) { console.error(e); }
}
function openComingModal(item = null) {
  document.getElementById('comingId').value             = item ? item._id         : '';
  document.getElementById('cTitle').value               = item ? item.title       : '';
  document.getElementById('cGenre').value               = item ? item.genre       : '';
  document.getElementById('cDate').value                = item ? item.release_date: '';
  document.getElementById('cPoster').value              = '';
  document.getElementById('comingModalTitle').textContent = item ? 'Editar' : 'Agregar';
  openModal('comingModal');
}

document.getElementById('btnAddComing').addEventListener('click', () => openComingModal());
['closeComingModal', 'comingModalOverlay', 'cancelComing'].forEach(id =>
  document.getElementById(id).addEventListener('click', () => closeModal('comingModal'))
);

document.getElementById('comingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id       = document.getElementById('comingId').value;
  const formData = new FormData(document.getElementById('comingForm'));
  try {
    if (id) {
      await api(`/api/coming-soon/${id}`, { method: 'PUT', body: formData });
      showToast('Actualizado', 2000);
    } else {
      await api('/api/coming-soon', { method: 'POST', body: formData });
      showToast('Creado', 2000);
    }
    closeModal('comingModal');
    loadComingSoon();
  } catch (e) { showToast('Error: ' + e.message, 3000); }
});

// ─── Foods ────────────────────────────────────────────────────────────────────
async function loadFoods() {
  try {
    const items = await api('/api/foods');
    if (!items) return;

    const tbody = document.getElementById('tableFoods');
    tbody.textContent = '';

    items.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Imagen"><img src="${f.image}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect width=%221%22 height=%221%22 fill=%22%231d1913%22/></svg>'"></td>
        <td data-label="Nombre"><strong>${f.name}</strong></td>
        <td data-label="Precio">${formatCurrency(f.price)}</td>
        <td data-label="Acciones">
          <button type="button" class="btn-sm btn-edit"   data-id="${f._id}">Editar</button>
          <button type="button" class="btn-sm btn-delete" data-id="${f._id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', async () => {
        const items = await api('/api/foods');
        const item  = items.find(i => i._id === btn.dataset.id);
        if (item) openFoodModal(item);
      })
    );
    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar?')) return;
        await api(`/api/foods/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Eliminado', 2000);
        loadFoods();
      })
    );
  } catch (e) { console.error(e); }
}

function openFoodModal(item = null) {
  document.getElementById('foodId').value             = item ? item._id        : '';
  document.getElementById('fName').value              = item ? item.name       : '';
  document.getElementById('fPrice').value             = item ? item.price      : '';
  document.getElementById('fDesc').value              = item ? item.description: '';
  document.getElementById('fImage').value             = '';
  document.getElementById('foodModalTitle').textContent = item ? 'Editar' : 'Agregar';
  openModal('foodModal');
}

document.getElementById('btnAddFood').addEventListener('click', () => openFoodModal());
['closeFoodModal', 'foodModalOverlay', 'cancelFood'].forEach(id =>
  document.getElementById(id).addEventListener('click', () => closeModal('foodModal'))
);

document.getElementById('foodForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id       = document.getElementById('foodId').value;
  const formData = new FormData(document.getElementById('foodForm'));
  try {
    if (id) {
      await api(`/api/foods/${id}`, { method: 'PUT', body: formData });
      showToast('Actualizado', 2000);
    } else {
      await api('/api/foods', { method: 'POST', body: formData });
      showToast('Creado', 2000);
    }
    closeModal('foodModal');
    loadFoods();
  } catch (e) { showToast('Error: ' + e.message, 3000); }
});

// ─── Venues ───────────────────────────────────────────────────────────────────
async function loadVenues() {
  try {
    const items = await api('/api/venues');
    if (!items) return;

    const tbody = document.getElementById('tableVenues');
    tbody.textContent = '';

    items.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Ciudad">${v.city}</td>
        <td data-label="Nombre"><strong>${v.name}</strong></td>
        <td data-label="Direccion">${v.address}</td>
        <td data-label="Servicios">${v.services}</td>
        <td data-label="Acciones">
          <button type="button" class="btn-sm btn-edit"   data-id="${v._id}">Editar</button>
          <button type="button" class="btn-sm btn-delete" data-id="${v._id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', async () => {
        const items = await api('/api/venues');
        const item  = items.find(i => i._id === btn.dataset.id);
        if (item) openVenueModal(item);
      })
    );
    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar?')) return;
        await api(`/api/venues/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Eliminado', 2000);
        loadVenues();
      })
    );
  } catch (e) { console.error(e); }
}

function openVenueModal(item = null) {
  document.getElementById('venueId').value              = item ? item._id    : '';
  document.getElementById('vCity').value                = item ? item.city   : '';
  document.getElementById('vName').value                = item ? item.name   : '';
  document.getElementById('vAddress').value             = item ? item.address: '';
  document.getElementById('vServices').value            = item ? item.services: '';
  document.getElementById('venueModalTitle').textContent = item ? 'Editar' : 'Agregar';
  openModal('venueModal');
}

document.getElementById('btnAddVenue').addEventListener('click', () => openVenueModal());
['closeVenueModal', 'venueModalOverlay', 'cancelVenue'].forEach(id =>
  document.getElementById(id).addEventListener('click', () => closeModal('venueModal'))
);

document.getElementById('venueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id   = document.getElementById('venueId').value;
  const data = {
    city    : document.getElementById('vCity').value,
    name    : document.getElementById('vName').value,
    address : document.getElementById('vAddress').value,
    services: document.getElementById('vServices').value,
  };
  try {
    if (id) {
      await api(`/api/venues/${id}`, { method: 'PUT', body: data });
      showToast('Actualizado', 2000);
    } else {
      await api('/api/venues', { method: 'POST', body: data });
      showToast('Creado', 2000);
    }
    closeModal('venueModal');
    loadVenues();
  } catch (e) { showToast('Error: ' + e.message, 3000); }
});

// ─── Usuarios ─────────────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    const users = await api('/api/users');
    if (!users) return;

    const tbody = document.getElementById('tableUsers');
    tbody.textContent = '';

    users
      .filter(u => u.role !== 'admin')
      .forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Nombre">${u.name}</td>
          <td data-label="Correo">${u.email}</td>
          <td data-label="Rol">${u.role}</td>
          <td data-label="Puntos">${u.points}</td>
          <td data-label="Membresia">${u.membership}</td>
          <td data-label="Acciones"><button type="button" class="btn-sm btn-delete" data-id="${u._id}">Eliminar</button></td>`;
        tbody.appendChild(tr);
      });

    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este usuario?')) return;
        await api(`/api/users/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Usuario eliminado', 2000);
        loadUsers();
      })
    );
  } catch (e) { console.error(e); }
}

// ─── Ventas ───────────────────────────────────────────────────────────────────
async function loadSales() {
  try {
    const sales = await api('/api/sales');
    if (!sales) return;

    const tbody = document.getElementById('tableSales');
    tbody.textContent = '';

    sales.forEach(s => {
      const date = new Date(s.createdAt).toLocaleDateString('es-CO');
      const tr   = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Fecha">${date}</td>
        <td data-label="Usuario">${s.user?.name   || 'N/A'}</td>
        <td data-label="Pelicula">${s.movie?.title || 'N/A'}</td>
        <td data-label="Horario">${s.schedule}</td>
        <td data-label="Cantidad">${s.quantity}</td>
        <td data-label="Total">${formatCurrency(s.total_price)}</td>
        <td data-label="Estado"><span class="status-tag">${s.status}</span></td>`;
      tbody.appendChild(tr);
    });
  } catch (e) { console.error(e); }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => { loadDashboard(); });