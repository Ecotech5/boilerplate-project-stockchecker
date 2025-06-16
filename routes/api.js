const express = require('express');
const router = express.Router();
const { getStockPrices } = require('../controllers/stockdata');

/**
 * GET /api/stock-prices
 * Handles stock price checking with optional like functionality
 * 
 * @param {string} stock - Stock ticker symbol (or array of 2 symbols)
 * @param {boolean} [like] - Whether to like the stock(s)
 * 
 * Examples:
 * /api/stock-prices?stock=GOOG
 * /api/stock-prices?stock=GOOG&like=true
 * /api/stock-prices?stock=GOOG&stock=MSFT
 */
router.get('/stock-prices', async (req, res, next) => {
  try {
    // Validate query parameters
    const { stock, like } = req.query;
    
    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    // Process the request through the controller
    await getStockPrices(req, res, next);
  } catch (err) {
    console.error('API Route Error:', err);
    next(err);
  }
});

module.exports = router;