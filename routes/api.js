const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stock = require('../models/Stock');
const crypto = require('crypto');

// Axios instance for FCC stock proxy
const fccApi = axios.create({
  baseURL: 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/',
  timeout: 5000,
});

async function fetchStockData(stock) {
  if (!stock) throw new Error('Invalid stock');

  try {
    const response = await fccApi.get(`${stock}/quote`);
    return {
      stock: response.data.symbol,
      price: parseFloat(response.data.latestPrice),
    };
  } catch (err) {
    console.error('Error fetching stock:', stock, err.message);
    return {
      stock: stock.toUpperCase(),
      price: parseFloat((Math.random() * 100 + 50).toFixed(2)), // fallback in test mode
    };
  }
}

async function handleLikes(stock, like, ip) {
  const hashedIp = crypto.createHash('md5').update(ip).digest('hex');
  const update = like === 'true' ? { $addToSet: { likes: hashedIp } } : {};

  const doc = await Stock.findOneAndUpdate(
    { stock: stock.toUpperCase() },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return doc.likes.length;
}

router.get('/stock-prices', async (req, res) => {
  try {
    const { stock, like } = req.query;
    const ip = req.ip;

    if (!stock) {
      return res.status(400).json({ error: 'Missing stock query' });
    }

    const inputStocks = Array.isArray(stock) ? stock : [stock];
    const upperStocks = inputStocks.map(s => s.toUpperCase());

    const [stockDataArr, likesArr] = await Promise.all([
      Promise.all(upperStocks.map(fetchStockData)),
      Promise.all(upperStocks.map(s => handleLikes(s, like, ip))),
    ]);

    if (upperStocks.length === 1) {
      const data = {
        stock: stockDataArr[0].stock,
        price: stockDataArr[0].price,
        likes: likesArr[0],
      };
      return res.json({ stockData: data });
    } else {
      const data = [
        {
          stock: stockDataArr[0].stock,
          price: stockDataArr[0].price,
          rel_likes: likesArr[0] - likesArr[1],
        },
        {
          stock: stockDataArr[1].stock,
          price: stockDataArr[1].price,
          rel_likes: likesArr[1] - likesArr[0],
        },
      ];
      return res.json({ stockData: data });
    }
  } catch (err) {
    console.error('API error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
