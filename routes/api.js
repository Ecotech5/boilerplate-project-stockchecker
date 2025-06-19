const express = require('express');
const router = express.Router();
const { getStockPrices } = require('../controllers/stockdata'); // ✅ Make sure the path and function name match

router.get('/stock-prices', getStockPrices); // ✅ This will fail if getStockPrices is undefined

module.exports = router;
