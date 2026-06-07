class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(document) {
    return await this.model.create(document);
  }

  async update(id, data) {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async deleteMany(ids) {
    return await this.model.deleteMany({ _id: { $in: ids } });
  }

  async findById(id) {
    return await this.model.findById(id);
  }

  async findAll(filter = {}) {
    return await this.model.find(filter);
  }

  async findOne(filter = {}) {
    return await this.model.findOne(filter);
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }
}

module.exports = BaseRepository;