'use strict';

const fetch = require('node-fetch');
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: [String]
});

const Stock = mongoose.model('Stock', stockSchema);

function hashIP(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0'; // Basic IP masking
}

async function fetchStockPrice(symbol) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data || !data.symbol || !data.latestPrice) {
    throw new Error('Invalid stock data');
  }
  return {
    stock: data.symbol,
    price: parseFloat(data.latestPrice)
  };
}

async function getStockData(symbol, like, ip) {
  const { stock, price } = await fetchStockPrice(symbol);
  const hashedIP = hashIP(ip);

  let stockDoc = await Stock.findOne({ symbol: stock });

  if (!stockDoc) {
    stockDoc = new Stock({ symbol: stock, likes: like ? [hashedIP] : [] });
  } else if (like && !stockDoc.likes.includes(hashedIP)) {
    stockDoc.likes.push(hashedIP);
  }

  await stockDoc.save();

  return {
    stock,
    price,
    likes: stockDoc.likes.length
  };
}

module.exports = async function handleStockQuery(stock, like, ip) {
  if (Array.isArray(stock)) {
    const [s1, s2] = await Promise.all([
      getStockData(stock[0], like, ip),
      getStockData(stock[1], like, ip)
    ]);

    const relLikes1 = s1.likes - s2.likes;
    const relLikes2 = s2.likes - s1.likes;

    return {
      stockData: [
        { stock: s1.stock, price: s1.price, rel_likes: relLikes1 },
        { stock: s2.stock, price: s2.price, rel_likes: relLikes2 }
      ]
    };
  } else {
    const s = await getStockData(stock, like, ip);
    return {
      stockData: {
        stock: s.stock,
        price: s.price,
        likes: s.likes
      }
    };
  }
};
