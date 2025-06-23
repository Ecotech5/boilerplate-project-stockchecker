'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const helmet = require('helmet');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FCC testing route
require('./routes/fcctesting')(app);

// Main API route
app.use('/api', require('./routes/api'));

// 404 handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
  const listener = app.listen(process.env.PORT || 3000, () =>
    console.log(`🚀 Server is running on port ${listener.address().port}`)
  );
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = app;
