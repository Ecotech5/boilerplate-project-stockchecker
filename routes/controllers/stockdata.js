async function handleStock(stock, like, ip) {
  const { stock: symbol, price } = await fetchStockData(stock);
  const hashedIP = hashIP(ip);

  let stockDoc = await Stock.findOne({ symbol });

  if (!stockDoc) {
    stockDoc = new Stock({ symbol, likes: like ? [hashedIP] : [] });
  } else if (like && !stockDoc.likes.includes(hashedIP)) {
    stockDoc.likes.push(hashedIP);
  }

  await stockDoc.save();

  return {
    stock: symbol,
    price,
    likes: stockDoc.likes.length
  };
}
