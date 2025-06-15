// controllers/stockController.js
const Stock = require('../models/Stock');
const getStockData = require('../functions/getStockData');

const handleStockRequest = async (req, res) => {
  const { stock, like } = req.query;
  const ip = req.ip;

  try {
    if (Array.isArray(stock)) {
      const stockData = await Promise.all(
        stock.map(s => getStockData(s.toUpperCase(), ip, like === 'true'))
      );

      const rel_likes_0 = stockData[0].likes - stockData[1].likes;
      const rel_likes_1 = stockData[1].likes - stockData[0].likes;

      res.json({
        stockData: [
          { stock: stockData[0].stock, price: stockData[0].price, rel_likes: rel_likes_0 },
          { stock: stockData[1].stock, price: stockData[1].price, rel_likes: rel_likes_1 }
        ]
      });
    } else {
      const stockData = await getStockData(stock.toUpperCase(), ip, like === 'true');
      res.json({ stockData });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { handleStockRequest };
