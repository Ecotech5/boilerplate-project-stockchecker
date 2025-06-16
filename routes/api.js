const fetch = require('node-fetch');
const mongoose = require('mongoose');

// MongoDB Schema
const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: [String], // hashed IPs
});
const Stock = mongoose.model('Stock', stockSchema);

// Helper: Fetch stock price from FreeCodeCamp's stock API
async function fetchStockData(symbol) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Stock not found');
  const data = await response.json();
  return { symbol: data.symbol, price: data.latestPrice };
}

// Helper: Hash IP to restrict likes per IP
function hashIP(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0'; // Subnet mask-style hash
}

// Helper: Get or update stock data in DB
async function processStock(symbol, like, ip) {
  const { symbol: sym, price } = await fetchStockData(symbol);
  const hashedIP = hashIP(ip);

  let stock = await Stock.findOne({ symbol: sym });

  if (!stock) {
    stock = new Stock({ symbol: sym, likes: like ? [hashedIP] : [] });
  } else if (like && !stock.likes.includes(hashedIP)) {
    stock.likes.push(hashedIP);
  }

  await stock.save();

  return {
    stock: sym,
    price,
    likes: stock.likes.length
  };
}

// Main API route
module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    try {
      const { stock, like } = req.query;
      const ip = req.ip;
      const likeFlag = like === 'true';

      // Single stock query
      if (typeof stock === 'string') {
        const result = await processStock(stock.toUpperCase(), likeFlag, ip);

        return res.json({
          stockData: {
            stock: result.stock,
            price: result.price,
            likes: result.likes
          }
        });
      }

      // Dual stock query
      if (Array.isArray(stock) && stock.length === 2) {
        const [stock1, stock2] = await Promise.all([
          processStock(stock[0].toUpperCase(), likeFlag, ip),
          processStock(stock[1].toUpperCase(), likeFlag, ip)
        ]);

        const rel_likes1 = stock1.likes - stock2.likes;
        const rel_likes2 = stock2.likes - stock1.likes;

        return res.json({
          stockData: [
            { stock: stock1.stock, price: stock1.price, rel_likes: rel_likes1 },
            { stock: stock2.stock, price: stock2.price, rel_likes: rel_likes2 }
          ]
        });
      }

      res.status(400).json({ error: 'Invalid stock query format' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error while processing request' });
    }
  });
};
