const mongoose = require("mongoose");
const User = require("../models/user");
const Wallet = require("../models/wallet");

// Create a new user with a wallet
const createUserWithWallet = async (userData) => {
  try {
    // Create a new wallet
    const newWallet = await Wallet.create({
      userId: new mongoose.Types.ObjectId(),
      coinBalance: 0,
      giftRewards: 0,
    });

    // Create a new user and associate the wallet
    const newUser = new User({
      ...userData, // Spread user data from request
      walletId: newWallet._id, // Linking wallet to the user
    });

    // Save the new user with the wallet
    await newUser.save();
    return newUser; // Return the newly created user with wallet
  } catch (error) {
    throw new Error("Error creating user and wallet", error);
  }
};

module.exports = { createUserWithWallet };
