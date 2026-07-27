const NotFoundError = require('../exceptions/NotFoundError');

/**
 * Base Service - Cung cấp các CRUD operations cơ bản
 * Các module con kế thừa và override khi cần custom logic
 */
class BaseService {
  constructor(model) {
    this.model = model;
  }

  /**
   * Tạo mới document
   */
  async create(data) {
    return await this.model.create(data);
  }

  /**
   * Cập nhật document theo ID
   */
  async update(id, data) {
    const doc = await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      throw new NotFoundError('Không tìm thấy bản ghi');
    }
    return doc;
  }

  /**
   * Xóa document theo ID
   */
  async delete(id) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) {
      throw new NotFoundError('Không tìm thấy bản ghi');
    }
    return doc;
  }

  /**
   * Xóa nhiều documents theo danh sách ID
   */
  async deleteMany(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new NotFoundError('Vui lòng chọn bản ghi cần xóa');
    }
    const result = await this.model.deleteMany({ _id: { $in: ids } });
    return result;
  }

  /**
   * Lấy document theo ID
   */
  async getById(id) {
    const doc = await this.model.findById(id);
    if (!doc) {
      throw new NotFoundError('Không tìm thấy bản ghi');
    }
    return doc;
  }

  /**
   * Lấy danh sách có phân trang
   * @param {Object} query - Query params { page, limit, q, ...filter }
   * @param {Object} options - Tùy chọn { sort, populate, searchFields }
   */
  async getPaginated(query, options = {}) {
    const { page = 1, limit = 10, q, ...filter } = query;
    const skip = (page - 1) * limit;
    const { sort = { createdAt: -1 }, populate = [], searchFields = [] } = options;

    // Build search query
    let searchQuery = { ...filter };
    if (q && searchFields.length > 0) {
      searchQuery.$or = searchFields.map((field) => ({
        [field]: new RegExp(q, 'i'),
      }));
    }

    const [data, total] = await Promise.all([
      this.model
        .find(searchQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(populate),
      this.model.countDocuments(searchQuery),
    ]);

    return {
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      results: data.length,
    };
  }

  /**
   * Tìm document theo filter
   */
  async findOne(filter) {
    return await this.model.findOne(filter);
  }

  /**
   * Tìm nhiều documents theo filter
   */
  async find(filter = {}, options = {}) {
    const { sort, populate = [], select = '' } = options;
    let query = this.model.find(filter);
    if (sort) query = query.sort(sort);
    if (populate.length > 0) query = query.populate(populate);
    if (select) query = query.select(select);
    return await query;
  }

  /**
   * Đếm documents theo filter
   */
  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }

  /**
   * Bulk write operations
   */
  async bulkWrite(operations, options = {}) {
    return await this.model.bulkWrite(operations, options);
  }
}

module.exports = BaseService;
