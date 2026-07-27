const BaseService = require('../../../shared/base/BaseService');
const Step = require('./step.model');
const ConflictError = require('../../../shared/exceptions/ConflictError');

class StepService extends BaseService {
  constructor() {
    super(Step);
  }

  async create(data) {
    const { name } = data;
    const exists = await this.model.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (exists) {
      throw new ConflictError(`Bước chống giữ '${name.trim()}' đã tồn tại`);
    }
    return await this.model.create({ name: name.trim() });
  }

  async update(id, data) {
    const { name } = data;
    const exists = await this.model.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (exists) {
      throw new ConflictError(`Bước chống giữ '${name.trim()}' đã tồn tại`);
    }
    const doc = await this.model.findByIdAndUpdate(id, { name: name.trim() }, { new: true });
    if (!doc) throw new NotFoundError('Không tìm thấy bước chống giữ');
    return doc;
  }

  async getPaginated(query) {
    return super.getPaginated(query, { searchFields: ['name'] });
  }

  async importData(data) {
    const operations = [];
    const invalidRows = [];
    const items = await this.model.find({}, { name: 1 }).lean();
    const nameMap = new Map(items.map(u => [u.name.toLowerCase(), String(u._id)]));

    for (const item of data) {
      let { _id, name, ...updateData } = item;
      if (_id) { _id = String(_id).replace(/"/g, '').trim(); if (_id.length !== 24) { invalidRows.push({ item, error: 'ID không hợp lệ' }); continue; } }
      const cleanName = name ? String(name).trim() : null;
      const nameKey = cleanName?.toLowerCase();
      const existedId = nameKey ? nameMap.get(nameKey) : null;

      if (_id && !cleanName) { operations.push({ deleteOne: { filter: { _id } } }); continue; }
      if (_id && cleanName) {
        if (existedId && existedId !== _id) { invalidRows.push({ item, error: `Bước chống giữ đã tồn tại: ${cleanName}` }); continue; }
        operations.push({ updateOne: { filter: { _id }, update: { $set: { name: cleanName, ...updateData } } } });
        continue;
      }
      if (!_id && cleanName) {
        if (existedId) { invalidRows.push({ item, error: `Bước chống giữ đã tồn tại: ${cleanName}` }); continue; }
        operations.push({ insertOne: { document: { name: cleanName, ...updateData } } });
        continue;
      }
      invalidRows.push({ item, error: 'Dòng không hợp lệ' });
    }

    let bulkResult = null;
    if (operations.length > 0) bulkResult = await this.model.bulkWrite(operations);
    return { totalProcessed: data.length, insertedCount: bulkResult?.insertedCount || 0, updatedCount: bulkResult?.modifiedCount || 0, deletedCount: bulkResult?.deletedCount || 0, invalidCount: invalidRows.length, invalidRows };
  }

  async exportData() {
    const data = await this.model.find().lean();
    return data.map(u => ({ name: u?.name || '', _id: String(u?._id || '') }));
  }
}

module.exports = StepService;
