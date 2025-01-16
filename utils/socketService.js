const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    // Dynamically handle any event
    socket.onAny((event, data) => {
      console.log(`Event: ${event}`, data);
      socket.emit(event, { success: true, received: data });
    });

    socket.on("disconnect", () => console.log(`Disconnected: ${socket.id}`));
  });

  console.log("Socket initialized");
};

const getSocketInstance = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initializeSocket, getSocketInstance };
