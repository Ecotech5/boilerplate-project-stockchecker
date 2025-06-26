'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api.js');
require('dotenv').config();

const app = express();

// ✅ Helmet CSP for FreeCodeCamp requirement
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// ✅ Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB (no deprecated options)
async function connectToMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}
connectToMongo();

// ✅ Routes
app.use('/api', apiRoutes);

// ✅ Home Route
app.get('/', (req, res) => {
  res.send('Stock Price Checker is running...');
});

// ✅ Export app for testing
module.exports = app;

// ✅ Only start server if NOT in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
}
