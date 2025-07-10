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

  // ✅ More reliable connection logic
  before(async function () {
    this.timeout(10000);
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      }
      await mongoose.connection.asPromise();
      console.log('✅ MongoDB connected (before tests)');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      throw err;
    }
  });

  beforeEach(async function () {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('❌ MongoDB not ready before cleaning');
    }

    console.log('🧹 Cleaning database before test...');
    await Stock.deleteMany({});
    console.log('✅ Database cleaned');
  });

  it('1) Viewing one stock: GET request to /api/stock-prices/', function (done) {
    console.log('📡 Test 1 started');
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        console.log('📨 Response received:', err?.message || res?.status);
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        done();
      });
  });

  it('2) Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.likes);
        assert.isAbove(res.body.stockData.likes, 0);
        done();
      });
  });

  it('3) Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.likes);
        assert.equal(res.body.stockData.likes, 1); // Like count should not increase
        done();
      });
  });

  it('4) Viewing two stocks: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });

  it('5) Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: true })
      .end((err, res) => {
        if (err) return done(err);

        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });
});
