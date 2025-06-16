'use strict';

const handleStockQuery = require('./controllers/stockdata'); // adjust path if needed

module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = req.ip;
    const likeFlag = like === 'true' || like === true;

    try {
      const result = await handleStockQuery(stock, likeFlag, ip);
      res.json(result);
    } catch (err) {
      console.error('API Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
