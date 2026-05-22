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
    if (req.file) d.poster = req.file.path; // <--- CORREGIDO: Cloudinary devuelve la URL completa aquí

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
    if (req.file) d.poster = req.file.path; // <--- CORREGIDO: era data.poster, es d.poster
    else if (!d.poster) d.poster = ex.poster;

    res.json(await ComingSoon.findByIdAndUpdate(req.params.id, d, { returnDocument: 'after' }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Solo accesible para administradores autenticados.
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await ComingSoon.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado permanentemente' });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;