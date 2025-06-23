'use strict';

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const fccTestingRoutes = require('./routes/fcctesting');

const app = express();

// ✅ Security and CSP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: true // ✅ FIXED: was [] (invalid), now true
    }
  }
}));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Mongoose connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stockchecker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ✅ Routes
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/_api', fccTestingRoutes);
app.use('/api', apiRoutes);

// ✅ Index page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// ✅ 404
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Server export for testing
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  }); // ✅ ← this was missing
}

module.exports = app;

