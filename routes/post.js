const express = require('express');
const router = express.Router();
const postController = require('../controllers/post');
const { userMiddleware } = require("../middleWares/user");

router.use(userMiddleware);

// Create post
router.post('/add-post', postController.addPost);

// Get followings posts
router.get('/get-following-posts', postController.getFollowingsPosts);

// Get trending posts
router.get('/get-trending-posts', postController.getTrendingAndRandomPosts);

// Get posts of the user
router.get('/user-posts', postController.getUserPosts);

// Get liked posts by user
router.get('/liked-posts', postController.getLikedPosts);

// Get saved posts by user
router.get('/saved-posts', postController.getSavedPosts);

// Like / Unlike post
router.post('/like', postController.likePost);

// Save / Unsave post
router.post('/save', postController.savePost);

// Share post
router.post('/share', postController.sharePost);

//Comment on a post
router.post('/comment', postController.commentOnPost);

//Comment on a post
router.get('/comments', postController.getComments);

// Like / Unlike comment
router.post('/like-comment', postController.likeComment);

module.exports = router;
