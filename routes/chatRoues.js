const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
  getAllChats,
} = require("../controllers/chatController");

// Chat routes
router.post("/send", protect, sendMessage);
router.get("/messages/:chatId", protect, getMessages);
router.get("/all", protect, getAllChats);

module.exports = router;
