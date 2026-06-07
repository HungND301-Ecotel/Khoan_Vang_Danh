const BaseRepository = require("./base.repository");
const { paginateQuery } = require("../utils/pagination");

class DeviceCodeRepository extends BaseRepository {
  constructor(model) {
    super(model);
  }

  findWithFilter(filter = {}) {
    return this.model.find(filter);
  }

  async paginate(filter, query) {
    const modelQuery = this.findWithFilter(filter);
    return paginateQuery(this.model, modelQuery, filter, query);
  }

  async findAllCodes() {
    return await this.model.find({}, { code: 1 }).lean();
  }

  async findByCodes(codes) {
    return this.model.find({ code: { $in: codes } }).lean();
  }

  async bulkWrite(operations) {
    return await this.model.bulkWrite(operations);
  }
}

module.exports = DeviceCodeRepository;
