const Story = require("../models/story");

const deleteExpiredStories = async () => {
  try {
    const expiredStories = await Story.find({ expiresAt: { $lt: new Date() } });

    console.log("Expired Stories Found:", expiredStories.length);

    if (expiredStories.length > 0) {
      const result = await Story.deleteMany({ expiresAt: { $lt: new Date() } });
      console.log(`✅ Deleted ${result.deletedCount} expired stories`);
    } else {
      console.log("✅ No expired stories found");
    }
  } catch (error) {
    console.error("❌ Error deleting expired stories:", error);
  }
};

// Run cleanup every 10 minutes
setInterval(deleteExpiredStories, 1 * 60 * 1000);

module.exports = deleteExpiredStories;
