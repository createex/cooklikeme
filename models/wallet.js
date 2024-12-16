const mongoose = require('mongoose');

// Wallet Schema
const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coinBalance: { type: Number, default: 0 },  // The number of hats bought through self-payment
  giftRewards: { type: Number, default: 0 },  // The number of hats received as gifts
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', walletSchema);
