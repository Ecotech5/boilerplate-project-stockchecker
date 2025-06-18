const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
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

// Create index
stockSchema.index({ stock: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);