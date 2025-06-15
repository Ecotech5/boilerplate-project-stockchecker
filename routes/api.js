const fetch = require('node-fetch');
const mongoose = require('mongoose');

// Schema and model
const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: [String]  // Hashed IPs
});
const Stock = mongoose.model('Stock', stockSchema);

// Simple anonymization of IP
function hashIP(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

// Fetch stock data and handle likes
async function getStockData(stock, like, ip) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch stock data for ${stock}`);

  const data = await res.json();
  const symbol = data.symbol;
  const price = data.latestPrice;
  const hashedIP = hashIP(ip);

  let stockDoc = await Stock.findOne({ symbol });
  if (!stockDoc) {
    stockDoc = new Stock({
      symbol,
      likes: like ? [hashedIP] : []
    });
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

// Route handler
module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = req.ip;

    try {
      if (Array.isArray(stock)) {
        const [data1, data2] = await Promise.all([
          getStockData(stock[0], like === 'true', ip),
          getStockData(stock[1], like === 'true', ip)
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
        const data = await getStockData(stock, like === 'true', ip);
        return res.json({
          stockData: {
            stock: data.stock,
            price: data.price,
            likes: data.likes
          }
        });
      }
    } catch (err) {
      console.error('API error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
