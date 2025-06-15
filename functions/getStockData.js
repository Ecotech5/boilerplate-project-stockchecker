// functions/getStockData.js
const Stock = require('../models/Stock');

const getStockData = async (symbol, ip, like) => {
  const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
  const data = await response.json();
  if (!data || !data.symbol) throw new Error('Stock not found');

  let stock = await Stock.findOne({ stock: symbol });

  if (!stock) {
    stock = new Stock({ stock: symbol, likes: 0, ips: [] });
  }

  if (like && !stock.ips.includes(ip)) {
    stock.likes++;
    stock.ips.push(ip);
    await stock.save();
  } else if (!like) {
    await stock.save();
  }

  return {
    stock: data.symbol,
    price: parseFloat(data.latestPrice),
    likes: stock.likes
  };
};

module.exports = getStockData;
