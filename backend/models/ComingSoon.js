const mongoose = require('mongoose');

const comingSoonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },

  genre: { type: String, required: true },

  release_date: { type: String, required: true },

  poster: { type: String, default: '' },
  
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ComingSoon', comingSoonSchema);