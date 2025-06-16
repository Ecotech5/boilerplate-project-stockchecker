const express = require('express');
const router = express.Router();
const handleStockRequest = require('./stockdata'); // assuming same folder

router.get('/api/stock-prices', getStockData);

module.exports = router;

