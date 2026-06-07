const BaseRepository = require("./base.repository");
const { paginateQuery } = require("../utils/pagination");

class UnitRepository extends BaseRepository {
  constructor(model) {
    super(model);
  }

  /**
   * Tìm kiếm có phân trang + filter theo tên
   * @param {Object} filter - { name?: RegExp }
   * @returns {mongoose.Query}
   */
  findWithFilter(filter = {}) {
    return this.model.find(filter);
  }

  
  async paginate(filter, query) {
    const modelQuery = this.findWithFilter(filter);
    return paginateQuery(this.model, modelQuery, filter, query);
  }

  /**
   * Lấy danh sách tên + _id (dùng cho import/check trùng)
   * @returns {Promise<Array>}
   */
  async findAllNames() {
    return await this.model.find({}, { name: 1 }).lean();
  }

  async findByNames(names) {
    return this.model.find({ name: { $in: names } }).lean();
  }

  /**
   * Bulk write (insert / update / delete nhiều records từ import Excel)
   * @param {Array} operations
   * @returns {Promise}
   */
  async bulkWrite(operations) {
    return await this.model.bulkWrite(operations);
  }
}

module.exports = UnitRepository;