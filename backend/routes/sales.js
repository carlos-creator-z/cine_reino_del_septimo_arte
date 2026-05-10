const express = require('express');
const Sale = require('../models/Sale');
const Movie = require('../models/Movie');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Devuelve las sillas ocupadas de una película y horario específico.
// Requiere query params: ?movieId= y ?schedule=
router.get('/seats', async (req, res) => {
  try {
    const { movieId, schedule } = req.query;
    if (!movieId || !schedule) return res.status(400).json({ error: 'Faltan parámetros' });

    const sales = await Sale.find({ movie: movieId, schedule: schedule, status: 'confirmed' });
    const occupiedSeats = sales.flatMap(sale => sale.seats || []);

    res.json(occupiedSeats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asientos' });
  }
});

// Devuelve las compras del usuario autenticado, ordenadas de más reciente a más antigua.
// Incluye título y póster de la película mediante populate.
router.get('/mis-compras', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const compras = await Sale.find({ user: userId })
      .populate('movie', 'title poster')
      .sort({ createdAt: -1 });

    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus compras' });
  }
});

// Devuelve estadísticas generales para el panel de administración:
// ingresos totales y del día, tickets, ventas, usuarios, películas activas,
// ventas de los últimos 7 días y top 5 películas más vendidas.
// Solo accesible para administradores autenticados.
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totR = await Sale.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$total_price' } } }
    ]);
    const totT = await Sale.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todR = await Sale.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total_price' } } }
    ]);
    const todT = await Sale.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const sevAgo = new Date();
    sevAgo.setDate(sevAgo.getDate() - 7);

    const last7 = await Sale.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: sevAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total_price' }, tickets: { $sum: '$quantity' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const topM = await Sale.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$movie', tickets: { $sum: '$quantity' }, revenue: { $sum: '$total_price' } } },
      { $sort: { tickets: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
      { $unwind: '$movie' },
      { $project: { title: '$movie.title', tickets: 1, revenue: 1 } }
    ]);

    res.json({
      totalRevenue: totR[0]?.total || 0,
      totalTickets: totT[0]?.total || 0,
      totalSales: await Sale.countDocuments({ status: 'confirmed' }),
      totalUsers: await User.countDocuments({ role: 'user' }),
      totalMovies: await Movie.countDocuments({ active: true }),
      todayRevenue: todR[0]?.total || 0,
      todayTickets: todT[0]?.total || 0,
      last7,
      topMovies: topM
    });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Crea una nueva venta para el usuario autenticado.
// Calcula la cantidad según sillas seleccionadas o el campo quantity.
// Acumula puntos al usuario según el total de la compra (10 pts por cada $10.000).
router.post('/', auth, async (req, res) => {
  try {
    const { movie: movieId, venue: venueId, schedule, format, quantity, unit_price, foods, seats } = req.body;

    const finalSeats = seats || [];
    const qty = finalSeats.length > 0 ? finalSeats.length : (quantity || 1);
    const total = qty * unit_price;

    const sale = await Sale.create({
      user: req.user._id,
      movie: movieId,
      venue: venueId || undefined,
      schedule,
      format: format || '2D',
      quantity: qty,
      unit_price,
      total_price: total,
      seats: finalSeats,
      foods: (foods || []).map(f => ({
        food: f.food_id || f.food,
        quantity: f.quantity || 1,
        unit_price: f.unit_price || 0,
        total_price: (f.quantity || 1) * (f.unit_price || 0)
      }))
    });

    const pointsEarned = Math.floor(total / 10000) * 10;
    if (pointsEarned > 0) await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });

    res.status(201).json({ id: sale._id, total_price: sale.total_price, points_earned: pointsEarned, message: 'Compra exitosa' });
  } catch (error) {
    res.status(400).json({ error: 'Error al procesar compra: ' + error.message });
  }
  // Dentro de tu ruta de crear venta, justo después de obtener los datos del body:
  const movie = await Movie.findById(movieId); // Buscamos la película

  const sale = await Sale.create({ 
  user: req.user._id, 
  movie: movieId, 
  // ... tus otros campos (schedule, quantity, etc) ...
  expirationDate: movie.expirationDate // <--- AGREGAR ESTO PARA GUARDAR EL VENCIMIENTO
});
});

// Devuelve las últimas 200 ventas con datos del usuario y película.
// Solo accesible para administradores autenticados.
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    res.json(
      await Sale.find()
        .populate('user', 'name email')
        .populate('movie', 'title poster')
        .sort({ createdAt: -1 })
        .limit(200)
    );
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;