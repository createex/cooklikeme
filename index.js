const express = require('express');
const config = require('./config/config');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');
const stripeRoutes = require('./routes/stripe');
const storiesRoutes = require('./routes/story');
const uploadRoutes = require('./routes/upload');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/post', postRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/story', storiesRoutes);
app.use('/api/upload', uploadRoutes);

// Base route
app.get('/', (req, res) => res.send('Hello from Node API server'));

// Handle 404 errors
app.use((req, res) => res.status(404).send('Route not found'));

// Start the server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
