// routes/api.js
const express = require('express');
const router = express.Router();
const { handleStockRequest } = require('../controllers/stockController');

router.get('/stock-prices', handleStockRequest);

module.exports = router;
