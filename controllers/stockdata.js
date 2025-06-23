// routes/stockdata.js or controllers/stockController.js
const fetch = require('node-fetch');
const Stock = require('../models/Stock');
const crypto = require('crypto');

// Sanitize stock input
function cleanStockName(stock) {
  if (!stock || typeof stock !== 'string') return null;
  return stock.trim().toUpperCase();
}

// Fetch stock price
async function fetchStockInfo(rawStock) {
  const stock = cleanStockName(rawStock);
  if (!stock) throw new Error('Invalid stock');

  const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`);
  const data = await response.json();

  if (!data?.symbol || !data?.latestPrice) {
    throw new Error(`Invalid API response for ${stock}`);
  }

  return {
    stock: data.symbol,
    price: parseFloat(data.latestPrice)
  };
}

// Handle DB like logic
async function processStock(rawStock, ip, like) {
  const stock = cleanStockName(rawStock);
  if (!stock) throw new Error('Invalid stock');

  const hashedIp = crypto.createHash('md5').update(ip).digest('hex');
  let dbStock = await Stock.findOne({ stock });

  if (!dbStock) {
    dbStock = new Stock({ stock });
  }

  if (like === 'true' && !dbStock.likes.includes(hashedIp)) {
    dbStock.likes.push(hashedIp);
  }

  await dbStock.save();

  const stockInfo = await fetchStockInfo(stock);

  return {
    stock: stockInfo.stock,
    price: stockInfo.price,
    likes: dbStock.likes.length
  };
}

module.exports = { processStock, fetchStockInfo };
