const express = require('express');
const router = express.Router();
const postController = require('../controllers/post');
const { userMiddleware } = require("../middleWares/user");

router.use(userMiddleware);

// Create post
router.post('/add-post', postController.addPost);

// Get posts of the user
router.get('/user-posts', postController.getUserPosts);

// Get all posts
router.get('/get-posts', postController.getPosts);

// Like / Unlike post
router.post('/like', postController.likePost);

// Save / Unsave post
router.post('/save', postController.savePost);

// Share post
router.post('/share', postController.sharePost);

// Get liked posts by user
router.get('/liked-posts', postController.getLikedPosts);

// Get saved posts by user
router.get('/saved-posts', postController.getSavedPosts);

module.exports = router;
