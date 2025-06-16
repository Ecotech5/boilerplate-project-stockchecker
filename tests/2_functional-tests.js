const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(5000); // allow enough time for external API

  let initialLikes = 0;

  suite('GET /api/stock-prices => stockData object', () => {
    
    test('Viewing one stock', done => {
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

    test('Viewing one stock and liking it', done => {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: true })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('stockData');
          expect(res.body.stockData).to.include.all.keys('stock', 'price', 'likes');
          expect(res.body.stockData.likes).to.be.at.least(initialLikes);
          initialLikes = res.body.stockData.likes; // Update for next test
          done();
        });
    });

    test('Viewing the same stock and liking it again (should not increase likes)', done => {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: true })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('stockData');
          expect(res.body.stockData.likes).to.equal(initialLikes);
          done();
        });
    });

    test('Viewing two stocks', done => {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'] })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('stockData');
          expect(res.body.stockData).to.be.an('array').with.lengthOf(2);

          res.body.stockData.forEach(stock => {
            expect(stock).to.include.all.keys('stock', 'price', 'rel_likes');
            expect(stock.price).to.be.a('number');
            expect(stock.rel_likes).to.be.a('number');
          });

          done();
        });
    });

    test('Viewing two stocks and liking them', done => {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'], like: true })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('stockData');
          expect(res.body.stockData).to.be.an('array').with.lengthOf(2);

          res.body.stockData.forEach(stock => {
            expect(stock).to.include.all.keys('stock', 'price', 'rel_likes');
            expect(stock.price).to.be.a('number');
            expect(stock.rel_likes).to.be.a('number');
          });

          done();
        });
    });
  });
});
