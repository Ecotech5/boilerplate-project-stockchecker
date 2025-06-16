'use strict';
const express = require('express');
const router = express.Router();
const { handleStock } = require('../controllers/stockdata');

module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = req.ip;
    const likeFlag = like === 'true' || like === true;

    try {
      if (!stock) {
        return res.status(400).json({ error: 'Stock parameter is required' });
      }

      // Handle single stock
      if (!Array.isArray(stock)) {
        const stockData = await handleStock(stock, likeFlag, ip);
        return res.json({ stockData });
      }

      // Handle two stocks
      if (Array.isArray(stock) && stock.length === 2) {
        const [stockOne, stockTwo] = await Promise.all([
          handleStock(stock[0], likeFlag, ip),
          handleStock(stock[1], likeFlag, ip)
        ]);

        const rel_likes1 = stockOne.likes - stockTwo.likes;
        const rel_likes2 = stockTwo.likes - stockOne.likes;

        return res.json({
          stockData: [
            { stock: stockOne.stock, price: stockOne.price, rel_likes: rel_likes1 },
            { stock: stockTwo.stock, price: stockTwo.price, rel_likes: rel_likes2 }
          ]
        });
      }

      res.status(400).json({ error: 'Invalid stock input' });

    } catch (error) {
      console.error('API Error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
