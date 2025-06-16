// routes/stockdata.js
const fetch = require('node-fetch'); // Use native fetch in newer Node or import this for older versions
const Stock = require('../models/Stock'); // assuming you have a Mongoose model defined

async function getStockData(req, res) {
  const { stock, like } = req.query;
  const stockSymbol = stock.toUpperCase();

  try {
    // Fetch live stock price
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
    const data = await response.json();

    if (!data.symbol) {
      return res.status(400).json({ error: 'invalid stock symbol' });
    }

    let dbStock = await Stock.findOne({ stock: stockSymbol });
    if (!dbStock) {
      dbStock = new Stock({ stock: stockSymbol, likes: 0, ips: [] });
    }

    // Handle like
    const ip = req.ip;
    if (like === 'true' && !dbStock.ips.includes(ip)) {
      dbStock.likes++;
      dbStock.ips.push(ip);
    }

    await dbStock.save();

    return res.json({
      stockData: {
        stock: stockSymbol,
        price: parseFloat(data.latestPrice),
        likes: dbStock.likes
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = getStockData;
