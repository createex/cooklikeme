const Conversation = require("../models/conversation");
const Message = require("../models/message");
const User = require("../models/user");

// API Routes
// Get user's conversations
exports.getConversation = async (req, res) => {
  try {
    const userId = req.userId; // Assuming auth middleware sets req.user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name picture")
      .populate("lastMessage", "content createdAt read")
      .select("participants lastMessage lastMessageTimestamp")
      .sort({ lastMessageTimestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalConversations = await Conversation.countDocuments({
      participants: userId,
    });

    res.json({
      conversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalConversations / limit),
        totalItems: totalConversations,
        hasMore: page * limit < totalConversations,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}; // Get messages for a specific conversation..
exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this conversation" });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .select("-__v -updatedAt -conversation")
      .populate("sender", "name picture")
      .populate("receiver", "name picture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
    });

    // Add sentByYou field to each message
    const messagesWithSentByYou = messages.map((message) => ({
      ...message.toObject(),
      sentByYou: message.sender._id.toString() === userId.toString(),
    }));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        read: false,
      },
      { read: true }
    );

    res.json({
      message: "Messages retrieved successfully",
      messages: messagesWithSentByYou,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: skip + messages.length < totalMessages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}; // Send a new message (HTTP fallback)
