const express = require("express");
const http = require("http");
const config = require("./config/config");
const connectDB = require("./config/db");
const { initializeSocket } = require("./utils/socketService");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const notificationRoutes = require("./routes/notification");
const stripeRoutes = require("./routes/stripe");
const storiesRoutes = require("./routes/story");
const uploadRoutes = require("./routes/upload");
const chatRoutes = require("./routes/chatRoutes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/story", storiesRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Hello from Node API server");
});

// Handle 404 errors for unknown routes
app.use((req, res) => {
  console.error(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// Start the server
server.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
