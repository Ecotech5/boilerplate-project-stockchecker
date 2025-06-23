const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: { type: String, unique: true },  // ✅ Changed from 'symbol' to 'stock'
  likes: { type: [String], default: [] }
});

module.exports = mongoose.model('Stock', stockSchema);
