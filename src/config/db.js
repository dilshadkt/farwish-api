require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
  }
};
  
module.exports = connectDB;