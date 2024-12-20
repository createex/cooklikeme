const Post = require('../models/post');
const User = require('../models/User');
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
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));
    const userId = req.userId;

    // Validate pagination values
    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    // Calculate pagination
    const totalPosts = await Post.countDocuments({ owner_id: userId });
    if (totalPosts === 0) {
      return res.status(200).json({ message: "No posts found.", posts: [], pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: items } });
    }

    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });

    // Fetch posts with pagination
    let posts = await Post.find({ owner_id: userId }).skip((page - 1) * items).limit(items);
    posts = await Promise.all(posts.map(async (post) => {
      const owner = await User.findById(post.owner_id).select('name picture');
      return {
        _id: post._id,
        description: post.description,
        owner: {
          id: post.owner_id,
          name: owner?.name || '',
          picture: owner?.picture || ''
        },
        tags: post.tags || [],
        location: post.location || {},
        likes: post.likes || [],
        shares: post.shares || [],
        comments: post.comments || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    }));

    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items }
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;
    const userId = req.userId;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Helper to populate owner details
    const populateOwner = async (post) => {
      const owner = await User.findById(post.owner_id).select('name picture');
      return {
        _id: post._id,
        description: post.description,
        owner: { id: post.owner_id, name: owner?.name || '', picture: owner?.picture || '' },
        tags: post.tags || [],
        location: post.location || {},
        likes: post.likes || [],
        shares: post.shares || [],
        comments: post.comments || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    };

    // Fetch posts: trending, followed users, and random
    const [trendingPosts, followingPosts, randomPosts] = await Promise.all([
      Post.aggregate([
        { $addFields: { numLikes: { $size: { $ifNull: ["$likes", []] } }, numShares: { $size: { $ifNull: ["$shares", []] } }, numComments: { $size: { $ifNull: ["$comments", []] } } } },
        { $sort: { numLikes: -1, numShares: -1, numComments: -1, createdAt: -1 } },
        { $limit: items }
      ]),
      user.followings?.length ? Post.find({ owner_id: { $in: user.followings } }).sort({ createdAt: -1 }).limit(items) : [],
      Post.aggregate([{ $sample: { size: items } }])
    ]);

    // Combine posts and shuffle them
    let posts = [...trendingPosts, ...followingPosts, ...randomPosts];
    posts = await Promise.all(posts.map(populateOwner));
    posts = posts.sort(() => Math.random() - 0.5);  // Shuffle posts

    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });

    const postsToSend = posts.slice((page - 1) * items, page * items);
    return res.status(200).json({ message: "Posts fetched successfully", posts: postsToSend, pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items } });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { addPost, getUserPosts, getPosts };
