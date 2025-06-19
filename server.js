
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes/api');  // Main API routes
const fccTestingRoutes = require('./routes/fcctesting');  // FCC testing routes
const runner = require('./test-runner');  // Test runner

const app = express();

// Middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'"
  );
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  });

// Routes
app.use('/api', apiRoutes);  // Main API endpoints
fccTestingRoutes(app);  // FCC testing endpoints

// Homepage
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('⚠️ Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Server startup
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start tests if in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Running tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (err) {
        console.error('❌ Test runner error:', err);
      }
    }, 1500);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('💤 Server terminated');
      process.exit(0);
    });
  });
});

module.exports = app;
