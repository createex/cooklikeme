const Post = require('../models/post');
const mongoose = require('mongoose');

// Validation function with user-friendly messages
const validatePost = (data) => {
  const errors = [];
  
  // Video URL validation
  if (!data.video) {
    errors.push('Please provide a video URL.');
  }
  
  // Owner ID validation
  if (!data.owner_id || !mongoose.Types.ObjectId.isValid(data.owner_id)) {
    errors.push('Invalid owner ID.');
  }
  
  // Tags validation
  if (!data.tags || data.tags.length === 0) {
    errors.push('At least one tag is required.');
  }
  
  // Location validation
  if (!data.location || typeof data.location !== 'object') {
    errors.push('Location details are required.');
  } else {
    if (!data.location.locationString) {
      errors.push('Please provide a location description.');
    }
    if (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
      errors.push('Please provide valid latitude and longitude.');
    }
  }

  return errors;
};

// Controller to add a new post
const addPost = async (req, res) => {
  try {
    const { video, owner_id, description, tags, location } = req.body;

    // Validate the post data
    const validationErrors = validatePost(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation Error', errors: validationErrors });
    }

    // Create a new post
    const newPost = new Post({
      video,
      owner_id,
      description: description || '', // Default to empty string if not provided
      tags,
      location
    });

    // Save the post to the database
    await newPost.save();

    // Return success response
    return res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

module.exports = { addPost };
