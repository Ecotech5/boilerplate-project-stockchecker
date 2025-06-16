const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  likes: {
    type: [String],  // Store IP addresses as strings
    default: []
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Create index for faster queries
stockSchema.index({ stock: 1 });

module.exports = mongoose.model('Stock', stockSchema);