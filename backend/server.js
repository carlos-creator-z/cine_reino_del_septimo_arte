const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');


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

const frontendPath = path.join(__dirname, '../frontend')

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
    "Bogota","Medellin","Cali","Barranquilla" , "ibague"
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



const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log('');
    console.log('  🎬 Reino del Séptimo Arte — Servidor iniciado');
    console.log(`  🌐 http://localhost:${PORT}`);
    console.log(`  👤 Admin: admin@reino.com / admin123`);

    console.log('');
  });
};

start();
