const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Check if essential environment variables are missing
const requiredEnvVars = ['MONGO_URI', 'PORT'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1); // Stop the app if any required environment variable is missing
  }
});

console.log('Environment variables loaded successfully');
const dotenv = require('dotenv');
dotenv.config(); 

console.log('Environment variables loaded:');
console.log(process.env);

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
};
