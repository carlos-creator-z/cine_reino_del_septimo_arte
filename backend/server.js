const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const seedDB = require('./seed/seed');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const comingSoonRoutes = require('./routes/comingSoon');
const foodRoutes = require('./routes/foods');
const venueRoutes = require('./routes/venues');
const saleRoutes = require('./routes/sales');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, 'frontend');

// =======================================================
// 1. PRIMERO: MONTAR LAS RUTAS DE LA API
// Esto evita que Express envíe HTML cuando el frontend pide JSON
// =======================================================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/coming-soon', comingSoonRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);

// Ciudades
app.get('/api/cities', (req, res) => {
  res.json([
    "Bogota","Medellin","Cali","Barranquilla","Cartagena","Bucaramanga","Pereira","Manizales",
    "Armenia","Ibague","Neiva","Villavicencio","Santa Marta","Monteria","Sincelejo","Valledupar",
    "Riohacha","Tunja","Popayan","Pasto","Cucuta","Floridablanca","Soacha","Chia","Zipaquira",
    "Facatativa","Mosquera","Funza","Madrid","Cajica","Fusagasuga","Girardot","Sogamoso",
    "Duitama","Yopal","Arauca","Leticia","Mocoa","San Andres","Quibdo","Buenaventura",
    "Palmira","Buga","Tulua","Jamundi","Yumbo","Cartago","Dosquebradas","Santa Rosa de Cabal",
    "Envigado","Sabaneta","Itagui","Bello","Rionegro","Apartado","Turbo","Marinilla","La Ceja",
    "Girardota","Copacabana","Caldas","La Estrella","Caucasia","Magangue","Turbaco","Malambo",
    "Soledad","Sabanalarga","Puerto Colombia","Galapa","Lorica","Cerete","Sahagun","Corozal",
    "Cienaga","Fundacion","Aguachica","Ocana","Pamplona","Villa del Rosario","Piedecuesta",
    "Giron","Barrancabermeja","San Gil","Socorro","Garzon","Pitalito","La Plata",
    "Espinal","Melgar","Honda","Mariquita","Acacias","Granada","Puerto Lopez","San Jose del Guaviare",
    "Florencia","Puerto Asis","Tumaco","Ipiales","Sibundoy","Santander de Quilichao","Puerto Tejada",
    "Calarca","Montenegro","Quimbaya","La Tebaida"
  ]);
});

// =======================================================
// 2. SEGUNDO: ARCHIVOS ESTÁTICOS (CSS, JS, Imágenes)
// =======================================================
app.use(express.static(frontendPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================================================
// 3. TERCERO: RUTAS DE PÁGINAS (Frontend)
// =======================================================
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(frontendPath, 'register.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(frontendPath, 'admin.html')));

// Crear directorios de uploads si no existen
['uploads', 'uploads/posters', 'uploads/foods'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  await seedDB();
  app.listen(PORT, () => {
    console.log('');
    console.log('  🎬 Reino del Séptimo Arte — Servidor iniciado');
    console.log(`  🌐 http://localhost:${PORT}`);
    console.log(`  👤 Admin: admin@reino.com / admin123`);

    console.log('');
  });
};

start();