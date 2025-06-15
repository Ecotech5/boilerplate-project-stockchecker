const fetch = require('node-fetch');
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: String,
  likes: [String] // array of hashed IPs
});
const Stock = mongoose.model('Stock', stockSchema);

// IP anonymization (safe & simple)
function hashIP(ip) {
  return ip.split('.').slice(0, 3).join('.') + '.0';
}

module.exports = async function getStockData(stock, like, ip) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
  let data;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Stock not found or API failed');
    data = await res.json();
  } catch (err) {
    console.error("Error in getStockData:", err.message);
    return null;
  }

  const symbol = data.symbol;
  const price = data.latestPrice;

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
};
