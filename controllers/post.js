const Post = require('../models/post');
const User = require('../models/User');
const Comment = require('../models/comment');

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
    posts = await Promise.all(posts.map(async (post) => populateOwner(post, userId)));

    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items }
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getLikedPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));
    const userId = req.userId;

    // Validate pagination values
    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    // Fetch the total count of liked posts
    const totalPosts = await Post.countDocuments({ likes: userId });
    if (totalPosts === 0) {
      return res.status(200).json({
        message: "No liked posts found.",
        posts: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: items }
      });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) {
      return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    // Fetch liked posts with pagination
    const posts = await Post.find({ likes: userId })
      .skip((page - 1) * items)
      .limit(items);

    const detailedPosts = await Promise.all(posts.map(async (post) => populateOwner(post, userId)));

    return res.status(200).json({
      message: "Liked posts fetched successfully",
      posts: detailedPosts,
      pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items }
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


const getSavedPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));
    const userId = req.userId;

    // Validate pagination values
    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    // Calculate total saved posts for the user
    const totalPosts = await Post.countDocuments({ saves: userId });
    if (totalPosts === 0) {
      return res.status(200).json({
        message: "No posts found.",
        posts: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: items,
        },
      });
    }

    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) {
      return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    // Fetch saved posts with pagination
    let posts = await Post.find({ saves: userId })
      .skip((page - 1) * items)
      .limit(items);

    posts = await Promise.all(
      posts.map(async (post) => populateOwner(post, userId))
    );

    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// API 1: Get Followings' Posts
const getFollowingsPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;
    const userId = req.userId;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.followings?.length) {
      return res.status(200).json({ message: 'No followings posts', posts: [] });
    }

    const followingPosts = await Post.find({ owner_id: { $in: user.followings } })
      .sort({ createdAt: -1 })
      .limit(items);

    const posts = await Promise.all(followingPosts.map((post) => populateOwner(post, userId)));

    return res.status(200).json({ message: 'Followings posts fetched successfully', posts });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// API 2: Get Trending and Random Posts
const getTrendingAndRandomPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;
    const userId = req.userId;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));

    const [trendingPosts, randomPosts] = await Promise.all([
      Post.aggregate([
        {
          $addFields: {
            numLikes: { $size: { $ifNull: ['$likes', []] } },
            numShares: { $size: { $ifNull: ['$shares', []] } },
            numComments: { $size: { $ifNull: ['$comments', []] } },
          },
        },
        { $sort: { numLikes: -1, numShares: -1, numComments: -1, createdAt: -1 } },
        { $limit: items },
      ]),
      Post.aggregate([{ $sample: { size: items } }]),
    ]);

    const posts = [...trendingPosts, ...randomPosts];
    const populatedPosts = await Promise.all(posts.map((post) => populateOwner(post, userId)));

    return res.status(200).json({ message: 'Trending and random posts fetched successfully', posts: populatedPosts });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Add user to likes if not already liked
      post.likes.push(userId);
      await post.save();
      return res.status(200).json({ message: "Post liked successfully" });
    } else {
      // Remove user from likes if already liked (unlike)
      post.likes.splice(likeIndex, 1);
      await post.save();
      return res.status(200).json({ message: "Post unliked successfully" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const savePost = async (req, res) => {
  try {
    const { postId } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const saveIndex = post.saves.indexOf(userId);

    if (saveIndex === -1) {
      // Add user to saves if not already saved
      post.saves.push(userId);
      await post.save();
      return res.status(200).json({ message: "Post saved successfully" });
    } else {
      // Remove user from saves if already saved (unsave)
      post.saves.splice(saveIndex, 1);
      await post.save();
      return res.status(200).json({ message: "Post unsaved successfully" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const sharePost = async (req, res) => {
  try {
    const { postId } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Add user to shares list (even if shared before)
    post.shares.push(userId);
    await post.save();

    return res.status(200).json({ message: "Post shared successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.query;
    const { text } = req.body;
    const { replyToCommentId } = req.query;
    const userId = req.userId;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = new Comment({
      post_id: postId,
      owner_id: userId,
      text,
    });

    const savedComment = await newComment.save();

    if (replyToCommentId) {
      const parentComment = await Comment.findById(replyToCommentId);
      if (parentComment) {
        parentComment.replies.push(savedComment._id);
        await parentComment.save();
      }
    }

    post.comments.push(savedComment._id);
    await post.save();

    return res.status(201).json({ message: "Comment added successfully", comment: savedComment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


module.exports = { addPost, getUserPosts, likePost, savePost, sharePost, commentOnPost, getLikedPosts, getSavedPosts, getTrendingAndRandomPosts, getFollowingsPosts };


//Helpers
const populateOwner = async (post, userId) => {
  const owner = await User.findById(post.owner_id).select('name picture');
  post.likes = post.likes || [];
  post.saves = post.saves || [];

  // Check if the current user has liked or saved the post
  const ObjectId = require('mongoose').Types.ObjectId;
  const userIdObjectId = new ObjectId(userId);
  const isLiked = post.likes.some((like) => like.equals(userIdObjectId));
  const isSaved = post.saves.some((save) => save.equals(userIdObjectId));

  return {
    _id: post._id,
    description: post.description,
    owner: { id: post.owner_id, name: owner?.name || '', picture: owner?.picture || '' },
    tags: post.tags || [],
    location: post.location || {},
    likes: post.likes.length || 0,
    shares: post.shares.length || 0,
    saves: post.saves.length || 0,
    comments: post.comments.length || 0,
    isLiked,
    isSaved,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
};