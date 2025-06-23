const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const mongoose = require('mongoose');
const Stock = require('../models/Stock');
require('dotenv').config();

chai.use(chaiHttp);
const { assert } = chai;

describe('Functional Tests', function () {
  this.timeout(15000); // increase timeout to handle any DB delay

  before(async function () {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Wait until connection is ready
    while (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ MongoDB connected (before tests)');
  });

  beforeEach(async function () {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('❌ MongoDB not ready before cleaning');
    }

    console.log('🧹 Cleaning database before test...');
    await Stock.deleteMany({});
    console.log('✅ Database cleaned');
  });

  it('Viewing one stock: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });


  it('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.isAtLeast(res.body.stockData.likes, 1);
        done();
      });
  });

  it('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end(() => {
        chai
          .request(server)
          .get('/api/stock-prices')
          .query({ stock: 'GOOG', like: true })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, 'stockData');
            assert.equal(res.body.stockData.stock, 'GOOG');
            assert.property(res.body.stockData, 'price');
            assert.property(res.body.stockData, 'likes');
            assert.equal(res.body.stockData.likes, 1);
            done();
          });
      });
  });

  it('Viewing two stocks: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.property(res.body.stockData[0], 'stock');
        assert.property(res.body.stockData[0], 'price');
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'stock');
        assert.property(res.body.stockData[1], 'price');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });

  it('Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.property(res.body.stockData[0], 'stock');
        assert.property(res.body.stockData[0], 'price');
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'stock');
        assert.property(res.body.stockData[1], 'price');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });
});
