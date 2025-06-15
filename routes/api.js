const fetch = require('node-fetch');
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: [String] // list of IPs
});

const Stock = mongoose.model('Stock', stockSchema);

function hashIP(ip) {
  // Normalize IP to /24 subnet for basic deduplication
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

async function getStockData(stock, like, ip) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Failed to fetch data for ${stock}`);

  const data = await res.json();
  const symbol = data.symbol?.toUpperCase();
  const price = Number(data.latestPrice); // ensure it's a number
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

    try {
      if (Array.isArray(stock)) {
        const [stock1, stock2] = await Promise.all([
          getStockData(stock[0], like === 'true', ip),
          getStockData(stock[1], like === 'true', ip)
        ]);

        res.json({
          stockData: [
            {
              stock: stock1.stock,
              price: stock1.price,
              rel_likes: stock1.likes - stock2.likes
            },
            {
              stock: stock2.stock,
              price: stock2.price,
              rel_likes: stock2.likes - stock1.likes
            }
          ]
        });
      } else {
        const stockData = await getStockData(stock, like === 'true', ip);
        res.json({
          stockData: {
            stock: stockData.stock,
            price: stockData.price,
            likes: stockData.likes
          }
        });
      }
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'Unable to fetch stock data' });
    }
  });
};
