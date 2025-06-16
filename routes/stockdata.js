// routes/stockdata.js
const fetch = require('node-fetch');
const Stock = require('../models/Stock');

async function handleStockRequest(req, res) {
  try {
    const { stock, like } = req.query;
    const ip = req.ip;
    const stocks = Array.isArray(stock) ? stock : [stock];

    const stockData = await Promise.all(
      stocks.map(async (symbol) => {
        const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
        const data = await response.json();

        if (!data.symbol) {
          return { error: `Invalid stock symbol: ${symbol}` };
        }

        let stockDoc = await Stock.findOne({ stock: symbol.toUpperCase() });
        if (!stockDoc) {
          stockDoc = new Stock({ stock: symbol.toUpperCase(), likes: [] });
        }

        if (like === 'true' && !stockDoc.likes.includes(ip)) {
          stockDoc.likes.push(ip);
          await stockDoc.save();
        }

        return {
          stock: stockDoc.stock,
          price: parseFloat(data.latestPrice),
          likes: stockDoc.likes.length,
        };
      })
    );

    if (stockData.length === 2) {
      const [stock1, stock2] = stockData;
      return res.json({
        stockData: [
          {
            stock: stock1.stock,
            price: stock1.price,
            rel_likes: stock1.likes - stock2.likes,
          },
          {
            stock: stock2.stock,
            price: stock2.price,
            rel_likes: stock2.likes - stock1.likes,
          },
        ],
      });
    }

    return res.json({ stockData: stockData[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = handleStockRequest;
