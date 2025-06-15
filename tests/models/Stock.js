// models/Stock.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true },
  likes: { type: Number, default: 0 },
  ips: [String]
});

module.exports = mongoose.model('Stock', stockSchema);