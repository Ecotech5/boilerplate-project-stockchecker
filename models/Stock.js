const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,
    uppercase: true,  // Removed `unique: true` from here (keep it only in schema.index)
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Stock symbol cannot be empty'
    }
  },
  likes: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Single index definition (combines uniqueness and performance)
stockSchema.index({ stock: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }  // Case-insensitive uniqueness
});

module.exports = mongoose.model('Stock', stockSchema);