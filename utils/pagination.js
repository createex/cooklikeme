module.exports.validatePagination = (query) => {
    const items = Math.max(1, parseInt(query.itemsPerPage || 10, 10));
    const page = Math.max(1, parseInt(query.pageNumber || 1, 10));
    if (isNaN(items) || isNaN(page)) return { error: "Invalid pagination values." };
    return { items, page };
  };
  
  module.exports.noPostsFoundResponse = (res, message, items, page) => {
    return res.status(200).json({
      message,
      posts: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        itemsPerPage: items,
      },
    });
  };
  
  module.exports.paginatePosts = async (query, items, page, select) => {
    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / items);
    const posts = await Post.find(query)
      .select(select)
      .skip((page - 1) * items)
      .limit(items);
    return { totalPosts, totalPages, posts };
  };
  