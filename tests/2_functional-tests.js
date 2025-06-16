const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('📈 Functional Tests', function () {
  this.timeout(5000);

  let firstLikes = 0;
  let relLikes = 0;

  suite('GET /api/stock-prices => stockData object', () => {

    test('1. Viewing one stock: GET request to /api/stock-prices/', done => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          firstLikes = res.body.stockData.likes;
          done();
        });
    });

    test('2. Viewing one stock and liking it: GET request to /api/stock-prices/?like=true', done => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: 'true' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isNumber(res.body.stockData.likes);
          assert.isAbove(res.body.stockData.likes, firstLikes);
          firstLikes = res.body.stockData.likes;
          done();
        });
    });

    test('3. Viewing the same stock and liking it again (should not increase): GET request to /api/stock-prices/?like=true', done => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: 'true' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.equal(res.body.stockData.likes, firstLikes);
          done();
        });
    });

    test('4. Viewing two stocks: GET request to /api/stock-prices/?stock=GOOG&stock=MSFT', done => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'] })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);
          res.body.stockData.forEach(stock => {
            assert.property(stock, 'stock');
            assert.property(stock, 'price');
            assert.property(stock, 'rel_likes');
            assert.isNumber(stock.price);
            assert.isNumber(stock.rel_likes);
          });
          relLikes = res.body.stockData[0].rel_likes - res.body.stockData[1].rel_likes;
          done();
        });
    });

    test('5. Viewing two stocks and liking them: GET request to /api/stock-prices/?stock=GOOG&stock=MSFT&like=true', done => {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);
          res.body.stockData.forEach(stock => {
            assert.property(stock, 'stock');
            assert.property(stock, 'price');
            assert.property(stock, 'rel_likes');
            assert.isNumber(stock.price);
            assert.isNumber(stock.rel_likes);
          });
          done();
        });
    });

  });
});
