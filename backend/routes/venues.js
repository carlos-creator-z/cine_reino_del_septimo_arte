const express = require('express');
const Venue = require('../models/Venue');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Obtiene todos los venues activos; si se pasa ?city= filtra por ciudad,
// y si no encuentra resultados devuelve hasta 3 venues de cualquier ciudad.
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    let items;

    if (city) {
      items = await Venue.find({ city, active: true });
      if (!items.length) items = await Venue.find({ active: true }).limit(3);
    } else {
      items = await Venue.find({ active: true }).sort({ city: 1, name: 1 });
    }

    res.json(items);
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

// Crea un nuevo venue. Normaliza el campo city a slug (minúsculas, sin tildes, guiones).
// Solo accesible para administradores autenticados.
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const d = { ...req.body };
    d.city = d.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

    res.status(201).json(await Venue.create(d));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Actualiza un venue por ID. Si se modifica city, aplica la misma normalización del POST.
// Solo accesible para administradores autenticados.
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const ex = await Venue.findById(req.params.id);
    if (!ex) return res.status(404).json({ error: 'No' });

    const d = { ...req.body };
    if (d.city) {
      d.city = d.city
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');
    }

    res.json(await Venue.findByIdAndUpdate(req.params.id, d, { returnDocument: 'after' }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Elimina (soft delete) un venue por ID marcándolo como active: false.
// Solo accesible para administradores autenticados.
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const i = await Venue.findByIdAndUpdate(req.params.id, { active: false });
    if (!i) return res.status(404).json({ error: 'No' });

    res.json({ message: 'Eliminado' });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;