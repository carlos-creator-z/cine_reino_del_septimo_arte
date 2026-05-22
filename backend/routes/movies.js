const express = require('express');
const Movie = require('../models/Movie');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadPoster } = require('../middleware/upload');
const router = express.Router();

// Devuelve todas las películas activas, ordenadas de más reciente a más antigua.
router.get('/', async (req, res) => {
  try {
    res.json(await Movie.find({ active: true }).sort({ createdAt: -1 }));
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

// Crea una nueva película. Si se sube un póster, guarda su ruta.
// Parsea formats y schedules desde JSON o string separado por comas.
// Solo accesible para administradores autenticados.
router.post('/', auth, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) data.poster = req.file.path; // Cloudinary devuelve la URL completa en req.file.path

    if (typeof data.formats === 'string') {
      try { data.formats = JSON.parse(data.formats); }
      catch { data.formats = data.formats.split(','); }
    }
    if (typeof data.schedules === 'string') {
      try { data.schedules = JSON.parse(data.schedules); }
      catch { data.schedules = data.schedules.split(','); }
    }

    res.status(201).json(await Movie.create(data));
  } catch (error) {
    res.status(400).json({ error: 'Error al crear película: ' + error.message });
  }
});

// Actualiza una película por ID. Conserva el póster existente si no se sube uno nuevo.
// Parsea formats y schedules igual que en el POST.
// Solo accesible para administradores autenticados.
router.put('/:id', auth, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const existing = await Movie.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Película no encontrada' });

    const data = { ...req.body };

    if (req.file) data.poster = `/uploads/posters/${req.file.filename}`;
    else if (!data.poster) data.poster = existing.poster;

    if (typeof data.formats === 'string') {
      try { data.formats = JSON.parse(data.formats); }
      catch { data.formats = data.formats.split(','); }
    }
    if (typeof data.schedules === 'string') {
      try { data.schedules = JSON.parse(data.schedules); }
      catch { data.schedules = data.schedules.split(','); }
    }

    res.json(await Movie.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true }));
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar: ' + error.message });
  }
});

// Elimina (soft delete) una película por ID marcándola como active: false.
// Solo accesible para administradores autenticados.
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const m = await Movie.findByIdAndUpdate(req.params.id, { active: false }, { returnDocument: 'after' });
    if (!m) return res.status(404).json({ error: 'No encontrada' });

    res.json({ message: 'Eliminada' });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;