'use strict';

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Helmet CSP config
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'"],
      "style-src": ["'self'"]
    }
  }
}));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Testing routes
require('./routes/fcctesting.js')(app);

// Main API route
app.use('/api', require('./routes/api.js'));

// 404 handler
app.use((req, res) => res.status(404).type('text').send('Not Found'));

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('Missing MONGO_URI in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connected');

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server is running on port ${listener.address().port}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}

startServer();

module.exports = app;
