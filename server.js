'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Load .env variables

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// ✅ CSP headers (only allow self-hosted scripts & styles) — Challenge 2
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'"
  );
  next();
});

// Serve public assets
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); // For FCC test compatibility
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Connect to MongoDB using .env MONGO_URI
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit if DB fails
  });

// Serve HTML homepage
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC test routes
fccTestingRoutes(app);

// Project API routes
app.use(apiRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Run tests if in test mode
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Running tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (err) {
        console.log('❌ Test runner error:');
        console.error(err);
      }
    }, 3500);
  }
});

module.exports = app; // For testing
