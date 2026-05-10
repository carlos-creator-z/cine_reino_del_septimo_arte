const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  description: { type: String, default: '' },

  price: { type: Number, required: true, min: 0 },

  image: { type: String, default: '' },
  
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);