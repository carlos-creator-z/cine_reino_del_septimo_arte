const express = require('express');
const Movie = require('../models/Movie');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadPoster } = require('../middleware/upload');
const router = express.Router();

// Devuelve todas las películas activas
router.get('/', async (req, res) => {
  try {
    res.json(await Movie.find({ active: true }).sort({ createdAt: -1 }));
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

// Crear película
router.post('/', auth, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const data = { ...req.body };

    // Cloudinary devuelve la URL completa en req.file.path
    if (req.file) data.poster = req.file.path; 

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
    // Este console.log es VITAL para ver el error real en Render
    console.error('ERROR AL CREAR PELICULA:', error);
    res.status(400).json({ error: 'Error al crear película: ' + error.message });
  }
});

// Actualizar película
router.put('/:id', auth, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const existing = await Movie.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Película no encontrada' });

    const data = { ...req.body };

    // Cloudinary devuelve la URL completa en req.file.path
    if (req.file) data.poster = req.file.path; 
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
    console.error('ERROR AL ACTUALIZAR PELICULA:', error);
    res.status(400).json({ error: 'Error al actualizar: ' + error.message });
  }
});

// Eliminar película permanentemente
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const m = await Movie.findByIdAndDelete(req.params.id);
    if (!m) return res.status(404).json({ error: 'No encontrada' });
    res.json({ message: 'Eliminada permanentemente' });
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;