const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Secret for verifying the token
const JWT_SECRET = process.env.JWT_SECRET || "CookLikeMe";

const connectedUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Middleware for token authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.error("Socket connection denied: Token missing");
      return next(new Error("Token missing"));
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId; // Attach the user ID to the socket object
      console.log(`Socket authenticated for user: ${decoded.userId}`);
      next(); // Allow the connection
    } catch (error) {
      console.error("Socket connection denied: Invalid or expired token");
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Add the userId and socket ID to the map
    connectedUsers.set(userId, socket.id);
    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

    // Handle sending event to a specific user (called from the frontend)
    socket.on("sendToUser", ({ userId, event, data }) => {
      if (!userId || !event || data === undefined) {
        console.warn("Invalid payload for sendToUser");
        return;
      }

      const socketId = connectedUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
        console.log(`Event "${event}" sent to user ${userId}:`, data);
      } else {
        console.warn(`User with ID ${userId} is not connected.`);
      }
    });

    // Handle dynamic events for broadcasting or general use
    socket.onAny((event, data) => {
      console.log(`Received event: ${event}, data:`, data);
      socket.emit(event, { success: true, received: data });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      connectedUsers.delete(userId); // Remove the user from the map
    });
  });

  return { io }; // Expose the io instance if needed
};

module.exports = { initializeSocket };
