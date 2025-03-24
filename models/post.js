const mongoose = require('mongoose');

// Post Schema
const postSchema = new mongoose.Schema({
  video: { type: String, required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  description: { type: String, default: '' },
  tags: [{ type: String, required: true }],
  thumbnail: { type: String, default: '' },
  location: {
    locationString: { 
      type: String,
      validate: {
        validator: function(value) {
          return value !== null && value !== undefined; // Allow empty string but not null or undefined
        },
        message: 'Location cannot be null or undefined'
      }
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
