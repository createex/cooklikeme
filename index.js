const express = require("express");
const config = require("./config/config");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const notificationRoutes = require("./routes/notification");
const stripeRoutes = require("./routes/stripe");
const storiesRoutes = require("./routes/story");
const uploadRoutes = require("./routes/upload");
const chatRoutes = require("./routes/chatRoutes");
const http = require("http");
const { Server } = require("socket.io");
const { socketServices } = require("./utils/socketService");
const app = express();
require("dotenv").config();

const server = http.createServer(app);
//socket connection
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
socketServices(io);
// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/story", storiesRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Base route
app.get("/", (req, res) => res.send("Hello from Node API server"));

// Handle 404 errors
app.use((req, res) => res.status(404).send("Route not found"));

// Start the server
server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
