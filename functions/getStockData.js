const fetch = require('node-fetch');
const Stock = require('../models/Stock');

function cleanSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return null;
  return symbol.trim().toUpperCase();
}

// Anonymize IP for privacy
function anonymizeIp(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

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

async function processStock(rawSymbol, ip, like) {
  const symbol = cleanSymbol(rawSymbol);
  if (!symbol) throw new Error('Invalid stock symbol');

  const maskedIp = anonymizeIp(ip);
  let dbStock = await Stock.findOne({ symbol });

  if (!dbStock) {
    dbStock = new Stock({ symbol, likes: [] });
  }

  if (like === 'true' && !dbStock.likes.includes(maskedIp)) {
    dbStock.likes.push(maskedIp);
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
