'use strict';
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// 🔐 Helmet Security Middleware with proper Content Security Policy (CSP)
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  })
);

// Allow requests from any origin for testing purposes
app.use(cors({ origin: '*' }));

// Parse JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from /public
app.use('/public', express.static(process.cwd() + '/public'));

// 📄 Serve the index HTML page
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// 📁 FCC Testing Routes
fccTestingRoutes(app);

// 📦 API Routes
apiRoutes(app);

// ❌ 404 Middleware for unmatched routes
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${listener.address().port}`);

  // Run tests if in test mode
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (err) {
        console.log('❌ Tests are not valid:');
        console.error(err);
      }
    }, 3500);
  }
});

module.exports = app; // Export for testing
