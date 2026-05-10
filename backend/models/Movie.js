const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },

  genre: { type: String, required: true },

  category: { type: String, required: true },

  status: { type: String, default: 'Estreno', enum: ['Estreno', 'Preventa', 'Cartelera'] },

  rating: { type: String, required: true },

  release_date: { type: String, required: true },

  poster: { type: String, default: '' },

  description: { type: String, default: '' },

  director: { type: String, default: '' },

  duration: { type: String, default: '' },

  actors: { type: String, default: '' },

  synopsis: { type: String, default: '' },

  trailer: { type: String, default: '' },

  formats: [{ type: String }],

  schedules: [{ type: String }],
  
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);