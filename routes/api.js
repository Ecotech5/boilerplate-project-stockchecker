const express = require('express');
const router = express.Router();
const { getStockPrices } = require('../controllers/stockdata');

/**
 * GET /api/stock-prices
 * Handles stock price checking with optional like functionality
 * 
 * @param {string|string[]} stock - Stock ticker symbol (or array of 2 symbols)
 * @param {boolean} [like] - Whether to like the stock(s)
 * 
 * Examples:
 * /api/stock-prices?stock=GOOG
 * /api/stock-prices?stock=GOOG&like=true
 * /api/stock-prices?stock=GOOG&stock=MSFT
 */
router.get('/stock-prices', async (req, res, next) => {
  try {
    let { stock, like } = req.query;

    // Check if stock is missing
    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    // Normalize stock into array form
    const stockSymbols = Array.isArray(stock) ? stock : [stock];

    // Ensure no null/empty symbols are passed
    const invalidSymbols = stockSymbols.filter(sym => !sym || typeof sym !== 'string' || sym.trim() === '');
    if (invalidSymbols.length > 0) {
      return res.status(400).json({ error: 'Invalid or empty stock symbol(s) provided' });
    }

    // Pass the validated request to controller
    await getStockPrices(req, res, next);
  } catch (err) {
    console.error('API Route Error:', err);
    next(err);
  }
});

module.exports = router;
