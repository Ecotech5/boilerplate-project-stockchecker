'use strict';

const fetch = require('node-fetch');
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: [String] // Store hashed/truncated IPs
});
const Stock = mongoose.model('Stock', stockSchema);

function hashIP(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0'; // Normalize IP (e.g., 192.168.1.23 → 192.168.1.0)
}

async function fetchStockData(stock) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch data for ${stock}`);
  const data = await response.json();
  return { stock: data.symbol, price: data.latestPrice };
}

async function handleStock(stock, like, ip) {
  const { stock: symbol, price } = await fetchStockData(stock);
  const hashedIP = hashIP(ip);

  let stockDoc = await Stock.findOne({ symbol });

  if (!stockDoc) {
    stockDoc = new Stock({ symbol, likes: like ? [hashedIP] : [] });
  } else if (like && !stockDoc.likes.includes(hashedIP)) {
    stockDoc.likes.push(hashedIP);
  }

  await stockDoc.save();

  return {
    stock: symbol,
    price,
    likes: stockDoc.likes.length
  };
}

module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = req.ip;
    const likeFlag = like === 'true' || like === true;

    try {
      if (Array.isArray(stock) && stock.length === 2) {
        const [s1, s2] = await Promise.all([
          handleStock(stock[0], likeFlag, ip),
          handleStock(stock[1], likeFlag, ip)
        ]);

        return res.json({
          stockData: [
            {
              stock: s1.stock,
              price: s1.price,
              rel_likes: s1.likes - s2.likes
            },
            {
              stock: s2.stock,
              price: s2.price,
              rel_likes: s2.likes - s1.likes
            }
          ]
        });
      }

      // Single stock
      const result = await handleStock(stock, likeFlag, ip);
      return res.json({ stockData: result });

    } catch (err) {
      console.error('API Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
