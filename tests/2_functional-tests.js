const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const mongoose = require('mongoose');
const server = require('../server');
const Stock = require('../models/Stock');

chai.use(chaiHttp);

describe('Functional Tests', function () {
  this.timeout(10000);

  before(async function () {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  beforeEach(async function () {
    console.log('🧹 Cleaning database before test...');
    try {
      await Stock.deleteMany({});
      console.log('✅ Database cleaned');
    } catch (err) {
      console.error('❌ Failed to clean database:', err);
      throw err;
    }
  });

  it('GET /api/stock-prices with one stock', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });

  it('GET /api/stock-prices with one stock and like', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.isAbove(res.body.stockData.likes, 0);
        done();
      });
  });

  it('GET /api/stock-prices with same stock and like again (not double counted)', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res1) => {
        chai
          .request(server)
          .get('/api/stock-prices')
          .query({ stock: 'GOOG', like: 'true' })
          .end((err, res2) => {
            assert.equal(res2.status, 200);
            assert.equal(res1.body.stockData.likes, res2.body.stockData.likes);
            done();
          });
      });
  });

  it('GET /api/stock-prices with two stocks', function (done) {
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
        done();
      });
  });

  it('GET /api/stock-prices with two stocks and like', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        assert.property(res.body.stockData[0], 'stock');
        assert.property(res.body.stockData[0], 'price');
        assert.property(res.body.stockData[0], 'rel_likes');
        done();
      });
  });
});
