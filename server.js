'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fccTestingRoutes = require('./routes/fcctesting.js');
const apiRoutes = require('./routes/api.js');
const runner = require('./test-runner');

const app = express();

// ✅ Apply Helmet with correct CSP (must come before static/public routes)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"]
      }
    }
  })
);

// ✅ Serve static files (if needed)
app.use('/public', express.static(process.cwd() + '/public'));

// ✅ CORS (for FCC testing only)
app.use(cors({ origin: '*' }));

// ✅ Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ✅ Root page
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// ✅ FCC test routes
fccTestingRoutes(app);

// ✅ API routes
app.use('/api', apiRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Server and test runner
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Server listening on port ' + listener.address().port);

  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('❌ Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
});

module.exports = app;
