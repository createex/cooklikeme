const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://cooklikemeuser:QRqbdTttOpXpbKd0@cooklikeme.dglut.mongodb.net/?retryWrites=true&w=majority&appName=CookLikeMe", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully' + "mongodb+srv://cooklikemeuser:QRqbdTttOpXpbKd0@cooklikeme.dglut.mongodb.net/?retryWrites=true&w=majority&appName=CookLikeMe");
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
