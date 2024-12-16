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

// Verify OTP
router.post('/send-otp', proController.sendOtpAPI);

// Verify OTP
router.post('/verify-otp', proController.verifyOtp);

router.use(userMiddleware);

// create-profile
router.post('/create-profile', proController.createProfile);

// create-profile
router.get('/user-verified', proController.getUserVerificationStatus);

// create-profile
router.get('/user-profile', proController.getUserProfile);

// Update user profile (only accessible if the user is authenticated)
router.put('/update-profile', proController.updateProfile);

module.exports = router;
