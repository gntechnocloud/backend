const mongoose = require('mongoose');
const logger = require('../utils/logger');
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Mongo connected');
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    throw err;
  }
};
module.exports = connectDB;