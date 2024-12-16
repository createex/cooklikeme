// Import required modules
const express = require('express');
const config = require('./config/config'); // Import config to access environment variables
const connectDB = require('./config/db'); // Import the MongoDB connection function
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');

// Create an instance of the express app
const app = express();

// Debugging: Log the app's startup and environment
console.log('Starting Node.js API server...');
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Server will run on port: ${config.PORT}`);

// Use JSON middleware to parse incoming requests
app.use(express.json());
console.log('JSON parsing middleware initialized');

// Debugging MongoDB connection
console.log('Connecting to MongoDB...');
connectDB(); // This uses the MONGO_URI from the config.js file

// Register API routes with logging
console.log('Registering API routes...');
app.use('/api/users', userRoutes);
console.log('User routes registered at /api/users');
app.use('/api/upload', uploadRoutes);
console.log('Upload routes registered at /api/upload');

// Define a simple route
app.get('/', (req, res) => {
    console.log('GET request made to /');
    res.send('Hello from Node API server');
});

// Handle 404 for any undefined routes
app.use((req, res) => {
    console.log(`404 error for route: ${req.originalUrl}`);
    res.status(404).send('Route not found');
});

// Start the server and listen on the port from the config file
app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
    console.log('Server is ready to handle requests!');
});

