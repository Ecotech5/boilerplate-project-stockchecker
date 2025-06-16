const express = require('express');
const router = express.Router();
const handleStockRequest = require('./stockdata'); // assuming same folder

router.get('/stock-prices', handleStockRequest);

module.exports = router;
