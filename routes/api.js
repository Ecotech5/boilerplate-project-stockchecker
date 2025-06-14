'use strict';

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config();

// MongoDB connection URI from .env
const MONGO_URI = process.env.MONGO_URI;
let db;

// Connect to MongoDB once and reuse the connection
MongoClient.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(client => {
    db = client.db(); // Uses DB from the URI
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));

module.exports = function (app) {
  app.route('/api/stock-prices').get(async function (req, res) {
    const { stock, like } = req.query;
    const ip = req.ip;
    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

    if (!stock) return res.status(400).json({ error: 'Stock symbol required' });

    const stocks = Array.isArray(stock) ? stock.map(s => s.toUpperCase()) : [stock.toUpperCase()];
    const likeFlag = like === 'true' || like === true;

    async function fetchStock(symbol) {
      const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.symbol || !data.latestPrice) throw new Error('Invalid stock data');
        return { stock: data.symbol, price: data.latestPrice };
      } catch (err) {
        return { stock: symbol, error: 'Stock not found' };
      }
    }

    async function getLikes(symbol) {
      const stockDoc = await db.collection('stocks').findOne({ symbol });
      return stockDoc ? stockDoc.likes.length : 0;
    }

    async function updateLikes(symbol) {
      const collection = db.collection('stocks');
      const stockDoc = await collection.findOne({ symbol });

      if (stockDoc) {
        if (!stockDoc.likes.includes(hashedIp)) {
          await collection.updateOne(
            { symbol },
            { $push: { likes: hashedIp } }
          );
        }
      } else {
        await collection.insertOne({
          symbol,
          likes: likeFlag ? [hashedIp] : [],
        });
      }
    }

    if (stocks.length === 1) {
      const symbol = stocks[0];
      const stockData = await fetchStock(symbol);
      if (stockData.error) return res.status(400).json({ error: stockData.error });

      if (likeFlag) await updateLikes(symbol);
      const likes = await getLikes(symbol);

      return res.json({
        stockData: {
          stock: stockData.stock,
          price: stockData.price,
          likes,
        },
      });
    }

    // Handle comparison between two stocks
    const [symbol1, symbol2] = stocks;
    const [data1, data2] = await Promise.all([
      fetchStock(symbol1),
      fetchStock(symbol2),
    ]);

    if (likeFlag) {
      await Promise.all([updateLikes(symbol1), updateLikes(symbol2)]);
    }

    const [likes1, likes2] = await Promise.all([
      getLikes(symbol1),
      getLikes(symbol2),
    ]);

    return res.json({
      stockData: [
        {
          stock: data1.stock,
          price: data1.price,
          rel_likes: likes1 - likes2,
        },
        {
          stock: data2.stock,
          price: data2.price,
          rel_likes: likes2 - likes1,
        },
      ],
    });
  });
};
