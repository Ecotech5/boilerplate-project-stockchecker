const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stock = require('../models/Stock');
const crypto = require('crypto');

// Axios instance for FCC proxy
const fccApi = axios.create({
  baseURL: 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/',
  timeout: 5000,
});

async function fetchStockData(stock) {
  try {
    const res = await fccApi.get(`${stock}/quote`);
    return {
      stock: res.data.symbol,
      price: parseFloat(res.data.latestPrice),
    };
  } catch (err) {
    console.error(`Error fetching stock data for ${stock}:`, err.message);
    return { stock, price: null };
  }
}

async function updateLikes(stock, like, ip) {
  const hashedIp = crypto.createHash('md5').update(ip).digest('hex');

  const update = like === 'true' ? { $addToSet: { likes: hashedIp } } : {};
  const result = await Stock.findOneAndUpdate(
    { stock },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return result.likes.length;
}

router.get('/stock-prices', async (req, res) => {
  try {
    const { stock, like } = req.query;
    const ip = req.ip;

    if (!stock) return res.status(400).json({ error: 'Missing stock symbol' });

    const stocks = Array.isArray(stock) ? stock : [stock];
    const upper = stocks.map(s => s.toUpperCase());

    const stockData = await Promise.all(upper.map(fetchStockData));
    const likesData = await Promise.all(upper.map(s => updateLikes(s, like, ip)));

    if (upper.length === 1) {
      return res.json({
        stockData: {
          stock: stockData[0].stock,
          price: stockData[0].price,
          likes: likesData[0]
        }
      });
    }

    return res.json({
      stockData: [
        {
          stock: stockData[0].stock,
          price: stockData[0].price,
          rel_likes: likesData[0] - likesData[1],
        },
        {
          stock: stockData[1].stock,
          price: stockData[1].price,
          rel_likes: likesData[1] - likesData[0],
        }
      ]
    });

  } catch (error) {
    console.error('API error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
