'use strict';

const express = require('express');
const router = express.Router();
const { getStockPrices } = require('../controllers/stockdata');

// Delegate GET requests to the controller
router.get('/stock-prices', getStockPrices);

module.exports = router;
