'use strict';

const fetch = require('node-fetch');
const mongoose = require('mongoose');

// Schema to store stock symbol and liked IPs
const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  likes: [String] // Stores hashed IPs
});

const Stock = mongoose.model('Stock', stockSchema);

// Normalize IP (e.g. 105.3.90.21 -> 105.3.90.0)
function hashIP(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

// Fetch price data from FCC proxy
async function fetchStockData(symbol) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
  );

  if (!response.ok) throw new Error(`Unable to fetch data for ${symbol}`);

  const data = await response.json();

  return {
    stock: data.symbol,
    price: data.latestPrice
  };
}

// Handles like logic and DB updates
async function handleStock(symbol, like, ip) {
  const stockInfo = await fetchStockData(symbol);
  const hashedIP = hashIP(ip);

  let stockDoc = await Stock.findOne({ symbol: stockInfo.stock });

  if (!stockDoc) {
    stockDoc = new Stock({ symbol: stockInfo.stock, likes: like ? [hashedIP] : [] });
  } else {
    if (like && !stockDoc.likes.includes(hashedIP)) {
      stockDoc.likes.push(hashedIP);
    }
  }

  await stockDoc.save();

  return {
    stock: stockInfo.stock,
    price: stockInfo.price,
    likes: stockDoc.likes.length
  };
}

// Route logic
module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = req.ip;
    const likeFlag = like === 'true' || like === true;

    try {
      if (Array.isArray(stock) && stock.length === 2) {
        const [data1, data2] = await Promise.all([
          handleStock(stock[0], likeFlag, ip),
          handleStock(stock[1], likeFlag, ip)
        ]);

        return res.json({
          stockData: [
            {
              stock: data1.stock,
              price: data1.price,
              rel_likes: data1.likes - data2.likes
            },
            {
              stock: data2.stock,
              price: data2.price,
              rel_likes: data2.likes - data1.likes
            }
          ]
        });
      } else {
        const data = await handleStock(stock, likeFlag, ip);
        return res.json({ stockData: data });
      }
    } catch (err) {
      console.error('API Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
