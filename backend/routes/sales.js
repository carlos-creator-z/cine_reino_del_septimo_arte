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
    if (sale.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // 1. Generar datos del QR (CON EL ID PARA EL ESCÁNER)
    const qrData = JSON.stringify({
      id: sale._id.toString(), 
      codigo: sale.redemptionCode || sale._id.toString().slice(-8).toUpperCase(),
      pelicula: sale.movie.title,
      asientos: sale.seats
    });
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 200, margin: 1 });

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

    // Header Dorado
    doc.rect(0, 0, doc.page.width, 90).fill(gold);
    doc.fontSize(26).fillColor(black).font('Helvetica-Bold').text('REINO DEL SEPTIMO ARTE', 50, 30, { align: 'center' });

    // Subheader
    doc.moveDown(2);
    doc.fontSize(14).fillColor(gold).font('Helvetica').text('FACTURA DE COMPRA', 50, 110, { align: 'center' });

    // Datos de la película
    let currentY = 150;
    doc.rect(50, currentY, doc.page.width - 100, 80).fill(darkPanel);
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(22).text(sale.movie.title, 70, currentY + 15, { width: doc.page.width - 140 });
    doc.fillColor(white).font('Helvetica').fontSize(14).text(`Horario: ${sale.schedule} | Formato: ${sale.format}`, 70, currentY + 50, { width: doc.page.width - 140 });
    currentY += 100;

    // Info cliente
    doc.fillColor(white).font('Helvetica').fontSize(12);
    doc.text(`Cliente: ${sale.user.name}`, 50, currentY);
    doc.text(`Fecha: ${sale.createdAt.toLocaleDateString('es-CO')}`, 50, currentY + 20);
    currentY += 50;

    // Asientos
    if (sale.seats && sale.seats.length > 0) {
      doc.rect(50, currentY, doc.page.width - 100, 40).fill(darkPanel);
      doc.fillColor(gold).font('Helvetica-Bold').text('ASIENTOS', 70, currentY + 12);
      doc.fillColor(white).font('Helvetica').text(sale.seats.join(', '), 180, currentY + 12);
      currentY += 60;
    }

    // Comidas
    let foodTotal = 0;
    if (sale.foods && sale.foods.length > 0) {
      doc.rect(50, currentY, doc.page.width - 100, 40).fill(darkPanel);
      doc.fillColor(gold).font('Helvetica-Bold').text('COMIDAS', 70, currentY + 12);
      currentY += 60;

      doc.fillColor(white).font('Helvetica');
      sale.foods.forEach(f => {
        const name = f.food ? f.food.name : 'Comida';
        const price = f.total_price || 0;
        foodTotal += price;
        doc.text(`${name} x${f.quantity}`, 70, currentY, { continued: true, width: 300 });
        doc.text(`$${price.toLocaleString()}`, { align: 'right', width: 150 });
        currentY += 20;
      });
      doc.moveDown(0.5);
      currentY = doc.y;
      doc.fillColor(gold).font('Helvetica-Bold').text(`Total Comidas: $${foodTotal.toLocaleString()}`, 70, currentY, { align: 'right', width: doc.page.width - 120 });
      currentY += 30;
    }

    // Total Boletas
    const ticketsTotal = sale.total_price - foodTotal;
    doc.fillColor(white).font('Helvetica').text(`Total Boletas: $${ticketsTotal.toLocaleString()}`, 50, currentY, { align: 'right', width: doc.page.width - 120 });
    currentY += 30;

    // Gran Total
    doc.rect(50, currentY, doc.page.width - 100, 50).fill(gold);
    doc.fillColor(black).font('Helvetica-Bold').fontSize(20).text(`TOTAL: $${sale.total_price.toLocaleString()}`, 70, currentY + 15);
    currentY += 80;

    // --- CÓDIGO QR (ABAJO, GRANDE Y CENTRADO) ---
    const redemptionCode = sale.redemptionCode || sale._id.toString().slice(-8).toUpperCase();
    const qrSize = 150;
    const qrX = (doc.page.width - qrSize) / 2; 
    
    doc.image(qrBuffer, qrX, currentY, { width: qrSize });
    currentY += qrSize + 15;
    
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(18).text(`Código: ${redemptionCode}`, 50, currentY, { align: 'center' });
    
    // TEXTO DE UN SOLO USO
    doc.fillColor(white).font('Helvetica').fontSize(11).text('⚠️ VÁLIDO PARA UN SOLO ESCANEO. Al usarlo, esta factura quedará anulada.', 50, currentY + 25, { align: 'center' });

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
// RUTA: Canjear factura (Por ID o por Código) - Escáner QR
router.post('/redeem', auth, adminOnly, async (req, res) => {
  try {
    const { code } = req.body; // Puede ser el ID largo o el código corto
    if (!code) return res.status(400).json({ error: 'Código no proporcionado' });

    // Buscamos por ID exacto o por código de canje
    const sale = await Sale.findOne({
      $or: [
        { _id: code.length === 24 ? code : null }, // Si tiene 24 caracteres, es un ID de Mongo
        { redemptionCode: code.toUpperCase() }
      ]
    }).populate('user', 'name').populate('movie', 'title');

    if (!sale) return res.status(404).json({ error: '❌ Venta no encontrada. Código inválido.' });
    
    if (sale.status === 'redeemed') {
      return res.status(400).json({ error: `❌ ESTA FACTURA YA FUE CANJEADA el ${new Date(sale.updatedAt).toLocaleDateString('es-CO')}` });
    }
    
    if (sale.status !== 'confirmed') {
      return res.status(400).json({ error: `❌ Esta venta está en estado: ${sale.status}` });
    }

    // Canjeamos (cambiamos estado a redeemed)
    sale.status = 'redeemed';
    await sale.save();

    res.json({ 
      message: `✅ ¡Factura canjeada exitosamente! Entregar boletas a: ${sale.user.name}`, 
      sale 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al canjear la factura' });
  }
});

module.exports = router;