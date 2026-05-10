const express = require('express');
const Food = require('../models/Food');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadFood } = require('../middleware/upload');
const router = express.Router();

// Devuelve todos los productos de comida activos, ordenados de más reciente a más antiguo.
router.get('/', async (req, res) => {
  try {
    res.json(await Food.find({ active: true }).sort({ createdAt: -1 }));
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

// Crea un nuevo producto de comida. Convierte price a número flotante.
// Si se sube una imagen, guarda su ruta. Solo accesible para administradores autenticados.
router.post('/', auth, adminOnly, uploadFood.single('image'), async (req, res) => {
  try {
    const d = { ...req.body };
    d.price = parseFloat(d.price);
    if (req.file) d.image = `/uploads/foods/${req.file.filename}`;

    res.status(201).json(await Food.create(d));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Actualiza un producto por ID. Reconvierte price si se envía.
// Conserva la imagen existente si no se sube una nueva.
// Solo accesible para administradores autenticados.
router.put('/:id', auth, adminOnly, uploadFood.single('image'), async (req, res) => {
  try {
    const ex = await Food.findById(req.params.id);
    if (!ex) return res.status(404).json({ error: 'No' });

    const d = { ...req.body };
    if (d.price) d.price = parseFloat(d.price);
    if (req.file) d.image = `/uploads/foods/${req.file.filename}`;
    else if (!d.image) d.image = ex.image;

    res.json(await Food.findByIdAndUpdate(req.params.id, d, { returnDocument: 'after' }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Elimina (soft delete) un producto por ID marcándolo como active: false.
// Solo accesible para administradores autenticados.
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const i = await Food.findByIdAndUpdate(req.params.id, { active: false });
    if (!i) return res.status(404).json({ error: 'No' });

    res.json({ message: 'Eliminado' });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;