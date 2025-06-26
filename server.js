'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();
await mongoose.connect(...); // Good


const app = express();

// ✅ Helmet with content security policy to allow only self-hosted scripts/styles
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"]
    }
  })
);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FCC test routes
require('./routes/fcctesting')(app);

// ✅ Main API route
app.use('/api', require('./routes/api'));

// ✅ 404 Not Found middleware
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ MongoDB connection + start server only after successful connection
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
