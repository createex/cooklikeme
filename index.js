const express = require('express');
const config = require('./config/config');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Base route
app.get('/', (req, res) => res.send('Hello from Node API server'));

// Handle 404 errors
app.use((req, res) => res.status(404).send('Route not found'));

// Start the server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
