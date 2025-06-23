'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const fccTestingRoutes = require('./routes/fcctesting');

const app = express();

// ✅ Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    }
  }
}));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FCC test routes
fccTestingRoutes(app); // ⬅️ this is a function, not a router

// ✅ Main API route
app.use('/api', apiRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');

  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server is running on port ${listener.address().port}`);
  });

}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = app; // ⬅️ Important for testing with Mocha
