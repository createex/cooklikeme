const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Conversation = require("../models/conversation");
const Post = require("../models/post");
const { sendOtp, getOtp } = require("../utils/send_otp");
const { createUserWithWallet } = require("../controllers/wallet"); // Import wallet controller
const mongoose = require("mongoose");
const NodeRSA = require("node-rsa");
const { decryptOldPassword } = require("../utils/old_decryption"); // Import old decryption logic

// User Login
const login = async (req, res) => {
  const { username_or_email, password, fcmToken } = req.body;

  try {
    // Check if the provided username_or_email is an email or username
    let user;
    if (username_or_email.includes("@")) {
      // If it's an email, search by email
      user = await User.findOne({ email: username_or_email });
    } else {
      // If it's not an email, search by username
      user = await User.findOne({ username: username_or_email });
    }

    // If user is not found
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }
    
    // // First, attempt to compare the password using bcrypt
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (isPasswordCorrect) {
      // Create a JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      return res.status(200).json({
        message: "Login successful",
        isOtpVerified: user.isOtpVerified,
        token,
        _id: user._id,
      });
    }

    // If both methods fail, return password incorrect
    return res.status(400).json({ message: "Invalid password" });

  } catch (error) {
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

// User Sign-Up
const signup = async (req, res) => {
  const { email, password, username, name, picture, coverPhoto, description } =
    req.body;

  try {
    // Check if the email is already registered
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res
        .status(400)
        .json({ message: "This email is already registered." });
    }

    // Check if the username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res
        .status(400)
        .json({ message: "This username is already taken." });
    }

    // Hash the password before saving it
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Prepare user data (including the new fields)
    const userData = {
      email,
      password: hashedPassword,
      username,
      name,
      picture,
      coverPhoto,
      description,
    };

    // Create the user with the wallet
    const newUser = await createUserWithWallet(userData);

    // Generate JWT token for the new user
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    await sendOtp(email);
    return res
      .status(201)
      .json({ message: "User registered successfully", token });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

const sendOtpAPI = async (req, res) => {
  const { email } = req.body;
  try {
    let user;
    user = await User.findOne({ email: email });

    // If user is not found
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    await sendOtp(email);
    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP exists and is not expired
    if (!user.otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Verify the OTP
    if (user.otp !== parseInt(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP verified, update the user to set isOtpVerified and remove OTP
    await User.updateOne(
      { email },
      {
        $set: { isOtpVerified: true },
        $unset: { otp: 1, otpExpiry: 1 }, // Remove OTP and expiry fields
      }
    );

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendOtp(email); // Send OTP for password reset
    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the password using updateOne and await the operation
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

const createProfile = async (req, res) => {
  const {
    profilePicture,
    name,
    serviceCategory,
    businessDetails,
    phoneNumber,
    address,
    postCode,
  } = req.body;
  const token = req.headers.authorization?.split(" ")[1]; // Assuming the token is passed in the Authorization header

  try {
    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const proId = decodedToken.userId; // Extract the user ID from the token

    // Find the existing profile
    const existingPro = await User.findById(proId);

    if (!existingPro) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the profile is already created
    if (existingPro.profileCreated) {
      const response = {
        id: existingPro._id,
        picture: existingPro.picture,
        name: existingPro.name,
        email: existingPro.email,
        profileCreated: existingPro.profileCreated,
      };
      return res
        .status(200)
        .json({ message: "Profile already created", profile: response });
    }

    // Update profile with the provided details and mark it as created
    const updatedPro = await User.findByIdAndUpdate(
      proId,
      {
        picture: profilePicture,
        name,
        serviceCategory,
        businessDetails,
        phoneNumber,
        address,
        postCode,
        profileCreated: true, // Mark profile as created
      },
      { new: true } // Return the updated document
    );

    // Create a response object containing only the required fields
    const response = {
      id: updatedPro._id,
      picture: updatedPro.picture,
      name: updatedPro.name,
      email: updatedPro.email,
      profileCreated: updatedPro.profileCreated,
    };

    return res.status(200).json({
      message: "Profile created successfully",
      profile: response,
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    return res.status(500).json({ message: "Something went wrong.", error });
  }
};

// Get User Verification Status
const getUserVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Return only the isVerified status
    return res.status(200).json({
      status: true,
      message: "User verification status retrieved successfully",
      isOtpVerified: user.isOtpVerified,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      error,
    });
  }
};

// User Controller: getUserProfile
const getUserProfile = async (req, res) => {
  try {
    // Fetch the user by userId that is already set by the userMiddleware
    const user = await User.findById(req.userId);
    const posts = await Post.find({ owner_id: req.userId });
    // Return user profile details
    return res.status(200).json({
      status: true,
      message: "User profile retrieved successfully",
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        picture: user.picture,
        coverPhoto: user.coverPhoto,
        description: user.description,
        posts: posts.length,
        followers: user.followers,
        followings: user.followings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      error,
    });
  }
};

// User Controller: getUserProfile
const getOtherUserProfile = async (req, res) => {
  try {
    // Fetch the user by userId that is already set by the userMiddleware
    const currentUserId = req.userId;
    const userId = req.query.userId;
    const user = await User.findById(userId);

    if(!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Check if a conversation already exists between sender and receiver
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] }, // Check for both participants
    });

    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, userId],
      });
      await conversation.save();
    }

    const posts = await Post.find({ owner_id: userId });

    // Return user profile details
    return res.status(200).json({
      status: true,
      message: "User profile retrieved successfully",
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        conversationId: conversation._id,
        picture: user.picture,
        coverPhoto: user.coverPhoto,
        description: user.description,
        posts: posts.length,
        followers: user.followers,
        followings: user.followings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong: " + error,
      error,
    });
  }
};

const updateProfile = async (req, res) => {
  const {
    username,
    picture,
    coverPhoto = "",
    name = "",
    description = "",
  } = req.body;

  try {
    // Check if the username is already taken by another user (other than the current one)
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.userId) {
      return res.status(400).json({ message: "Username is already taken" }); // If username is taken, return error
    }

    // Find the user by their userId (set by middleware)
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // If user is not found, return error
    }

    // Update the user profile with the provided data
    user.username = username || user.username;
    user.picture = picture || user.picture;
    user.coverPhoto = coverPhoto || user.coverPhoto;
    user.name = name || user.name;
    user.description = description || user.description;

    // Save the updated user
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      profile: {
        username: user.username,
        email: user.email,
        name: user.name,
        picture: user.picture,
        coverPhoto: user.coverPhoto,
        description: user.description,
        followers: user.followers,
        followings: user.followings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong while updating the profile",
      error: error.message,
    });
  }
};

const getFollowers = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).populate(
      "followers",
      "id username picture followings description"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followers = user.followers.map((follower) => ({
      id: follower._id,
      username: follower.username,
      picture: follower.picture,
      description: follower.description || "",
      youFollowed: user.followings.includes(follower._id),
    }));

    return res
      .status(200)
      .json({ message: "Followers fetched successfully", followers });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const getFollowings = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).populate(
      "followings",
      "id name username picture followings description"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followings = user.followings.map((following) => ({
      id: following._id,
      name: following.name,
      username: following.username,
      picture: following.picture,
      description: following.description || "",
      followedYou: following.followings.includes(userId), // Check if the current user is in their followers list
    }));

    return res
      .status(200)
      .json({ message: "Followings fetched successfully", followings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const followOrUnfollowUser = async (req, res) => {
  try {
    const userId = req.userId; // Current user's ID
    const followUserId = req.query.followUserId; // Get `followUserId` from query params

    if (!followUserId) {
      return res.status(400).json({ message: "followUserId is required" });
    }

    if (userId === followUserId) {
      return res
        .status(400)
        .json({ message: "You cannot follow/unfollow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(followUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = user.followings.includes(followUserId);

    if (isFollowing) {
      // Unfollow the user
      user.followings.pull(followUserId);
      targetUser.followers.pull(userId);
      await user.save();
      await targetUser.save();

      return res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow the user
      user.followings.push(followUserId);
      targetUser.followers.push(userId);
      await user.save();
      await targetUser.save();

      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  sendOtpAPI,
  createProfile,
  getUserVerificationStatus,
  getUserProfile,
  updateProfile,
  getFollowers,
  getFollowings,
  followOrUnfollowUser,
  getOtherUserProfile
};
