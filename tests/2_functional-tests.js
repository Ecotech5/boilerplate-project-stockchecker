const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  test('Viewing one stock: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');

        const data = res.body.stockData;
        assert.isObject(data);
        assert.property(data, 'stock');
        assert.property(data, 'price');
        assert.property(data, 'likes');

        assert.equal(data.stock, 'GOOG');
        assert.isNumber(data.price);
        assert.isNumber(data.likes);

        done();
      });
  });

  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .set('X-Forwarded-For', '123.123.123.123')
      .query({ stock: 'GOOG', like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');

        const data = res.body.stockData;
        assert.equal(data.stock, 'GOOG');
        assert.isNumber(data.price);
        assert.isAtLeast(data.likes, 1);

        done();
      });
  });

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .set('X-Forwarded-For', '123.123.123.123') // same IP to prevent duplicate like
      .query({ stock: 'GOOG', like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        const data = res.body.stockData;

        assert.equal(data.stock, 'GOOG');
        assert.isNumber(data.price);
        assert.isAtLeast(data.likes, 1); // should not increase

        done();
      });
  });

  test('Viewing two stocks: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [stock1, stock2] = res.body.stockData;

        assert.property(stock1, 'stock');
        assert.property(stock1, 'price');
        assert.property(stock1, 'rel_likes');
        assert.property(stock2, 'stock');
        assert.property(stock2, 'price');
        assert.property(stock2, 'rel_likes');

        assert.isNumber(stock1.rel_likes);
        assert.isNumber(stock2.rel_likes);
        assert.equal(stock1.rel_likes, -stock2.rel_likes);

        done();
      });
  });

  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .set('X-Forwarded-For', '111.222.333.444') // different IP to allow like
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);

        const [stock1, stock2] = res.body.stockData;

        assert.property(stock1, 'stock');
        assert.property(stock1, 'price');
        assert.property(stock1, 'rel_likes');

        assert.property(stock2, 'stock');
        assert.property(stock2, 'price');
        assert.property(stock2, 'rel_likes');

        assert.equal(stock1.rel_likes, -stock2.rel_likes);

        done();
      });
  });

});
