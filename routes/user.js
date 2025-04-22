const express = require('express');
const router = express.Router();
const proController = require('../controllers/user');
const { userMiddleware } = require("../middleWares/user");

// Signup Route
router.post('/signup', proController.signup);

// Login Route
router.post('/login', proController.login);

// Forgot Password Route (send OTP)
router.post('/forgot-password', proController.forgotPassword);

// Reset Password Route (verify OTP and reset)
router.post('/reset-password', proController.resetPassword);

// Send OTP
router.post('/send-otp', proController.sendOtpAPI);

// Verify OTP
router.post('/verify-otp', proController.verifyOtp);

router.use(userMiddleware);

// Create Profile
router.post('/create-profile', proController.createProfile);

// User Verified Status
router.get('/user-verified', proController.getUserVerificationStatus);

// Get User Profile
router.get('/user-profile', proController.getUserProfile);

// Get Other User Profile
router.get('/other-user-profile', proController.getOtherUserProfile);

// Update User Profile (only accessible if the user is authenticated)
router.put('/update-profile', proController.updateProfile);

// Get Followers
router.get('/followers', proController.getFollowers);

// Get Followings
router.get('/followings', proController.getFollowings);

// Follow/Unfollow User
router.post('/follow', proController.followOrUnfollowUser); // Now expects query param `followUserId`

//Search Users
router.get('/search', proController.searchUsers);

module.exports = router;
