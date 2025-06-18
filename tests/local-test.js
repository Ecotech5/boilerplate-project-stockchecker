const axios = require('axios');
const { expect } = require('chai');

const API_BASE = 'http://localhost:3000/api';

describe('Local API Tests', function() {
  this.timeout(10000);

  it('should fetch single stock data', async () => {
    const res = await axios.get(`${API_BASE}/stock-prices?stock=goog`);
    expect(res.data.stockData).to.have.property('stock', 'GOOG');
    expect(res.data.stockData.price).to.be.a('number');
    expect(res.data.stockData.likes).to.be.a('number');
  });

  it('should handle likes correctly', async () => {
    const firstReq = await axios.get(`${API_BASE}/stock-prices?stock=msft&like=true`);
    const initialLikes = firstReq.data.stockData.likes;
    
    const secondReq = await axios.get(`${API_BASE}/stock-prices?stock=msft&like=true`);
    expect(secondReq.data.stockData.likes).to.equal(initialLikes);
  });

  it('should compare two stocks', async () => {
    const res = await axios.get(`${API_BASE}/stock-prices?stock[]=goog&stock[]=msft`);
    expect(res.data.stockData).to.be.an('array').with.lengthOf(2);
    expect(res.data.stockData[0].rel_likes + res.data.stockData[1].rel_likes).to.equal(0);
  });
});