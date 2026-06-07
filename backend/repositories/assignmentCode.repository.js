const BaseRepository = require("./base.repository");
const { paginateQuery } = require("../utils/pagination");

class AssignmentCodeRepository extends BaseRepository {
  constructor(model) {
    super(model);
  }

  findWithFilter(filter = {}) {
    return this.model
      .find(filter)
      .populate("uom")
      .populate("deviceCode")
      .sort({ code: 1 });
  }

  async paginate(filter, query) {
    const modelQuery = this.findWithFilter(filter);
    return paginateQuery(this.model, modelQuery, filter, query);
  }

  async findAllCodeNames() {
    return await this.model.find({}, { code: 1, name: 1 }).lean();
  }

  async bulkWrite(operations) {
    return await this.model.bulkWrite(operations);
  }

  async findAll() {
    return await this.model.find().populate("uom").populate("deviceCode");
  }
}

module.exports = AssignmentCodeRepository;
