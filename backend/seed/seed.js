const User = require('../models/User');
const Movie = require('../models/Movie');
const ComingSoon = require('../models/ComingSoon');
const Food = require('../models/Food');
const Venue = require('../models/Venue');
const Sale = require('../models/Sale');

// ─── Datos de seed ────────────────────────────────────────────────────────────

// SE ELIMINÓ EL ARREGLO 'USERS' PARA EVITAR ERRORES DE LOGIN

const MOVIES = [
  {
    title: 'El Diablo Viste a la Moda 2',
    genre: 'Drama',
    category: 'drama',
    status: 'Estreno',
    rating: 'Mayores de 7 años',
    release_date: '29 abril 2026',
    poster: 'https://m.media-amazon.com/images/M/MV5BYzM2ZGVlMDUtNGJlYi00N2E0LTk4NjAtNzgyN2UxZDM2ODU3XkEyXkFqcGc@._V1_.jpg',
    description: 'Moda, poder y elegancia editorial.',
    director: 'David Frankel',
    duration: '2h 0m',
    actors: 'Meryl Streep, Anne Hathaway',
    synopsis: 'La moda vuelve a tomar el centro de la escena.',
    trailer: 'https://www.youtube.com/results?search_query=El+Diablo+Viste+a+la+Moda+2',
    formats: ['2D', 'DOB'],
    schedules: ['3:20 P.M.', '5:40 P.M.', '7:00 P.M.', '9:30 P.M.'],
  },
  {
    title: 'Michael',
    genre: 'Drama musical',
    category: 'drama',
    status: 'Estreno',
    rating: 'Mayores de 12 años',
    release_date: '22 abril 2026',
    poster: 'https://i.ebayimg.com/00/s/MTUwMFgxMDEz/z/2~sAAeSwMFNpDaOg/$_57.JPG?set_id=880000500F',
    description: 'Música y escenario en pantalla grande.',
    director: 'Antoine Fuqua',
    duration: '2h 15m',
    actors: 'Jaafar Jackson, Colman Domingo',
    synopsis: 'Recorrido por la vida de una figura importante de la música.',
    trailer: 'https://www.youtube.com/results?search_query=Michael+pelicula',
    formats: ['2D', 'SUB'],
    schedules: ['4:00 P.M.', '6:30 P.M.', '8:50 P.M.'],
  },
  {
    title: 'Mortal Kombat 2',
    genre: 'Acción',
    category: 'accion',
    status: 'Preventa',
    rating: 'Mayores de 15 años',
    release_date: '7 mayo 2026',
    poster: 'https://media.themoviedb.org/t/p/w220_and_h330_face/ivVKHht5jutNGnObn1y5sSDrAXn.jpg',
    description: 'Combates y energía de torneo.',
    director: 'Simon McQuoid',
    duration: '1h 58m',
    actors: 'Karl Urban, Jessica McNamee',
    synopsis: 'Los campeones regresan al torneo definitivo.',
    trailer: 'https://www.youtube.com/results?search_query=Mortal+Kombat+2',
    formats: ['2D', '3D', 'DOB'],
    schedules: ['2:40 P.M.', '5:10 P.M.', '7:45 P.M.'],
  },
  {
    title: 'Super Mario Galaxy',
    genre: 'Familia',
    category: 'familia',
    status: 'Estreno',
    rating: 'Para todo público',
    release_date: '1 abril 2026',
    poster: 'https://cdn.cinematerial.com/p/297x/b5qhhxvm/the-super-mario-galaxy-movie-movie-poster-md.jpg?v=1774471243',
    description: 'Aventura animada familiar.',
    director: 'Aaron Horvath',
    duration: '1h 42m',
    actors: 'Chris Pratt, Anya Taylor-Joy',
    synopsis: 'Mario viaja por mundos galácticos.',
    trailer: 'https://www.youtube.com/results?search_query=Super+Mario+Galaxy',
    formats: ['2D', 'DOB'],
    schedules: ['11:30 A.M.', '1:50 P.M.', '4:20 P.M.'],
  },
  {
    title: 'La Posesión de la Momia',
    genre: 'Terror',
    category: 'terror',
    status: 'Estreno',
    rating: 'Mayores de 18 años',
    release_date: '15 abril 2026',
    poster: 'https://m.media-amazon.com/images/M/MV5BNDhlNTAyYTgtOGRmZS00ZmE0LTk4ZTUtMjk3ZjZhMWE4YWY0XkEyXkFqcGc@._V1_.jpg',
    description: 'Un misterio antiguo despierta.',
    director: 'Lee Cronin',
    duration: '1h 50m',
    actors: 'Sophie Wilde, Jack Reynor',
    synopsis: 'Una fuerza antigua convierte una reliquia en pesadilla.',
    trailer: 'https://www.youtube.com/results?search_query=La+Posesion+de+la+Momia',
    formats: ['2D', 'SUB'],
    schedules: ['6:10 P.M.', '8:20 P.M.', '11:00 P.M.'],
  },
];

const COMING_SOON = [
  { title: 'Supergirl',            genre: 'Acción',        release_date: '25 junio 2026',     poster: 'https://preview.redd.it/my-fan-made-movie-poster-cosplay-for-supergirl-2026-v0-n24hm7jmyiig1.jpg?width=640' },
  { title: 'Dolly',                genre: 'Terror',        release_date: '14 mayo 2026',      poster: 'https://img.aullidos.com/imagenes/varios/dolly-poster.webp' },
  { title: 'Spiderman Brand New Day', genre: 'Acción',     release_date: '31 julio 2026',     poster: 'https://cdn.marvel.com/content/2x/smbnd_online_1400x2100_reflection_03.jpg' },
  { title: 'Dune Part 3',          genre: 'Ciencia ficción', release_date: '18 diciembre 2026', poster: 'https://image.tmdb.org/t/p/original/4mTXkCtz75P4VjbaxRJzTVZkUxK.jpg' },
  { title: 'La Odisea',            genre: 'Aventura',      release_date: '16 julio 2026',     poster: 'https://m.media-amazon.com/images/M/MV5BN2MyYjk2MWMtODMyZS00MDUyLWE0OGQtOTQ3MGY0MDE0ZjVmXkEyXkFqcGc@._V1_.jpg' },
  { title: 'Moana',                genre: 'Aventura',      release_date: '9 julio 2026',      poster: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/Moana_%282026_film%29_poster.jpg/250px-Moana_%282026_film%29_poster.jpg' },
  { title: 'Toy Story 5',          genre: 'Familia',       release_date: '18 junio 2026',     poster: 'https://lumiere-a.akamaihd.net/v1/images/target_payoff_poster_united_kingdom_d19f38c5.jpeg?region=0,0,770,1100' },
  { title: 'Minions y Monster',    genre: 'Familia',       release_date: '2 julio 2026',      poster: 'https://m.media-amazon.com/images/M/MV5BYTQ4MzMwYWQtZmFiNy00NmJiLWExNmEtMzgzNGE2ZDQ4NWMzXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg' },
  { title: 'Scary Movie',          genre: 'Comedia terror', release_date: '4 junio 2026',     poster: 'https://img.asmedia.epimg.net/resizer/v2/LSCVJYGXHBE4ZKZFUHWVVNQUYM.jpg?width=760' },
];

const FOODS = [
  { name: 'Combo Gold',       description: 'Crispetas grandes, 2 gaseosas y chocolatina.', price: 39900, image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=80' },
  { name: 'Crispetas Caramelo', description: 'Dulces, crocantes y listas.',               price: 18900, image: 'https://happyvegannie.com/wp-content/uploads/2024/07/palomitas-acarameladas-veganas-5.jpg' },
  { name: 'Nachos Premium',   description: 'Totopos con queso fundido y jalapeños.',       price: 24900, image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=80' },
  { name: 'Perro Cine',       description: 'Pan suave, salchicha y papas.',                price: 21900, image: 'https://ranchera.com.co/wp-content/uploads/2022/11/perro-colombiano-1.jpg' },
  { name: 'Bebida XL',        description: 'Gaseosa o té frío.',                           price: 12900, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80' },
  { name: 'Dulcería',         description: 'Chocolates, gomitas y snacks.',                price: 14900, image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=500&q=80' },
];

const VENUES = [
  { city: 'bogota',      name: 'Andino Gold',       address: 'Carrera 11 #82-71, C.C. Andino',              services: 'Gold, 2D, confitería premium' },
  { city: 'bogota',      name: 'Gran Estación',      address: 'Av. Calle 26 #62-47, C.C. Gran Estación',     services: '2D, 3D, preventas' },
  { city: 'bogota',      name: 'Titán Plaza',        address: 'Av. Boyacá #80-94, C.C. Titán Plaza',         services: 'Gold, general, comidas' },
  { city: 'medellin',    name: 'Santafé Medellín',   address: 'Carrera 43A #7 Sur-170, El Poblado',          services: 'Gold, 2D, confitería' },
  { city: 'medellin',    name: 'Oviedo',             address: 'Carrera 43A #6 Sur-15, El Poblado',           services: 'General, preferencial' },
  { city: 'cali',        name: 'Chipichape',         address: 'Av. 6 Norte #35N-47, C.C. Chipichape',        services: 'Gold, 2D, comidas' },
  { city: 'barranquilla', name: 'Buenavista',        address: 'Carrera 53 #98-99, C.C. Buenavista',         services: 'Gold, 2D, confitería' },
];

const SALE_PRICES    = [18500, 22000, 25000, 30000, 35000];
const SALE_SCHEDULES = ['2:00 P.M.', '4:30 P.M.', '6:00 P.M.', '7:45 P.M.', '9:30 P.M.'];
const SALE_COUNT     = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSalesData(userId, movies, venues) {
  return Array.from({ length: SALE_COUNT }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    date.setHours(Math.floor(Math.random() * 12) + 10);

    const quantity   = Math.floor(Math.random() * 3) + 1;
    const unit_price = SALE_PRICES[i % SALE_PRICES.length];

    return {
      user:        userId,
      movie:       movies[i % movies.length]._id,
      venue:       venues[i % venues.length]?._id,
      schedule:    SALE_SCHEDULES[i % SALE_SCHEDULES.length],
      format:      '2D',
      quantity,
      unit_price,
      total_price: quantity * unit_price,
      createdAt:   date,
    };
  });
}

// ─── Seed principal ───────────────────────────────────────────────────────────

const seedDB = async () => {
  // Ya NO borramos ni creamos usuarios aquí para evitar destruir los usuarios registrados.
  console.log('  🌱 Verificando datos iniciales...');

  // El resto de colecciones solo se insertan si aún no existen
  const moviesExist = (await Movie.countDocuments()) > 0;
  if (moviesExist) {
    console.log('  ℹ️  Películas y demás datos ya existentes, omitiendo...');
    return;
  }

  await Movie.insertMany(MOVIES);
  await ComingSoon.insertMany(COMING_SOON);
  await Food.insertMany(FOODS);
  await Venue.insertMany(VENUES);

  // Buscamos si ya existe algún usuario real registrado para asignarle las compras de prueba
  const existingUsers = await User.find();
  
  if (existingUsers.length > 0) {
    // Si hay usuarios registrados, le asignamos las ventas al primero que encuentre
    const demoUser = existingUsers[0]; 
    const allMovies  = await Movie.find();
    const allVenues  = await Venue.find();
    const salesData  = buildSalesData(demoUser._id, allMovies, allVenues);
    await Sale.insertMany(salesData);
    console.log(`  🎟️  Ventas de prueba asignadas al usuario: ${demoUser.email}`);
  } else {
    console.log('  ℹ️  No hay usuarios registrados aún. Las ventas de prueba se crearán cuando alguien se registre.');
  }

  console.log('  ✅ Datos iniciales insertados');
};

module.exports = seedDB;