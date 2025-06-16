const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

suite('Functional Tests', () => {
  let initialLikes = 0;

  test('Viewing one stock: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData');
        expect(res.body.stockData).to.include.all.keys('stock', 'price', 'likes');
        expect(res.body.stockData.stock).to.equal('GOOG');
        expect(res.body.stockData.price).to.be.a('number');
        expect(res.body.stockData.likes).to.be.a('number');
        initialLikes = res.body.stockData.likes;
        done();
      });
  });

  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData');
        expect(res.body.stockData).to.include.all.keys('stock', 'price', 'likes');
        expect(res.body.stockData.stock).to.equal('GOOG');
        expect(res.body.stockData.likes).to.be.at.least(initialLikes);
        initialLikes = res.body.stockData.likes;
        done();
      });
  });

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData');
        expect(res.body.stockData.stock).to.equal('GOOG');
        expect(res.body.stockData.likes).to.equal(initialLikes); // Should not increment again
        done();
      });
  });

  test('Viewing two stocks: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData').that.is.an('array').with.length(2);
        expect(res.body.stockData[0]).to.include.all.keys('stock', 'price', 'rel_likes');
        expect(res.body.stockData[1]).to.include.all.keys('stock', 'price', 'rel_likes');
        done();
      });
  });

  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
    chai
      .request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: true })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('stockData').that.is.an('array').with.length(2);
        const [stock1, stock2] = res.body.stockData;
        expect(stock1).to.include.all.keys('stock', 'price', 'rel_likes');
        expect(stock2).to.include.all.keys('stock', 'price', 'rel_likes');
        expect(stock1.rel_likes + stock2.rel_likes).to.equal(0); // Because it's relative
        done();
      });
  });
});
