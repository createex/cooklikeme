const express = require('express');
const router = express.Router();
const proController = require('../controllers/post');
const { userMiddleware } = require("../middleWares/user");

router.use(userMiddleware);

// create-profile
router.post('/add-post', proController.addPost);

module.exports = router;
