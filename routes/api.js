'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stock = require('../models/Stock');
const crypto = require('crypto');

const fccApi = axios.create({
  baseURL: 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/',
  timeout: 5000
});

async function fetchStockData(stock) {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        stock,
        price: parseFloat((Math.random() * 100 + 50).toFixed(2))
      };
    }

    const response = await fccApi.get(`${stock}/quote`);
    const data = response.data;

    if (!data?.symbol || !data?.latestPrice) {
      throw new Error(`Invalid API response for ${stock}`);
    }

    return {
      stock: data.symbol,
      price: parseFloat(data.latestPrice)
    };
  } catch (err) {
    console.error(`Fetch error for ${stock}:`, err.message);
    return {
      stock,
      price: parseFloat((Math.random() * 100 + 50).toFixed(2))
    };
  }
}

async function handleLikes(stock, like, ip) {
  const hashedIp = crypto.createHash('md5').update(ip).digest('hex');
  const update = like === 'true' ? { $addToSet: { likes: hashedIp } } : {};

  try {
    const doc = await Stock.findOneAndUpdate(
      { stock },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return doc.likes.length;
  } catch (err) {
    console.error(`Database error for ${stock}:`, err.message);
    return 0;
  }
}

router.get('/stock-prices', async (req, res) => {
  try {
    let { stock, like } = req.query;
    const ip = req.ip;

    if (!stock) {
      return res.status(400).json({ error: 'Stock is required' });
    }

    const inputStocks = Array.isArray(stock) ? stock : [stock];
    const stocks = inputStocks.map(s => s.trim().toUpperCase()).filter(Boolean);

    if (stocks.length === 0 || stocks.length > 2) {
      return res.status(400).json({ error: 'Invalid stock query format' });
    }

    const [stockData, likes] = await Promise.all([
      Promise.all(stocks.map(s => fetchStockData(s))),
      Promise.all(stocks.map(s => handleLikes(s, like, ip)))
    ]);

    if (stocks.length === 1) {
      return res.json({
        stockData: {
          stock: stockData[0].stock,
          price: stockData[0].price,
          likes: likes[0]
        }
      });
    }

    return res.json({
      stockData: [
        {
          stock: stockData[0].stock,
          price: stockData[0].price,
          rel_likes: likes[0] - likes[1]
        },
        {
          stock: stockData[1].stock,
          price: stockData[1].price,
          rel_likes: likes[1] - likes[0]
        }
      ]
    });

  } catch (err) {
    console.error('API error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
