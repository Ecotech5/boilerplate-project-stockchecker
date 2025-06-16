const fetch = require('node-fetch');
const Stock = require('../models/Stock');

async function fetchStockInfo(stockSymbol) {
  const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
  const data = await response.json();
  if (!data.symbol) throw new Error('invalid stock symbol');
  return {
    stock: stockSymbol,
    price: parseFloat(data.latestPrice)
  };
}

async function processStock(stockSymbol, ip, like) {
  let dbStock = await Stock.findOne({ stock: stockSymbol });
  if (!dbStock) {
    dbStock = new Stock({ stock: stockSymbol, likes: 0, ips: [] });
  }

  if (like === 'true' && !dbStock.ips.includes(ip)) {
    dbStock.likes++;
    dbStock.ips.push(ip);
  }

  await dbStock.save();
  const stockInfo = await fetchStockInfo(stockSymbol);
  return {
    ...stockInfo,
    likes: dbStock.likes
  };
}

async function getStockData(req, res) {
  try {
    let { stock, like } = req.query;
    const ip = req.ip;

    // Handle multiple stocks
    if (Array.isArray(stock)) {
      const stock1 = stock[0].toUpperCase();
      const stock2 = stock[1].toUpperCase();

      const [data1, data2] = await Promise.all([
        processStock(stock1, ip, like),
        processStock(stock2, ip, like)
      ]);

      const relLikes1 = data1.likes - data2.likes;
      const relLikes2 = data2.likes - data1.likes;

      return res.json({
        stockData: [
          {
            stock: data1.stock,
            price: data1.price,
            rel_likes: relLikes1
          },
          {
            stock: data2.stock,
            price: data2.price,
            rel_likes: relLikes2
          }
        ]
      });
    } else {
      // Handle single stock
      const stockSymbol = stock.toUpperCase();
      const result = await processStock(stockSymbol, ip, like);

      return res.json({
        stockData: {
          stock: result.stock,
          price: result.price,
          likes: result.likes
        }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = getStockData;
