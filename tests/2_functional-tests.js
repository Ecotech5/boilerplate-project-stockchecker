// Import required modules
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const Stock = require('../models/Stock');  // Add this line to import your Stock model

// Initialize chai
const expect = chai.expect;
chai.use(chaiHttp);

describe('Stock Price Checker Functional Tests', function() {
  this.timeout(5000);

  // Add this before hook to clean the database before each test
  beforeEach(function(done) {
    Stock.deleteMany({})
      .then(() => done())
      .catch(err => done(err));
  });

  // Test 1: Viewing one stock
  describe('GET /api/stock-prices with one stock', function() {
    it('should return stock data for one stock', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('stockData');
          expect(res.body.stockData).to.have.property('stock', 'GOOG');
          expect(res.body.stockData).to.have.property('price').that.is.a('number');
          expect(res.body.stockData).to.have.property('likes').that.is.a('number');
          done();
        });
    });
  });

  // Test 2: Viewing one stock and liking it
  describe('GET /api/stock-prices with one stock and like', function() {
    it('should return stock data with likes increased', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=MSFT&like=true')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.stockData).to.have.property('stock', 'MSFT');
          expect(res.body.stockData.likes).to.equal(1);
          done();
        });
    });
  });

  // Test 3: Viewing the same stock and liking it again
  describe('GET /api/stock-prices with same stock and like again', function() {
    it('should not increase likes again for same IP', function(done) {
      // First request to like the stock
      chai.request(server)
        .get('/api/stock-prices?stock=MSFT&like=true')
        .end(() => {
          // Second request from same IP
          chai.request(server)
            .get('/api/stock-prices?stock=MSFT&like=true')
            .end(function(err, res) {
              expect(err).to.be.null;
              expect(res).to.have.status(200);
              expect(res.body.stockData).to.have.property('stock', 'MSFT');
              expect(res.body.stockData.likes).to.equal(1);
              done();
            });
        });
    });
  });

  // Test 4: Viewing two stocks
  describe('GET /api/stock-prices with two stocks', function() {
    it('should return stock data for two stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.stockData).to.be.an('array').with.lengthOf(2);
          expect(res.body.stockData[0]).to.have.property('stock');
          expect(res.body.stockData[0]).to.have.property('price');
          expect(res.body.stockData[0]).to.have.property('rel_likes');
          expect(res.body.stockData[1]).to.have.property('stock');
          expect(res.body.stockData[1]).to.have.property('price');
          expect(res.body.stockData[1]).to.have.property('rel_likes');
          done();
        });
    });
  });

  // Test 5: Viewing two stocks and liking them
  describe('GET /api/stock-prices with two stocks and likes', function() {
    it('should return relative likes for two stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT&like=true')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.stockData[0].rel_likes).to.be.a('number');
          expect(res.body.stockData[1].rel_likes).to.be.a('number');
          expect(res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes).to.equal(0);
          done();
        });
    });
  });
});