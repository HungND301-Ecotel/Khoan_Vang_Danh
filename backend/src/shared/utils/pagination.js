/**
 * Pagination utility - Tái sử dụng cho tất cả modules
 */

/**
 * Tạo query pagination
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Filter query
 * @param {Object} options - { page, limit, sort, populate }
 * @returns {Object} { data, total, page, totalPages, results }
 */
const paginate = async (model, filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = [],
  } = options;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),
    model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    results: data.length,
  };
};

/**
 * Parse pagination params từ query string
 */
const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit };
};

module.exports = {
  paginate,
  parsePaginationParams,
};
