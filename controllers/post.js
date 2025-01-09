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
    const { video, description, tags, location, thumbnail } = req.body;
    
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
      thumbnail: thumbnail || '',
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

    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    const totalPosts = await Post.countDocuments({ owner_id: userId });
    console.log("Total Posts:", totalPosts);
    if (totalPosts === 0 || totalPosts === undefined || totalPosts === null || totalPosts === NaN || !totalPosts) {
      return res.status(200).json({
        message: "No posts found.",
        posts: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: items },
      });
    }

    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) {
      return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    const userPosts = await Post.find({ owner_id: userId })
      .select('video owner_id likes shares saves comments description tags location createdAt updatedAt thumbnail')
      .skip((page - 1) * items)
      .limit(items);

    const posts = await Promise.all(userPosts.map(async (post) => {
      const owner = await User.findById(post.owner_id).select('id name picture fcmToken');
      return {
        _id: post._id,
        thumbnail: post.thumbnail || "",
        video: post.video,
        description: post.description,
        owner: { id: owner._id, name: owner.name, picture: owner.picture, fcmToken: owner.fcmToken || '' },
        tags: post.tags,
        location: post.location,
        likes: post.likes.length,
        shares: post.shares.length,
        saves: post.saves.length,
        comments: post.comments.length,
        isLiked: post.likes.includes(userId),
        isSaved: post.saves.includes(userId),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    }));

    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
      pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items },
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

    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    const totalPosts = await Post.countDocuments({ likes: userId });
    if (totalPosts === 0) {
      return res.status(200).json({
        message: "No liked posts found.",
        posts: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: items },
      });
    }

    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) {
      return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    const likedPosts = await Post.find({ likes: userId })
      .select('video owner_id likes shares saves comments description tags location createdAt updatedAt thumbnail')
      .skip((page - 1) * items)
      .limit(items);

    const posts = await Promise.all(likedPosts.map(async (post) => {
      const owner = await User.findById(post.owner_id).select('id name picture fcmToken');

      return {
        _id: post._id,
        thumbnail: post.thumbnail || "",
        video: post.video,
        description: post.description,
        owner: { id: owner._id, name: owner.name, picture: owner.picture, fcmToken: owner.fcmToken || '' },
        tags: post.tags,
        location: post.location,
        likes: post.likes.length,
        shares: post.shares.length,
        saves: post.saves.length,
        comments: post.comments.length,
        isLiked: post.likes.includes(userId),
        isSaved: post.saves.includes(userId),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    }));

    return res.status(200).json({
      message: "Liked posts fetched successfully",
      posts,
      pagination: { totalPosts, totalPages, currentPage: page, itemsPerPage: items },
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

    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    const totalPosts = await Post.countDocuments({ saves: userId });
    if (totalPosts === 0) {
      return res.status(200).json({
        message: "No posts found.",
        posts: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: page, itemsPerPage: items },
      });
    }

    const totalPages = Math.ceil(totalPosts / items);
    if (page > totalPages) {
      return res.status(400).json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    let posts = await Post.find({ saves: userId })
      .skip((page - 1) * items)
      .limit(items);

    posts = await Promise.all(posts.map(async (post) => populateOwnerWithVideo(post, userId)));

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
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.followings?.length) {
      return res.status(200).json({ message: 'No followings posts', posts: [] });
    }

    const skip = (page - 1) * items;

    const followingPosts = await Post.find({ owner_id: { $in: user.followings } })
      .select('video owner_id likes shares saves comments description tags location createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(items);

    const posts = await Promise.all(
      followingPosts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select('id name picture fcmToken');
        return {
          _id: post._id,
          video: post.video,
          description: post.description,
          owner: {
            id: owner._id,
            name: owner.name,
            picture: owner.picture,
            fcmToken: owner.fcmToken || "",
          },
          tags: post.tags,
          location: post.location,
          likes: post.likes.length,
          shares: post.shares.length,
          saves: post.saves.length,
          comments: post.comments.length,
          isLiked: post.likes.includes(userId),
          isSaved: post.saves.includes(userId),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    return res.status(200).json({ message: 'Followings posts fetched successfully', posts });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


// API 2: Get Trending and Random Posts
const getTrendingAndRandomPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1, exclude = [] } = req.query; // Added `exclude` for already fetched post IDs
    const userId = req.userId;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));

    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    const skip = (page - 1) * items;

    const excludedIds = exclude.map((id) => mongoose.Types.ObjectId(id));

    const [trendingPosts, randomPosts] = await Promise.all([
      Post.aggregate([
        {
          $addFields: {
            numLikes: { $size: { $ifNull: ['$likes', []] } },
            numShares: { $size: { $ifNull: ['$shares', []] } },
            numComments: { $size: { $ifNull: ['$comments', []] } },
            numSaves: { $size: { $ifNull: ['$saves', []] } },
          },
        },
        { $sort: { numLikes: -1, numShares: -1, numComments: -1, numSaves: -1, createdAt: -1 } },
        { $match: { _id: { $nin: excludedIds } } }, // Exclude already fetched posts
        { $skip: skip },
        { $limit: items == 1 ? 1 : items % 2 === 0 ? items / 2 : Math.ceil(items / 2) },
        {
          $project: {
            _id: 1,
            video: 1,
            owner_id: 1,
            description: 1,
            tags: 1,
            location: 1,
            createdAt: 1,
            updatedAt: 1,
            likes: 1,
            saves: 1,
            shares: 1,
            comments: 1,
          },
        },
      ]),
      items != 1 ? Post.aggregate([
        {
          $addFields: {
            numLikes: { $size: { $ifNull: ['$likes', []] } },
            numShares: { $size: { $ifNull: ['$shares', []] } },
            numComments: { $size: { $ifNull: ['$comments', []] } },
            numSaves: { $size: { $ifNull: ['$saves', []] } },
          },
        },
        { $sort: { numLikes: -1, numShares: -1, numComments: -1, numSaves: -1, createdAt: -1 } },
        { $match: { _id: { $nin: excludedIds } } }, // Exclude already fetched posts
        { $skip: skip },
        { $limit: items % 2 === 0 ? items / 2 : Math.floor(items / 2) },
        {
          $project: {
            _id: 1,
            video: 1,
            owner_id: 1,
            description: 1,
            tags: 1,
            location: 1,
            createdAt: 1,
            updatedAt: 1,
            likes: 1,
            saves: 1,
            shares: 1,
            comments: 1,
          },
        },
      ]) : ([]),
    ]);

    const posts = [...trendingPosts, ...randomPosts];
    const populatedPosts = await Promise.all(
      posts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select('name picture fcmToken');
        const isLiked = post.likes.some((like) => like.equals(userId));
        const isSaved = post.saves.some((save) => save.equals(userId));

        return {
          _id: post._id,
          video: post.video || '',
          description: post.description || '',
          owner: {
            id: post.owner_id,
            name: owner?.name || '',
            picture: owner?.picture || '',
            fcmToken: owner?.fcmToken || '',
          },
          tags: post.tags || [],
          location: post.location || {},
          likes: post.likes?.length || 0,
          shares: post.shares?.length || 0,
          saves: post.saves?.length || 0,
          comments: post.comments?.length || 0,
          isLiked,
          isSaved,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    res.status(200).json({
      message: 'Trending and random posts fetched successfully',
      posts: populatedPosts,
    });
  } catch (error) {
    console.error('Error fetching trending and random posts:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
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
    const { replyToCommentId } = req.query;  // Check if it's a reply
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

    // Create a new comment object
    const newComment = new Comment({
      post_id: postId,
      owner_id: userId,
      text,
    });

    // Save the comment
    const savedComment = await newComment.save();

    if (replyToCommentId) {
      // If it's a reply, find the parent comment and add this comment to its replies
      const parentComment = await Comment.findById(replyToCommentId);
      if (parentComment) {
        parentComment.replies.push(savedComment._id);  // Add the new comment to the replies
        await parentComment.save();
      }
    } else {
      // If it's not a reply, add the comment to the post's comments array
      post.comments.push(savedComment._id);
      await post.save();
    }

    return res.status(201).json({ message: "Comment added successfully", comment: savedComment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId, parentCommentId } = req.query;
    const { itemsPerPage = 10, pageNumber = 1 } = req.query;

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));
    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values" });
    }

    // If parentCommentId is provided, fetch replies for that comment
    if (parentCommentId) {
      console.log("Fetching replies for parent comment:", parentCommentId);

      // Get the comment with the specific parentCommentId and populate replies
      const parentComment = await Comment.findOne({ post_id: postId, _id: parentCommentId })
        .populate('owner_id', 'name email _id profile_picture fcmToken')  // Populate owner details with profile_picture
        .populate({
          path: 'replies',
          populate: {
            path: 'owner_id',
            select: 'name email _id profile_picture fcmToken',
          }
        })
        .lean();

      console.log("Parent comment fetched:", parentComment); // Debug the parent comment

      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      // Process replies and log the replies data
      const processedReplies = parentComment.replies.map(reply => {
        console.log("Reply before mapping:", reply); // Debug each reply

        return {
          _id: reply._id,
          post_id: reply.post_id,
          owner_id: {
            _id: reply.owner_id._id,
            name: reply.owner_id.name,
            profile_picture: reply.owner_id.profile_picture || "",
            fcmToken: reply.owner_id.fcmToken || "",
          },
          text: reply.text,
          likesCount: reply.likes.length,
          repliesCount: reply.replies ? reply.replies.length : 0,
          createdAt: reply.createdAt,
        };
      });

      return res.status(200).json({
        message: "Replies fetched successfully",
        replies: processedReplies,
        pagination: {
          totalItems: processedReplies.length,
          totalPages: Math.ceil(processedReplies.length / items),
          currentPage: page,
          itemsPerPage: items,
        },
      });
    }

    // Fetching main comments for the post (no replies)
    const commentsQuery = { post_id: postId, replies: { $exists: false } };

    // Get total main comments for the post
    const totalComments = await Comment.countDocuments({ post_id: postId, replies: { $exists: false } });

    // Fetch main comments with pagination and populate owner details and replies
    const comments = await Comment.find(commentsQuery)
      .skip((page - 1) * items)
      .limit(items)
      .sort({ createdAt: -1 })  // Sort by latest
      .populate('owner_id', 'name email _id profile_picture')  // Populate owner details with profile_picture
      .populate({
        path: 'replies',
        populate: {
          path: 'owner_id',
          select: 'name email _id profile_picture', // Populate owner details for replies with profile_picture
        }
      })
      .lean();

    console.log("Main comments fetched:", comments); // Debug the main comments

    // Process the main comments and return the necessary fields
    const processedComments = comments.map(comment => {
      console.log("Comment before mapping:", comment); // Debug each comment

      return {
        _id: comment._id,
        post_id: comment.post_id,
        owner_id: {
          _id: comment.owner_id._id,
          name: comment.owner_id.name,
          email: comment.owner_id.email,
          profile_picture: comment.owner_id.profile_picture || "", // Return empty string if no profile picture
        },
        text: comment.text,
        likesCount: comment.likes.length,
        repliesCount: comment.replies ? comment.replies.length : 0,
        createdAt: comment.createdAt,
        replies: comment.replies ? comment.replies.map(reply => {
          console.log("Reply before mapping:", reply); // Debug each reply inside comment

          return {
            _id: reply._id,
            post_id: reply.post_id,
            owner_id: {
              _id: reply.owner_id._id,
              name: reply.owner_id.name,
              email: reply.owner_id.email,
              profile_picture: reply.owner_id.profile_picture || "", // Return empty string if no profile picture
            },
            text: reply.text,
            likesCount: reply.likes.length,
            repliesCount: reply.replies ? reply.replies.length : 0,
            createdAt: reply.createdAt,
          };
        }) : [],
      };
    });

    return res.status(200).json({
      message: "Comments fetched successfully",
      totalComments,
      comments: processedComments,
      pagination: {
        totalItems: totalComments,
        totalPages: Math.ceil(totalComments / items),
        currentPage: page,
        itemsPerPage: items,
      },
    });
  } catch (error) {
    console.error("Error occurred:", error); // Log the error
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { addPost, getUserPosts, likePost, savePost, sharePost, commentOnPost, getLikedPosts, getSavedPosts, getTrendingAndRandomPosts, getFollowingsPosts, getComments };


//Helpers
const populateOwner = async (post, userId) => {
  const ObjectId = require('mongoose').Types.ObjectId;
  const userIdObjectId = new ObjectId(userId);

  try {
    console.log(`[DEBUG] Fetching owner details for post ID: ${post._id}`);
    const owner = await User.findById(post.owner_id).select('name picture');
    if (!owner) {
      console.log(`[DEBUG] Owner not found for owner_id: ${post.owner_id}`);
    }

    // Ensure post properties exist
    post.likes = post.likes || [];
    post.saves = post.saves || [];
    post.comments = post.comments || [];
    post.shares = post.shares || [];
    console.log(`[DEBUG] Post likes count: ${post.likes.length}, saves count: ${post.saves.length}`);
    console.log('[DEBUG] Post' + JSON.stringify(post));
    // Check if the current user has liked or saved the post
    const isLiked = post.likes.some((like) => like.equals(userIdObjectId));
    const isSaved = post.saves.some((save) => save.equals(userIdObjectId));
    console.log(`[DEBUG] Post liked by user: ${isLiked}, saved by user: ${isSaved}`);

    return {
      _id: post._id,
      thumbnail: post.thumbnail || "",
      video: post.video || "", // Add video field if missing
      description: post.description,
      owner: {
        id: post.owner_id,
        name: owner?.name || '',
        picture: owner?.picture || '',
        fcmToken: owner?.fcmToken || '',
      },
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
  } catch (error) {
    console.error(`[ERROR] Error in populateOwner for post ID: ${post._id}. Error: ${error.message}`);
    throw error; // Re-throw the error to handle it upstream
  }
};

const populateOwnerWithVideo = async (post, userId) => {
  const owner = await User.findById(post.owner_id).select("id name picture fcmToken");
  return {
    _id: post._id,
    thumbnail: post.thumbnail || "",
    video: post.video || "", // Add video field if missing
    description: post.description,
    owner: {
      id: owner._id,
      name: owner.name,
      picture: owner.picture,
      fcmToken: owner.fcmToken ||  "",
    },
    tags: post.tags,
    location: post.location,
    likes: post.likes.length,
    shares: post.shares.length,
    saves: post.saves.length,
    comments: post.comments.length,
    isLiked: post.likes.includes(userId),
    isSaved: post.saves.includes(userId),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
};