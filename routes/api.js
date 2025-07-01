const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const Stock = require('../models/Stock');
const router = express.Router();

// Hash IP
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Fetch stock price from FCC proxy
async function fetchPrice(symbol) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data || !data.symbol || !data.latestPrice) {
    throw new Error('Invalid stock symbol');
  }
  return {
    stock: data.symbol,
    price: parseFloat(data.latestPrice)
  };
}

// Get likes and apply "like" if valid
async function getOrUpdateStock(symbol, ipHash, like) {
  let stockDoc = await Stock.findOne({ stock: symbol });

  if (!stockDoc) {
    stockDoc = new Stock({ stock: symbol, likes: [] });
  }

  if (like && !stockDoc.likes.includes(ipHash)) {
    stockDoc.likes.push(ipHash);
  }

  await stockDoc.save();
  return stockDoc.likes.length;
}

router.get('/stock-prices', async (req, res) => {
  try {
    let { stock, like } = req.query;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const ipHash = hashIP(ip);
    like = like === 'true' || like === true;

    if (!stock) return res.status(400).json({ error: 'Stock is required' });

    // Dual stock query
    if (Array.isArray(stock)) {
      const [s1, s2] = stock.map(s => s.toUpperCase());

      const [info1, info2] = await Promise.all([
        fetchPrice(s1),
        fetchPrice(s2)
      ]);

      const [likes1, likes2] = await Promise.all([
        getOrUpdateStock(s1, ipHash, like),
        getOrUpdateStock(s2, ipHash, like)
      ]);

      return res.json({
        stockData: [
          {
            stock: info1.stock,
            price: info1.price,
            rel_likes: likes1 - likes2
          },
          {
            stock: info2.stock,
            price: info2.price,
            rel_likes: likes2 - likes1
          }
        ]
      });
    }

    // Single stock query
    const symbol = stock.toUpperCase();
    const stockInfo = await fetchPrice(symbol);
    const likes = await getOrUpdateStock(symbol, ipHash, like);

    return res.json({
      stockData: {
        stock: stockInfo.stock,
        price: stockInfo.price,
        likes
      }
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve stock data' });
  }
});

module.exports = router;
