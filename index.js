// Import required modules
const express = require('express');
const config = require('./config/config'); // Import config to access environment variables
const connectDB = require('./config/db'); // Import the MongoDB connection function
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');

// Create an instance of the express app
const app = express();
app.use(express.json());

// Connect to the MongoDB database
connectDB(); // This uses the MONGO_URI from the config.js file


app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Define a simple route
app.get('/', (req, res) => {
    res.send('Hello from Node API server');
});

// Start the server and listen on the port from the config file
app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});
