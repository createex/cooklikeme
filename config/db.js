const mongoose = require('mongoose');
const config = require('./config'); // Import the general config file

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    process.exit(1); // Stop the app if we fail to connect
  }
};

module.exports = connectDB;
