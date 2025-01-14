const Conversation = require("../models/conversation");
const Message = require("../models/message");
const User = require("../models/user");

// API Routes
// Get user's conversations
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware sets req.user

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name avatar")
      .populate("lastMessage")
      .sort({ lastMessageTimestamp: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50); // Pagination can be added here

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: userId,
        read: false,
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
// Send a new message (HTTP fallback)
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Update conversation
    await Conversation.findOneAndUpdate(
      {
        participants: { $all: [senderId, receiverId] },
      },
      {
        $set: {
          lastMessage: message._id,
          lastMessageTimestamp: new Date(),
        },
      },
      { upsert: true }
    );

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
