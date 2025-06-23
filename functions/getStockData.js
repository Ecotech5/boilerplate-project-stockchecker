const fetch = require('node-fetch');
const Stock = require('../models/Stock');

// Helper to sanitize input symbol
function cleanSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return null;
  return symbol.trim().toUpperCase();
}

// Fetch price from FCC proxy
async function fetchStockInfo(rawSymbol) {
  const symbol = cleanSymbol(rawSymbol);
  if (!symbol) throw new Error('Invalid stock symbol');

  const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
  const data = await response.json();

  if (!data?.symbol || !data?.latestPrice) {
    throw new Error(`Invalid API response for ${symbol}`);
  }

  return {
    symbol: data.symbol,
    price: parseFloat(data.latestPrice)
  };
}

// Handle DB logic and likes
async function processStock(rawSymbol, ip, like) {
  const symbol = cleanSymbol(rawSymbol);
  if (!symbol) throw new Error('Invalid stock symbol');

  let dbStock = await Stock.findOne({ symbol });

  // Create new entry if not found
  if (!dbStock) {
    dbStock = new Stock({ symbol, likes: [] });
  }

  // Like logic
  if (like === 'true' && !dbStock.likes.includes(ip)) {
    dbStock.likes.push(ip);
  }

  await dbStock.save();

  const stockInfo = await fetchStockInfo(symbol);

  return {
    symbol: stockInfo.symbol,
    price: stockInfo.price,
    likes: dbStock.likes.length
  };
}

module.exports = { fetchStockInfo, processStock };
