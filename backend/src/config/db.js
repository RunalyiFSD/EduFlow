const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      console.error('❌ Error: MONGO_URI is not set in environment variables.');
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
