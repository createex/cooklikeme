const mongoose = require('mongoose');

// User Schema
const proSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: "", trim: true },
  picture: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  description: { type: String, default: '' },
  otp: { type: Number }, // OTP field
  otpExpiry: { type: Date }, // Expiry date for OTP
  isOtpVerified: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', proSchema);
