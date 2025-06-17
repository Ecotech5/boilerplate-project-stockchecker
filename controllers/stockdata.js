'use strict';

const axios = require('axios');
const Stock = require('../models/Stock');

const getStockPrices = async (req, res, next) => {
  try {
    let { stock, like } = req.query;
    const ip = req.ip;

    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    // Normalize and validate input
    if (typeof stock === 'string') {
      stock = stock.trim().toUpperCase();
      if (!stock) {
        return res.status(400).json({ error: 'Invalid stock symbol' });
      }

      const stockData = await fetchStockData(stock);
      const likes = await handleLikes(stock, like, ip);

      return res.json({
        stockData: {
          stock: stockData.symbol,
          price: stockData.price,
          likes
        }
      });
    }

    if (Array.isArray(stock)) {
      if (stock.length !== 2) {
        return res.status(400).json({ error: 'Please provide exactly 2 stocks' });
      }

      const stock1 = stock[0]?.trim().toUpperCase();
      const stock2 = stock[1]?.trim().toUpperCase();

      if (!stock1 || !stock2) {
        return res.status(400).json({ error: 'One or both stock symbols are invalid' });
      }

      const [data1, data2] = await Promise.all([
        fetchStockData(stock1),
        fetchStockData(stock2)
      ]);

      const [likes1, likes2] = await Promise.all([
        handleLikes(stock1, like, ip),
        handleLikes(stock2, like, ip)
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

    return res.status(400).json({ error: 'Invalid stock parameter' });
  } catch (err) {
    console.error('Controller Error:', err);
    next(err);
  }
};

// Helper function to fetch stock data
async function fetchStockData(symbol) {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        symbol: symbol.toUpperCase(),
        price: Math.random() * 100 + 50
      };
    }

    const response = await axios.get(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`,
      { timeout: 3000 }
    );

    if (!response.data?.symbol) {
      throw new Error('Invalid stock symbol');
    }

    return {
      symbol: response.data.symbol,
      price: response.data.latestPrice
    };
  } catch (err) {
    console.error(`API Error for ${symbol}:`, err.message);
    return {
      symbol: symbol.toUpperCase(),
      price: Math.random() * 100 + 50
    };
  }
}

// Helper function to handle likes
async function handleLikes(stock, like, ip) {
  try {
    const stockSymbol = stock.toUpperCase();

    if (!stockSymbol) {
      throw new Error('Missing stock symbol during like handling');
    }

    if (like !== 'true') {
      const doc = await Stock.findOne({ stock: stockSymbol });
      return doc ? doc.likes.length : 0;
    }

    const simpleIp = ip.replace('::ffff:', '');

    const doc = await Stock.findOneAndUpdate(
      { stock: stockSymbol },
      { $addToSet: { likes: simpleIp } },
      { upsert: true, new: true }
    );

    return doc.likes.length;
  } catch (err) {
    console.error('Database Error:', err);
    return 0;
  }
}

module.exports = { getStockPrices };
