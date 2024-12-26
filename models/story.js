const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  owner_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  media: { 
    type: String,  // URL or file path to the media (image/video)
    required: true 
  },
  mediaType: { 
    type: String, // Either 'image' or 'video'
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    default: function() { 
      return Date.now() + 24 * 60 * 60 * 1000;  // 24 hours from creation time
    }
  },
  isActive: { 
    type: Boolean, 
    default: true  // Story is active by default
  }
});

// Pre-save middleware to automatically deactivate the story after 24 hours
storySchema.pre('save', function(next) {
  const currentTime = Date.now();
  if (this.expiresAt <= currentTime) {
    this.isActive = false;  // Deactivate story after 24 hours
  }
  next();
});

module.exports = mongoose.model('Story', storySchema);
