const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let stock1Likes = 0;
  let stock2Likes = 0;

  test('1. Viewing one stock: GET request to /api/stock-prices', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        stock1Likes = res.body.stockData.likes;
        done();
      });
  });

  test('2. Viewing one stock and liking it: GET request to /api/stock-prices', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        assert.isAbove(res.body.stockData.likes, stock1Likes);
        stock1Likes = res.body.stockData.likes;
        done();
      });
  });

  test('3. Viewing the same stock and liking it again (ensure likes not double counted)', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.likes);
        assert.equal(res.body.stockData.likes, stock1Likes); // should remain the same
        done();
      });
  });

  test('4. Viewing two stocks: GET request to /api/stock-prices', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        const [stock1, stock2] = res.body.stockData;
        assert.containsAllKeys(stock1, ['stock', 'price', 'rel_likes']);
        assert.containsAllKeys(stock2, ['stock', 'price', 'rel_likes']);
        done();
      });
  });

  test('5. Viewing two stocks and liking them: GET request to /api/stock-prices', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        const [stock1, stock2] = res.body.stockData;
        assert.containsAllKeys(stock1, ['stock', 'price', 'rel_likes']);
        assert.containsAllKeys(stock2, ['stock', 'price', 'rel_likes']);
        assert.isNumber(stock1.rel_likes);
        assert.isNumber(stock2.rel_likes);
        assert.equal(stock1.rel_likes, -stock2.rel_likes); // Should be opposite
        done();
      });
  });
});
