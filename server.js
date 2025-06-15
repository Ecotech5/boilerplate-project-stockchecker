'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // ✅ Load environment variables from .env

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// ✅ Security headers (Challenge Requirement #2)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'");
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); // Allow FCC testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Index route
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC Testing Routes
fccTestingRoutes(app);

// API Routes
apiRoutes(app);

// 404 Not Found middleware
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
});

module.exports = app; // For testing
