const axios = require('axios');
const Stock = require('../models/Stock'); // your Mongoose model
const fetch = require('node-fetch'); // you can also use axios if preferred

const getPrice = async (stockSymbol) => {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`;
  const res = await fetch(url);
  const data = await res.json();
  return data.latestPrice;
};

const handleStock = async (stock, like, ip) => {
  const symbol = stock.toUpperCase();
  let price;

  try {
    price = await getPrice(symbol);
  } catch (err) {
    throw new Error(`Failed to fetch price for ${symbol}`);
  }

  let stockDoc = await Stock.findOne({ stock: symbol });

  if (!stockDoc) {
    stockDoc = new Stock({ stock: symbol, likes: [] });
  }

  if (like && !stockDoc.likes.includes(ip)) {
    stockDoc.likes.push(ip);
    await stockDoc.save();
  }

  return {
    stock: symbol,
    price,
    likes: stockDoc.likes.length
  };
};

const getStockData = async (req, res) => {
  try {
    const { stock, like } = req.query;
    const ip = req.ip;

    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    if (Array.isArray(stock)) {
      const [stock1, stock2] = await Promise.all([
        handleStock(stock[0], like, ip),
        handleStock(stock[1], like, ip)
      ]);

      const rel_likes1 = stock1.likes - stock2.likes;
      const rel_likes2 = stock2.likes - stock1.likes;

      return res.json({
        stockData: [
          { stock: stock1.stock, price: stock1.price, rel_likes: rel_likes1 },
          { stock: stock2.stock, price: stock2.price, rel_likes: rel_likes2 }
        ]
      });
    } else {
      const stockData = await handleStock(stock, like, ip);
      return res.json({ stockData });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = getStockData;
