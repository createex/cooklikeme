const Story = require("../models/story");
const User = require("../models/user");

// Add a new story
const addStory = async (req, res) => {
  try {
    const { text, media, mediaType } = req.body;
    const userId = req.userId; // Assume the userId comes from middleware

    // Validate inputs directly in the function
    if (!media || typeof media !== "string" || media.trim() === "") {
      return res
        .status(400)
        .json({
          message: "Media URL is required and must be a non-empty string",
        });
    }

    if (!mediaType || !["image", "video"].includes(mediaType)) {
      return res
        .status(400)
        .json({ message: 'Media Type must be either "image" or "video"' });
    }

    // Create a new story
    const newStory = new Story({
      owner_id: userId,
      text: text || "", // Make text optional
      media,
      mediaType,
    });

    // Save the story to the database
    await newStory.save();

    return res.status(201).json({
      message: "Story added successfully",
      story: {
        _id: newStory._id,
        owner_id: userId,
        text: newStory.text,
        mediaType: newStory.mediaType,
        media: newStory.media,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all stories (including "My Stories" and "Other Stories")
const getAllStories = async (req, res) => {
  try {
    const userId = req.userId; // Logged-in user's ID

    // Fetch the current user along with their followings
    const currentUser = await User.findById(userId)
      .select("followings")
      .populate("followings", "_id");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingsIds = currentUser.followings.map((user) =>
      user._id.toString()
    );

    // Fetch stories where owner_id is either the logged-in user or in the followings list
    const stories = await Story.find({
      isActive: true,
      $or: [{ owner_id: userId }, { owner_id: { $in: followingsIds } }],
    })
      .sort({ createdAt: -1 })
      .populate("owner_id", "name picture");

    // Initialize objects to store grouped stories
    const myOwner = {
      id: "",
      name: "",
      picture: "",
      stories: [],
    };

    const otherStories = [];

    // Loop through all the stories to group them
    stories.forEach((story) => {
      const ownerId = story.owner_id._id.toString();
      const storyData = {
        _id: story._id,
        text: story.text, // Include the text field
        createdAt: story.createdAt,
        media: story.media,
        mediaType: story.mediaType,
      };

      // If the story belongs to the logged-in user, add it to "myStories"
      if (ownerId === userId.toString()) {
        myOwner.id = story.owner_id._id;
        myOwner.name = story.owner_id.name;
        myOwner.picture = story.owner_id.picture;
        myOwner.stories.push(storyData);
      } else {
        // Otherwise, add it to "otherStories"
        const existingOwnerIndex = otherStories.findIndex(
          (owner) => owner.id.toString() === ownerId
        );

        if (existingOwnerIndex !== -1) {
          otherStories[existingOwnerIndex].stories.push(storyData);
        } else {
          otherStories.push({
            id: story.owner_id._id,
            name: story.owner_id.name,
            picture: story.owner_id.picture,
            stories: [storyData],
          });
        }
      }
    });

    return res.status(200).json({
      message: "Stories fetched successfully",
      myStories: myOwner.stories.length
        ? {
            id: myOwner.id,
            name: myOwner.name,
            picture: myOwner.picture,
            stories: myOwner.stories,
          }
        : null,
      otherStories: otherStories.length ? otherStories : [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};


// Get all stories of a specific owner
const getStoriesByOwner = async (req, res) => {
  try {
    const { ownerId } = req.query;

    // Get the stories of the specific owner, sorted by createdAt (most recent first)
    const stories = await Story.find({ owner_id: ownerId, isActive: true })
      .sort({ createdAt: -1 })
      .populate("owner_id", "name picture");

    // If no stories found, return an empty array
    if (stories.length === 0) {
      return res
        .status(200)
        .json({ message: "No stories found for this user", stories: [] });
    }

    // Mapping the stories to return them in the desired structure
    return res.status(200).json({
      message: "Stories fetched successfully",
      owner: {
        id: stories[0].owner_id._id,
        name: stories[0].owner_id.name,
        picture: stories[0].owner_id.picture,
      },
      stories: stories.map((story) => ({
        _id: story._id,
        text: story.text, // Include the text field
        media: story.media,
        mediaType: story.mediaType,
        createdAt: story.createdAt,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};


module.exports = { addStory, getAllStories, getStoriesByOwner };
