const express = require('express');
const router = express.Router();
const postController = require('../controllers/post');
const { userMiddleware } = require("../middleWares/user");

router.use(userMiddleware);

// create-profile
router.post('/add-post', postController.addPost);
router.get('/user-posts', postController.getUserPosts);
router.get('/get-posts', postController.getPosts);

module.exports = router;
