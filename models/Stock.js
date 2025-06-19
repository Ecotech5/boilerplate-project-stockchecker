const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,        // Ensures stock is not null
    unique: true,          // Ensures no duplicate stocks
    index: true            // Indexed for fast lookup
  },
  likes: {
    type: [String],        // Store IPs as array of strings
    default: []
  }
});

module.exports = mongoose.model('Stock', stockSchema);
