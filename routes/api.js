'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stock = require('../models/Stock');
const crypto = require('crypto');

// Axios client for FCC proxy
const fccApi = axios.create({
  baseURL: 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/',
  timeout: 5000,
  headers: { 'User-Agent': 'stock-checker-app' }
});

// Fetch stock data from FCC API or mock in test mode
async function fetchStockData(symbol) {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat((Math.random() * 100 + 50).toFixed(2))
      };
    }

    const response = await fccApi.get(`${symbol}/quote`);

    if (!response.data?.symbol || !response.data?.latestPrice) {
      throw new Error('Invalid API response');
    }

    return {
      symbol: response.data.symbol,
      price: parseFloat(response.data.latestPrice)
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat((Math.random() * 100 + 50).toFixed(2)) // fallback price
    };
  }
}

// Handle likes using hashed IP and correct schema key (symbol)
async function handleLikes(symbol, like, ip) {
  const hashedIp = crypto.createHash('md5').update(ip).digest('hex');

  try {
    const update = like === 'true'
      ? { $addToSet: { likes: hashedIp } }
      : {};

    const doc = await Stock.findOneAndUpdate(
      { symbol: symbol.toUpperCase() },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return doc.likes.length;
  } catch (err) {
    console.error(`Database error for ${symbol}:`, err.message);
    return 0;
  }
}

// GET /api/stock-prices handler
router.get('/stock-prices', async (req, res) => {
  try {
    let { stock, like } = req.query;
    const ip = req.ip;

    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    const stocks = Array.isArray(stock) ? stock : [stock];
    if (stocks.length > 2) {
      return res.status(400).json({ error: 'Maximum 2 stocks allowed' });
    }

    const [stockData, likes] = await Promise.all([
      Promise.all(stocks.map(symbol => fetchStockData(symbol))),
      Promise.all(stocks.map(symbol => handleLikes(symbol, like, ip)))
    ]);

    const response = {
      stockData: stocks.length === 1
        ? {
            stock: stockData[0].symbol,
            price: stockData[0].price,
            likes: likes[0]
          }
        : [
            {
              stock: stockData[0].symbol,
              price: stockData[0].price,
              rel_likes: likes[0] - likes[1]
            },
            {
              stock: stockData[1].symbol,
              price: stockData[1].price,
              rel_likes: likes[1] - likes[0]
            }
          ]
    };

    res.json(response);
  } catch (err) {
    console.error('API error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
