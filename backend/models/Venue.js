const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  city: { type: String, required: true, lowercase: true, trim: true },

  name: { type: String, required: true, trim: true },

  address: { type: String, required: true },

  services: { type: String, default: '' },
  
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Venue', venueSchema);