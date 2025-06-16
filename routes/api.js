const express = require('express');
const router = express.Router();
const handleStockRequest = require('./stockdata'); // assuming same folder

router.get('/', getStockData);

module.exports = router;

