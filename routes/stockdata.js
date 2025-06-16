// ✅ Structure for single stock
res.json({
  stockData: {
    stock: 'GOOG',
    price: 123.45, // must be a number
    likes: 3 // must be a number
  }
});

// ✅ Structure for two stocks
res.json({
  stockData: [
    { stock: 'GOOG', price: 123.45, rel_likes: 1 },
    { stock: 'MSFT', price: 234.56, rel_likes: -1 }
  ]
});
