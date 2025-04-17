const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

const mongoose = require("mongoose");

// Validation function with user-friendly messages
const validatePost = (data) => {
  const errors = [];

  // Video URL validation
  if (!data.video) {
    errors.push("Please provide a video URL.");
  }

  // Tags validation
  if (!data.tags || data.tags.length === 0) {
    errors.push("At least one tag is required.");
  }

  // Location validation
  if (!data.location || typeof data.location !== "object") {
    errors.push("Location details are required.");
  } else {
    if (!data.location.locationString) {
      errors.push("Please provide a location description.");
    }
    if (
      typeof data.location.lat !== "number" ||
      typeof data.location.lng !== "number"
    ) {
      errors.push("Please provide valid latitude and longitude.");
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
      return res
        .status(400)
        .json({ message: "Validation Error", errors: validationErrors });
    }

    // Create a new post
    const newPost = new Post({
      video,
      thumbnail: thumbnail || "",
      owner_id,
      description: description || "", // Default to empty string if not provided
      tags,
      location,
    });

    // Save the post to the database
    await newPost.save();

    // Return success response
    return res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
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
    if (
      totalPosts === 0 ||
      totalPosts === undefined ||
      totalPosts === null ||
      totalPosts === NaN ||
      !totalPosts
    ) {
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
      return res
        .status(400)
        .json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    const userPosts = await Post.find({ owner_id: userId })
      .select(
        "video owner_id likes shares saves comments description tags location createdAt updatedAt thumbnail"
      )
      .skip((page - 1) * items)
      .limit(items);

    const posts = await Promise.all(
      userPosts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select(
          "id name picture fcmToken followers"
        );
        return {
          _id: post._id,
          thumbnail: post.thumbnail || "",
          video: post.video,
          description: post.description,
          owner: {
            id: owner._id,
            name: owner.name,
            picture: owner.picture,
            fcmToken: owner.fcmToken || "",
            isFollowed: owner.followers.includes(userId),
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
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const getOtherUserPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1, userId } = req.query;
    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));

    if(userId === undefined || userId === null || userId === "") {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    const totalPosts = await Post.countDocuments({ owner_id: userId });
    console.log("Total Posts:", totalPosts);
    if (
      totalPosts === 0 ||
      totalPosts === undefined ||
      totalPosts === null ||
      totalPosts === NaN ||
      !totalPosts
    ) {
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
      return res
        .status(400)
        .json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    const userPosts = await Post.find({ owner_id: userId })
      .select(
        "video owner_id likes shares saves comments description tags location createdAt updatedAt thumbnail"
      )
      .skip((page - 1) * items)
      .limit(items);

    const posts = await Promise.all(
      userPosts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select(
          "id name picture fcmToken followers"
        );
        return {
          _id: post._id,
          thumbnail: post.thumbnail || "",
          video: post.video,
          description: post.description,
          owner: {
            id: owner._id,
            name: owner.name,
            picture: owner.picture,
            fcmToken: owner.fcmToken || "",
            isFollowed: owner.followers.includes(userId),
          },
          tags: post.tags,
          location: post.location,
          likes: post.likes.length,
          shares: post.shares.length,
          saves: post.saves.length,
          comments: post.comments.length,
          isLiked: post.likes.includes(req.userId),
          isSaved: post.saves.includes(req.userId),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

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
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
      return res
        .status(400)
        .json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    const likedPosts = await Post.find({ likes: userId })
      .select(
        "video owner_id likes shares saves comments description tags location createdAt updatedAt thumbnail"
      )
      .skip((page - 1) * items)
      .limit(items);

    const posts = await Promise.all(
      likedPosts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select(
          "id name picture fcmToken followers"
        );

        return {
          _id: post._id,
          thumbnail: post.thumbnail || "",
          video: post.video,
          description: post.description,
          owner: {
            id: owner._id,
            name: owner.name,
            picture: owner.picture,
            fcmToken: owner.fcmToken || "",
            isFollowed: owner.followers.includes(userId),
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

    return res.status(200).json({
      message: "Liked posts fetched successfully",
      posts,
      pagination: {
        totalPosts,
        totalPages,
        currentPage: page,
        itemsPerPage: items,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
      return res
        .status(400)
        .json({ message: `Page number exceeds total pages (${totalPages}).` });
    }

    let posts = await Post.find({ saves: userId })
      .skip((page - 1) * items)
      .limit(items);

    posts = await Promise.all(
      posts.map(async (post) => populateOwnerWithVideo(post, userId))
    );

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
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.followings?.length) {
      return res
        .status(200)
        .json({ message: "No followings posts", posts: [] });
    }

    const skip = (page - 1) * items;

    const followingPosts = await Post.find({
      owner_id: { $in: user.followings },
    })
      .select(
        "video owner_id likes shares saves comments description tags location createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(items);

    const posts = await Promise.all(
      followingPosts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select(
          "id name picture fcmToken followers"
        );
        return {
          _id: post._id,
          video: post.video,
          description: post.description,
          owner: {
            id: owner._id,
            name: owner.name,
            picture: owner.picture,
            fcmToken: owner.fcmToken || "",
            isFollowed: owner.followers.includes(userId),
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

    return res
      .status(200)
      .json({ message: "Followings posts fetched successfully", posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// API 2: Get Trending and Random Posts
const getTrendingAndRandomPosts = async (req, res) => {
  try {
    const { itemsPerPage = 10, pageNumber = 1, exclude = [] } = req.query;
    const userId = req.userId;

    const items = Math.max(1, parseInt(itemsPerPage, 10));
    const page = Math.max(1, parseInt(pageNumber, 10));

    if (isNaN(items) || isNaN(page)) {
      return res.status(400).json({ message: "Invalid pagination values." });
    }

    console.log(`\n[API CALL] itemsPerPage: ${items}, pageNumber: ${page}`);

    let excludedIds = [];
    try {
      excludedIds = exclude.map((id) => mongoose.Types.ObjectId(id));
    } catch (error) {
      console.error("Error converting excluded IDs:", error);
    }

    console.log("[DEBUG] Excluded IDs:", excludedIds);

    const limit = Math.ceil(items / 2); // Half for trending, half for random

    // Count total trending posts to introduce random offset
    const trendingCount = await Post.countDocuments({ _id: { $nin: excludedIds } });
    console.log("[DEBUG] Total Trending Posts Available:", trendingCount);

    const randomTrendingSkip = Math.max(0, Math.floor(Math.random() * Math.max(1, trendingCount - limit)));
    console.log("[DEBUG] Random Trending Skip:", randomTrendingSkip);

    // Fetch Trending Posts with Aggregation
    const trendingPosts = await Post.aggregate([
      { $match: { _id: { $nin: excludedIds } } },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          sharesCount: { $size: "$shares" },
          commentsCount: { $size: "$comments" },
          savesCount: { $size: "$saves" },
        },
      },
      {
        $sort: {
          likesCount: -1,
          sharesCount: -1,
          commentsCount: -1,
          savesCount: -1,
          createdAt: -1,
        },
      },
      { $skip: randomTrendingSkip },
      { $limit: limit },
      {
        $project: {
          _id: 1, video: 1, owner_id: 1, description: 1, tags: 1, location: 1,
          createdAt: 1, updatedAt: 1, likes: 1, saves: 1, shares: 1, comments: 1
        },
      },
    ]);

    console.log("[DEBUG] Trending Posts Fetched:", trendingPosts.length);

    // Update exclusion list
    excludedIds.push(...trendingPosts.map(post => post._id));

    // Count total random posts
    const randomCount = await Post.countDocuments({ _id: { $nin: excludedIds } });
    console.log("[DEBUG] Total Random Posts Available:", randomCount);

    const randomSkip = Math.max(0, Math.floor(Math.random() * Math.max(1, randomCount - (limit * 3))));
    console.log("[DEBUG] Random Skip for Random Posts:", randomSkip);

    // Fetch Random Posts using Aggregation
    let randomPosts = await Post.aggregate([
      { $match: { _id: { $nin: excludedIds } } },
      { $sample: { size: limit * 3 } }, // Ensures full randomization
      {
        $project: {
          _id: 1, video: 1, owner_id: 1, description: 1, tags: 1, location: 1,
          createdAt: 1, updatedAt: 1, likes: 1, saves: 1, shares: 1, comments: 1
        },
      },
    ]);

    console.log("[DEBUG] Random Posts Found Before Shuffling:", randomPosts.length);

    // Shuffle fetched random posts
    randomPosts = randomPosts.sort(() => Math.random() - 0.5).slice(0, limit);

    console.log("[DEBUG] Random Posts After Limiting:", randomPosts.length);

    // Merge Trending and Random Posts
    const posts = [...trendingPosts, ...randomPosts];

    console.log("[DEBUG] Total Posts After Merging:", posts.length);

    if (posts.length === 0) {
      return res.status(200).json({
        message: "No posts available for this session",
        posts: [],
      });
    }

    // Update exclusion list
    excludedIds.push(...randomPosts.map(post => post._id));

    // Populate post owner details and check user interactions (likes/saves)
    const populatedPosts = await Promise.all(
      posts.map(async (post) => {
        const owner = await User.findById(post.owner_id).select("name picture fcmToken followers");
    
        return {
          _id: post._id,
          video: post.video || "",
          description: post.description || "",
          owner: {
            id: post.owner_id,
            name: owner?.name || "",
            username: owner?.username || "",
            picture: owner?.picture || "",
            fcmToken: owner?.fcmToken || "",
            isFollowed: owner?.followers.includes(userId),
          },
          tags: post.tags || [],
          location: post.location || {},
          likes: post.likes?.length || 0,
          shares: post.shares?.length || 0,
          saves: post.saves?.length || 0,
          comments: post.comments?.length || 0,
          isLiked: post.likes.some((l) => l.equals(userId)), 
          isSaved: post.saves.some((s) => s.equals(userId)), 
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );
    
    console.log("[DEBUG] Populated Posts:", populatedPosts.length);

    res.status(200).json({
      message: "Trending and random posts fetched successfully",
      posts: populatedPosts,
      exclude: excludedIds.map(id => id.toString()), // Send updated exclusion list
    });
  } catch (error) {
    console.error("Error fetching trending and random posts:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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
    const { replyToCommentId } = req.query; // Check if it's a reply
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
      const match = parentComment.post_id.toString() === postId.toString();
      if(!match)
      {
        return res.status(400).json({ message: "Parent Comment does not belong to this post" });
      }
      if (parentComment) {
        parentComment.replies.push(savedComment._id); // Add the new comment to the replies
        await parentComment.save();
      }
    } else {
      // If it's not a reply, add the comment to the post's comments array
      post.comments.push(savedComment._id);
      await post.save();
    }

    return res
      .status(201)
      .json({ message: "Comment added successfully", comment: savedComment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getComments = async (req, res) => {
  const { postId, parentCommentId } = req.query;
  const { itemsPerPage = 10, pageNumber = 1 } = req.query;
  const userId = req.userId;  // assuming the userId is available in req.userId from authentication

  // Debugging input parameters
  console.log("Request received with the following parameters:");
  console.log(`postId: ${postId}, parentCommentId: ${parentCommentId}, itemsPerPage: ${itemsPerPage}, pageNumber: ${pageNumber}`);

  let comments;
  let totalComments;

  if (!parentCommentId) {
    // Case when parentCommentId is not provided: Get main comments (comments not inside any replies array)
    console.log("Fetching main comments (no parentCommentId provided)...");

    comments = await Comment.find({ post_id: postId })
      .skip((pageNumber - 1) * itemsPerPage) // Pagination based on the pageNumber and itemsPerPage per page
      .limit(itemsPerPage)
      .sort({ createdAt: -1 })
      .populate("owner_id", "name email _id picture")
      .lean();

    console.log(`Fetched ${comments.length} main comments.`);

    // Filter out main comments (comments whose IDs are not in any replies array)
    comments = comments.filter(comment => {
      return !comments.some(otherComment => {
        return otherComment.replies && otherComment.replies.some(reply => reply._id.toString() === comment._id.toString());
      });
    });

    console.log(`After filtering, remaining main comments: ${comments.length}`);

    totalComments = await Comment.countDocuments({ post_id: postId });
    console.log(`Total main comments count: ${totalComments}`);

    // Response structure for main comments
    return res.status(200).json({
      message: "Comments fetched successfully",
      totalComments: totalComments, // Ensure totalComments reflects the full count, not the filtered count
      comments: comments.map(comment => ({
        _id: comment._id,
        post_id: comment.post_id,
        owner_id: comment.owner_id,
        text: comment.text,
        likesCount: comment.likes.length || 0,
        repliesCount: comment.replies ? comment.replies.length : 0,
        isLiked: comment.likes.some(like => like.equals(userId)),  // Check if the user has liked this comment
        createdAt: comment.createdAt
      })),
      pagination: {
        totalItems: totalComments,
        totalPages: Math.ceil(totalComments / itemsPerPage),
        currentPage: pageNumber,
        itemsPerPage: itemsPerPage
      }
    });
  } else {
    // Case when parentCommentId is provided: Get comments that are replies to this parent comment
    console.log(`Fetching replies to parent comment with ID: ${parentCommentId}`);

    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      console.log("Parent comment not found.");
      return res.status(404).json({ message: "Parent comment not found", comments: [] });
    }

    console.log(`Found parent comment with ${parentComment.replies.length} replies.`);

    // Get all replies to the parent comment
    const repliesToParent = parentComment.replies.map(reply => reply._id);
    console.log(`Replies to parent comment: ${repliesToParent}`);

    totalComments = repliesToParent.length;

    comments = await Comment.find({ _id: { $in: repliesToParent } })
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 })
      .populate("owner_id", "name email _id picture")
      .lean();

    console.log(`Fetched ${comments.length} replies.`);

    // Response structure for sub-comments (replies)
    return res.status(200).json({
      message: "Comment replies fetched successfully",
      totalComments: totalComments,
      comments: comments.map(comment => ({
        _id: comment._id,
        post_id: comment.post_id,
        owner_id: comment.owner_id,
        text: comment.text,
        likesCount: comment.likes.length || 0,
        repliesCount: comment.replies ? comment.replies.length : 0,
        isLiked: comment.likes.some(like => like.equals(userId)),  // Check if the user has liked this comment
        parentCommentId: parentCommentId,
        createdAt: comment.createdAt
      })),
      pagination: {
        totalItems: totalComments,
        totalPages: Math.ceil(totalComments / itemsPerPage),
        currentPage: pageNumber,
        itemsPerPage: itemsPerPage
      }
    });
  }
};

const likeComment = async (req, res) => {
  try {
    const { commentId } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const likeIndex = comment.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Add user to likes if not already liked
      comment.likes.push(userId);
      await comment.save();
      return res.status(200).json({ message: "Comment liked successfully" });
    } else {
      // Remove user from likes if already liked (unlike)
      comment.likes.splice(likeIndex, 1);
      await comment.save();
      return res.status(200).json({ message: "Comment unliked successfully" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addPost,
  getUserPosts,
  likePost,
  savePost,
  sharePost,
  commentOnPost,
  getLikedPosts,
  getSavedPosts,
  getTrendingAndRandomPosts,
  getFollowingsPosts,
  getComments,
  likeComment,
  getOtherUserPosts
};

//Helpers
const populateOwner = async (post, userId) => {
  const ObjectId = require("mongoose").Types.ObjectId;
  const userIdObjectId = new ObjectId(userId);

  try {
    console.log(`[DEBUG] Fetching owner details for post ID: ${post._id}`);
    const owner = await User.findById(post.owner_id).select("name picture");
    if (!owner) {
      console.log(`[DEBUG] Owner not found for owner_id: ${post.owner_id}`);
    }

    // Ensure post properties exist
    post.likes = post.likes || [];
    post.saves = post.saves || [];
    post.comments = post.comments || [];
    post.shares = post.shares || [];
    console.log(
      `[DEBUG] Post likes count: ${post.likes.length}, saves count: ${post.saves.length}`
    );
    console.log("[DEBUG] Post" + JSON.stringify(post));
    // Check if the current user has liked or saved the post
    const isLiked = post.likes.some((like) => like.equals(userIdObjectId));
    const isSaved = post.saves.some((save) => save.equals(userIdObjectId));
    console.log(
      `[DEBUG] Post liked by user: ${isLiked}, saved by user: ${isSaved}`
    );

    return {
      _id: post._id,
      thumbnail: post.thumbnail || "",
      video: post.video || "", // Add video field if missing
      description: post.description,
      owner: {
        id: post.owner_id,
        name: owner?.name || "",
        picture: owner?.picture || "",
        fcmToken: owner?.fcmToken || "",
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
    console.error(
      `[ERROR] Error in populateOwner for post ID: ${post._id}. Error: ${error.message}`
    );
    throw error; // Re-throw the error to handle it upstream
  }
};

const populateOwnerWithVideo = async (post, userId) => {
  const owner = await User.findById(post.owner_id).select(
    "id name picture fcmToken"
  );
  return {
    _id: post._id,
    thumbnail: post.thumbnail || "",
    video: post.video || "", // Add video field if missing
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
};
