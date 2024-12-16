const mongoose = require('mongoose');
const config = require('./config'); // Import the general config file

const connectDB = async () => {
  try {
    // Debugging: Log before attempting to connect
    console.log('Attempting to connect to MongoDB with URI:', config.MONGO_URI);

    // Attempting to connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Success log after successful connection
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    // Log error if the connection fails
    console.error('Error connecting to MongoDB:', error.message);

    // Stop the app if we fail to connect
    process.exit(1);
  }
};

module.exports = connectDB;
