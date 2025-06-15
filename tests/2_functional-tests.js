const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

suite('Functional Tests', function () {

  test('1. Viewing one stock', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData');
        expect(res.body.stockData).to.include.all.keys('stock', 'price', 'likes');
        expect(res.body.stockData.stock).to.equal('GOOG');
        expect(res.body.stockData.price).to.be.a('number');
        expect(res.body.stockData.likes).to.be.a('number');
        done();
      });
  });

  test('2. Viewing one stock and liking it', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.stockData).to.include.all.keys('stock', 'price', 'likes');
        expect(res.body.stockData.stock).to.equal('GOOG');
        expect(res.body.stockData.likes).to.be.a('number');
        done();
      });
  });

  test('3. Liking the same stock again should not increase likes', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.stockData).to.include.all.keys('stock', 'price', 'likes');
        expect(res.body.stockData.stock).to.equal('GOOG');
        expect(res.body.stockData.likes).to.be.a('number');
        done();
      });
  });

  test('4. Viewing two stocks', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData').that.is.an('array').with.length(2);

        res.body.stockData.forEach(stock => {
          expect(stock).to.have.all.keys('stock', 'price', 'rel_likes');
          expect(stock.price).to.be.a('number');
          expect(stock.rel_likes).to.be.a('number');
        });

        done();
      });
  });

  test('5. Viewing two stocks and liking them', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: true })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData').that.is.an('array').with.length(2);

        res.body.stockData.forEach(stock => {
          expect(stock).to.have.all.keys('stock', 'price', 'rel_likes');
          expect(stock.price).to.be.a('number');
          expect(stock.rel_likes).to.be.a('number');
        });

        done();
      });
  });
});
