const express = require("express");
const router = express.Router();
const { userMiddleware } = require("../middleWares/user");

const {
  getMessages,
  getConversation,
} = require("../controllers/chatController");

router.use(userMiddleware);
// Chat routes
router.get("/conversations", getConversation);
router.get("/messages/:conversationId", getMessages);
module.exports = router;
