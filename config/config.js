const dotenv = require('dotenv');
dotenv.config(); // Ensure environment variables are loaded

const config = {
  // MongoDB URI from environment variables
  MONGO_URI: process.env.MONGO_URI,

  // Port where the server will run
  PORT: process.env.PORT || 5000,

  // JWT Configuration (if you plan to implement JWT)
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',

  // Email Configuration (if required in the future)
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
};

module.exports = config;
