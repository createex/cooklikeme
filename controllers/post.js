const Post = require('../models/post');
const mongoose = require('mongoose');

// Validation function with user-friendly messages
const validatePost = (data) => {
  const errors = [];
  
  // Video URL validation
  if (!data.video) {
    errors.push('Please provide a video URL.');
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
    const { video, description, tags, location } = req.body;
    
    const owner_id = req.userId;
    console.log("Owner ID:", owner_id);

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

const getUserPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;

    // Log initial query parameters

    // Validate query parameters
    const items = parseInt(itemsPerPage, 10);
    const page = parseInt(pageNumber, 10);

    // Log parsed pagination values

    if (isNaN(items) || items <= 0) {
      return res.status(400).json({ message: "Invalid value for 'itemsPerPage'. Must be a positive number." });
    }

    if (isNaN(page) || page <= 0) {
      return res.status(400).json({ message: "Invalid value for 'pageNumber'. Must be a positive number." });
    }

    const userId = req.userId;

    // Log the userId

    // Calculate pagination
    const totalPosts = await Post.countDocuments({ owner_id: userId });

    if (totalPosts === 0) {
      return res.status(200).json({
        message: "No posts found for the user.",
        posts: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: items
        }
      });
    }

    const totalPages = Math.ceil(totalPosts / items);

    // Log total posts and calculated total pages

    if (page > totalPages) {
      return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    const posts = await Post.find({ owner_id: userId })
      .skip((page - 1) * items)
      .limit(items);

    // Log posts retrieved

    // Response
    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: {
        totalPosts,
        totalPages,
        currentPage: page,
        itemsPerPage: items,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { addPost, getUserPosts };
