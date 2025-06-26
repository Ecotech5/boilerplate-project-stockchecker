const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const Stock = require('../models/Stock');
const router = express.Router();

// IP anonymizer
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Get stock price from FCC proxy
async function fetchPrice(symbol) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data || !data.symbol || !data.latestPrice) {
    throw new Error('Invalid stock symbol');
  }
  return {
    stock: data.symbol,
    price: data.latestPrice
  };
}

// Like handler
async function handleLike(symbol, ipHash, like) {
  let stock = await Stock.findOne({ stock: symbol });
  if (!stock) {
    stock = new Stock({ stock: symbol, likes: [] });
  }

  if (like && !stock.likes.includes(ipHash)) {
    stock.likes.push(ipHash);
    await stock.save();
  }

  return stock.likes.length;
}

// Main route
router.get('/stock-prices', async (req, res) => {
  try {
    let { stock, like } = req.query;
    const ipHash = hashIP(req.ip);
    like = like === 'true' || like === true;

    if (!stock) return res.status(400).json({ error: 'Stock is required' });

    if (Array.isArray(stock)) {
      const [s1, s2] = stock.map(s => s.toUpperCase());
      const [data1, data2] = await Promise.all([fetchPrice(s1), fetchPrice(s2)]);
      const [likes1, likes2] = await Promise.all([
        handleLike(s1, ipHash, like),
        handleLike(s2, ipHash, like)
      ]);

      return res.json({
        stockData: [
          { stock: data1.stock, price: data1.price, rel_likes: likes1 - likes2 },
          { stock: data2.stock, price: data2.price, rel_likes: likes2 - likes1 }
        ]
      });
    } else {
      const symbol = stock.toUpperCase();
      const data = await fetchPrice(symbol);
      const likes = await handleLike(symbol, ipHash, like);

      return res.json({
        stockData: {
          stock: data.stock,
          price: data.price,
          likes
        }
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve stock data' });
  }
});

module.exports = router;
