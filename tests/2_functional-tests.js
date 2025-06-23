const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');
const Stock = require('../models/Stock');

// Make suite/test work in local Mocha
const suite = global.suite || describe;
const test = global.test || it;

chai.use(chaiHttp);


suite('Functional Tests', function () {
  this.timeout(10000);

  let likeCount = 0;

  before(async function () {
    // Clear database once before all tests
    await Stock.deleteMany({});
  });

  test('GET /api/stock-prices with one stock', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        likeCount = res.body.stockData.likes; // store for later test
        done();
      });
  });

  test('GET /api/stock-prices with one stock and like', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        assert.equal(res.body.stockData.likes, likeCount + 1); // ✅ should increase by 1
        likeCount = res.body.stockData.likes;
        done();
      });
  });

  test('GET /api/stock-prices with same stock and like again (not double counted)', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.equal(res.body.stockData.likes, likeCount); // ✅ should stay the same
        done();
      });
  });

  test('GET /api/stock-prices with two stocks', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [stock1, stock2] = res.body.stockData;

        assert.equal(stock1.stock, 'GOOG');
        assert.equal(stock2.stock, 'MSFT');

        assert.isNumber(stock1.price);
        assert.isNumber(stock2.price);

        assert.property(stock1, 'rel_likes');
        assert.property(stock2, 'rel_likes');
        done();
      });
  });

  test('GET /api/stock-prices with two stocks and like', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [stock1, stock2] = res.body.stockData;

        assert.equal(stock1.stock, 'GOOG');
        assert.equal(stock2.stock, 'MSFT');

        assert.isNumber(stock1.price);
        assert.isNumber(stock2.price);

        assert.property(stock1, 'rel_likes');
        assert.property(stock2, 'rel_likes');

        // ✅ rel_likes should be opposite values
        assert.equal(stock1.rel_likes, -stock2.rel_likes);
        done();
      });
  });

});
