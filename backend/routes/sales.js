const express = require('express');
const Sale = require('../models/Sale');
const Movie = require('../models/Movie');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// RUTA: Generar Factura PDF
router.get('/factura/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('user', 'name email')
      .populate('movie', 'title')
      .populate('foods.food', 'name');

    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    // Seguridad: Solo el dueño o el admin pueden descargar la factura
    if (sale.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // 1. Generar datos del QR
    const qrData = JSON.stringify({
      codigo: sale.redemptionCode || sale._id.toString().slice(-8).toUpperCase(),
      pelicula: sale.movie.title,
      asientos: sale.seats
    });
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 150, margin: 1 });

    // 2. Crear documento PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${sale._id}.pdf`);
    doc.pipe(res);

    // Colores del cine
    const gold = '#d8a92d';
    const black = '#080706';
    const darkPanel = '#1d1913';
    const white = '#fffaf0';

    // Fondo negro
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(black);

    // Header
    doc.fontSize(24).fillColor(gold).font('Helvetica-Bold').text('REINO DEL SEPTIMO ARTE', 50, 50, { align: 'center' });
    doc.fontSize(12).fillColor(white).font('Helvetica').text('Factura de Compra', { align: 'center' });
    doc.moveDown(2);

    // Datos de la película
    const movieY = doc.y;
    doc.rect(50, movieY, doc.page.width - 100, 80).fill(darkPanel);
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(20).text(sale.movie.title, 70, movieY + 15, { width: doc.page.width - 140 });
    doc.fillColor(white).font('Helvetica').fontSize(14).text(`Horario: ${sale.schedule} | Formato: ${sale.format}`, 70, movieY + 45, { width: doc.page.width - 140 });
    doc.y = movieY + 100;

    // Info cliente
    doc.fillColor(white).font('Helvetica').fontSize(12);
    doc.text(`Cliente: ${sale.user.name}`, 50);
    doc.text(`Fecha: ${sale.createdAt.toLocaleDateString('es-CO')}`);
    doc.text(`Codigo de canje: ${sale.redemptionCode || 'N/A'}`);
    doc.moveDown(1.5);

    // Asientos
    if (sale.seats && sale.seats.length > 0) {
      const seatY = doc.y;
      doc.rect(50, seatY, doc.page.width - 100, 40).fill(darkPanel);
      doc.fillColor(gold).font('Helvetica-Bold').text('ASIENTOS', 70, seatY + 12);
      doc.fillColor(white).font('Helvetica').text(sale.seats.join(', '), 180, seatY + 12);
      doc.y = seatY + 60;
    }

    // Comidas
    let foodTotal = 0;
    if (sale.foods && sale.foods.length > 0) {
      const foodY = doc.y;
      doc.rect(50, foodY, doc.page.width - 100, 40).fill(darkPanel);
      doc.fillColor(gold).font('Helvetica-Bold').text('COMIDAS', 70, foodY + 12);
      doc.y = foodY + 60;

      doc.fillColor(white).font('Helvetica');
      sale.foods.forEach(f => {
        const name = f.food ? f.food.name : 'Comida';
        const price = f.total_price || 0;
        foodTotal += price;
        doc.text(`${name} x${f.quantity}`, 70, doc.y, { continued: true, width: 300 });
        doc.text(`$${price.toLocaleString()}`, { align: 'right', width: 150 });
      });
      doc.moveDown(0.5);
      doc.fillColor(gold).font('Helvetica-Bold').text(`Total Comidas: $${foodTotal.toLocaleString()}`, 70, doc.y, { align: 'right', width: doc.page.width - 120 });
      doc.moveDown(1.5);
    }

    // Total Boletas
    const ticketsTotal = sale.total_price - foodTotal;
    doc.fillColor(white).font('Helvetica').text(`Total Boletas: $${ticketsTotal.toLocaleString()}`, 50, doc.y, { align: 'right', width: doc.page.width - 120 });
    doc.moveDown(1);

    // Gran Total
    doc.rect(50, doc.y, doc.page.width - 100, 50).fill(gold);
    doc.fillColor(black).font('Helvetica-Bold').fontSize(20).text(`TOTAL: $${sale.total_price.toLocaleString()}`, 70, doc.y + 15);

    // Código QR
    doc.image(qrBuffer, doc.page.width - 150, 50, { width: 100 });
    doc.fillColor(white).font('Helvetica').fontSize(8).text('Escanea para canjear', doc.page.width - 150, 155, { width: 100, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error PDF:', error);
    res.status(500).json({ error: 'Error al generar la factura' });
  }
});

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
      .populate('foods.food', 'name') // <--- AGREGAMOS ESTO PARA TRAER EL NOMBRE DE LA COMIDA
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