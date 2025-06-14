'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api'); // assuming your api.js is inside /routes
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

dotenv.config();

const app = express();

// ========== Middleware Setup ==========
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' })); // Enable CORS for FCC testing
app.use(helmet()); // Set security headers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== View & Routes ==========
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

fccTestingRoutes(app);
apiRoutes(app);

// ========== 404 Not Found Middleware ==========
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// ========== Start Server ==========
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:', e);
      }
    }, 1500);
  }
});

module.exports = app; // for testing
