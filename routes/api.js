const express = require('express');
const router = express.Router();

const getStockData = require('./stockdata'); // ✅ Import the function properly

// Use this route exactly as required by FreeCodeCamp
router.get('/api/stock-prices', getStockData);

module.exports = router;
