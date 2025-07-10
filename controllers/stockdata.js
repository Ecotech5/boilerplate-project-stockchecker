// routes/stockdata.js or controllers/stockController.js
const fetch = require('node-fetch');
const Stock = require('../models/Stock');

// Anonymize IP for privacy compliance (e.g., 192.168.1.123 → 192.168.1.0)
function anonymizeIp(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

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

  const maskedIp = anonymizeIp(ip); // ✅ Replace MD5 with anonymized IP
  let dbStock = await Stock.findOne({ stock });

  if (!dbStock) {
    dbStock = new Stock({ stock, likes: [] });
  }

  if (like === 'true' && !dbStock.likes.includes(maskedIp)) {
    dbStock.likes.push(maskedIp);
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
