const nodemailer = require('nodemailer');
const User = require('../models/User'); // Import the User model

// Function to generate and send OTP
const sendOtp = async (email) => {
  // Generate a 6-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000);
  const expiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  // Find the user by email and update the OTP and expiry time
  const user = await User.findOneAndUpdate(
    { email },
    { otp, otpExpiry: new Date(expiry) }, // Save OTP and expiry to DB
    { new: true } // Return the updated user document
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Create a transporter for sending emails
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',  // Change to your mail service
  //   auth: {
  //     user: process.env.EMAIL,  // Your email address
  //     pass: process.env.EMAIL_PASSWORD   // Your email password or app-specific password
  //   }
  // });

  // Mail options
  const mailOptions = {
    from: 'Cook Like Me',
    to: email,
    subject: 'Your OTP for Login Verification',
    text: `Your OTP is: ${otp}. This OTP is valid for 10 minutes.`
  };

  try {
    // Send the email with the OTP
    // await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = { sendOtp };
