'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Helmet security policies
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

// Routes
require('./routes/fcctesting')(app);
app.use('/api', require('./routes/api'));

// 404 handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// Connect to MongoDB and start server
async function startServer() {
  try {
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
