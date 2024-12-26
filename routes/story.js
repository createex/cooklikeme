const express = require('express');
const { addStory, getAllStories, getStoriesByOwner } = require('../controllers/stories');
const { userMiddleware } = require("../middleWares/user");

const router = express.Router();

router.use(userMiddleware)
// Route to add a new story
router.post('/add-story', addStory);

// Route to get all active stories (including "My Stories" and "Other Stories")
router.get('/stories', getAllStories);

// Route to get all stories by a specific owner
router.get('/stories/owner', getStoriesByOwner);

module.exports = router;
