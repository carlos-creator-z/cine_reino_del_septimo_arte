const express = require('express');
const ComingSoon = require('../models/ComingSoon');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadPoster } = require('../middleware/upload');
const router = express.Router();

// Devuelve todos los próximos estrenos activos, ordenados por fecha de estreno ascendente.
router.get('/', async (req, res) => {
  try {
    res.json(await ComingSoon.find({ active: true }).sort({ release_date: 1 }));
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

// Crea un nuevo próximo estreno. Si se sube un póster, guarda su ruta.
// Solo accesible para administradores autenticados.
router.post('/', auth, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const d = { ...req.body };
    if (req.file) d.poster = `/uploads/posters/${req.file.filename}`;

    res.status(201).json(await ComingSoon.create(d));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Actualiza un próximo estreno por ID. Conserva el póster existente si no se sube uno nuevo.
// Solo accesible para administradores autenticados.
router.put('/:id', auth, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const ex = await ComingSoon.findById(req.params.id);
    if (!ex) return res.status(404).json({ error: 'No' });

    const d = { ...req.body };
    if (req.file) data.poster = req.file.path; // Cloudinary devuelve la URL completa en req.file.path
    else if (!d.poster) d.poster = ex.poster;

    res.json(await ComingSoon.findByIdAndUpdate(req.params.id, d, { returnDocument: 'after' }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Elimina (soft delete) un próximo estreno por ID marcándolo como active: false.
// Solo accesible para administradores autenticados.
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const i = await ComingSoon.findByIdAndUpdate(req.params.id, { active: false });
    if (!i) return res.status(404).json({ error: 'No' });

    res.json({ message: 'Eliminado' });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;