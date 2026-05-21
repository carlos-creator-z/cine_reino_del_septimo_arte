const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },

  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },

  schedule: { type: String, default: '' },

  format: { type: String, default: '2D' },

  quantity: { type: Number, default: 1, min: 1 },

  unit_price: { type: Number, required: true, min: 0 },

  total_price: { type: Number, required: true, min: 0 },

  status: { type: String, default: 'confirmed', enum: ['confirmed', 'cancelled', 'pending', 'redeemed'] },

  seats: { type: [String], default: [] }, // <--- ESTA LÍNEA ES LA QUE GUARDA LAS SILLAS (A1, C4, etc)
  
  foods: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    quantity: { type: Number, default: 1 },
    unit_price: { type: Number, default: 0 },
    total_price: { type: Number, default: 0 }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);