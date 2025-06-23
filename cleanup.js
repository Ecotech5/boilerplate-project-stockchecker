require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./models/Stock');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://emmanuelcailstus5:inDtm9Ji7wu4MPOs@cluster0.0my2swu.mongodb.net/stockchecker?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  const result = await Stock.deleteMany({});
  console.log(`🗑️ Deleted ${result.deletedCount} stock records.`);
  mongoose.connection.close();
})
.catch(err => {
  console.error('❌ Error cleaning DB:', err.message);
});
