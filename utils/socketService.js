const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Message = require("../models/message");
const Conversation = require("../models/conversation");

exports.socketServices = async (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.headers.token ||
        socket.handshake.auth.token ||
        socket.handshake.query.token;
      if (!token) {
        socket.emit("error", "Authentication token missing");
        return next(new Error("Authentication token missing"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      socket.emit("error", "Authentication error");
      return next(new Error("Authentication error"));
    }
  });
  // Socket connection handling
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Store user's socket id
    socket.on("user_connected", (userId) => {
      socket.userId = userId;
      console.log("User connected:", userId);

      socket.join(`user_${userId}`);
    });

    // Handle new message
    socket.on("send_message", async (receiverId, content) => {
      try {
        const senderId = socket.userId;
        console.log("Sending message with:", senderId, receiverId, content);

        // First check if conversation exists
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] },
        }).exec();

        // If no conversation exists, create a new one
        if (!conversation) {
          console.log("Creating new conversation between users");
          conversation = new Conversation({
            participants: [senderId, receiverId],
          });
          await conversation.save();
        }

        // Create new message
        const newMessage = new Message({
          sender: senderId,
          receiver: receiverId,
          content,
          conversation: conversation._id,
        });

        const message = await newMessage.save();
        console.log("Message saved:", message);

        // Update conversation with last message
        const updatedConversation = await Conversation.findByIdAndUpdate(
          conversation._id,
          {
            lastMessage: message._id,
            lastMessageTimestamp: new Date(),
          },
          { new: true }
        ).exec();

        console.log("Conversation updated:", updatedConversation);

        // Emit message to receiver
        io.to(`user_${receiverId}`).emit("new_message", message);
      } catch (error) {
        socket.emit("error", "Failed to send message: " + error.message);
      }
    }); // Handle disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected");
      if (socket.userId) {
        socket.leave(`user_${socket.userId}`);
      }
    });
  });
};
