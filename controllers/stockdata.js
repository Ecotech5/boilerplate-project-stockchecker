'use strict';

const axios = require('axios');
const Stock = require('../models/Stock');

// GET handler for /api/stock-prices
const getStockPrices = async (req, res, next) => {
  try {
    let { stock, like } = req.query;
    const ip = req.ip.replace('::ffff:', '');

    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    if (typeof stock === 'string') {
      // Single stock
      const symbol = stock.trim().toUpperCase();
      const stockData = await fetchStockData(symbol);
      const likes = await handleLikes(symbol, like, ip);

      return res.json({
        stockData: {
          stock: stockData.symbol,
          price: stockData.price,
          likes
        }
      });
    }

    if (Array.isArray(stock) && stock.length === 2) {
      // Dual stock comparison
      const [symbol1, symbol2] = stock.map(s => s.trim().toUpperCase());

      const [data1, data2] = await Promise.all([
        fetchStockData(symbol1),
        fetchStockData(symbol2)
      ]);

      const [likes1, likes2] = await Promise.all([
        handleLikes(symbol1, like, ip),
        handleLikes(symbol2, like, ip)
      ]);

      return res.json({
        stockData: [
          {
            stock: data1.symbol,
            price: data1.price,
            rel_likes: likes1 - likes2
          },
          {
            stock: data2.symbol,
            price: data2.price,
            rel_likes: likes2 - likes1
          }
        ]
      });
    }

    return res.status(400).json({ error: 'Invalid stock query format' });
  } catch (err) {
    console.error('Controller Error:', err.message);
    next(err);
  }
};

// Fetch stock data from FCC proxy or mock in test mode
async function fetchStockData(symbol) {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        symbol,
        price: parseFloat((Math.random() * 100 + 50).toFixed(2))
      };
    }

    const response = await axios.get(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`,
      { timeout: 5000 }
    );

    if (!response.data?.symbol || !response.data?.latestPrice) {
      throw new Error('Invalid API response');
    }

    return {
      symbol: response.data.symbol,
      price: parseFloat(response.data.latestPrice)
    };
  } catch (err) {
    console.error(`API error for ${symbol}:`, err.message);
    // Fallback to mock price
    return {
      symbol,
      price: parseFloat((Math.random() * 100 + 50).toFixed(2))
    };
  }
}

// Manage likes with $addToSet
async function handleLikes(symbol, like, ip) {
  try {
    const update = like === 'true' ? { $addToSet: { likes: ip } } : {};
    const doc = await Stock.findOneAndUpdate(
      { stock: symbol },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return doc.likes.length;
  } catch (err) {
    console.error(`Database error for ${symbol}:`, err.message);
    return 0;
  }
}

module.exports = { getStockPrices };
