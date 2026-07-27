const BaseService = require('../../../shared/base/BaseService');
const CrossSection = require('./cross-section.model');
const Unit = require('../unit/unit.model');
const ConflictError = require('../../../shared/exceptions/ConflictError');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');
const mongoose = require('mongoose');

class CrossSectionService extends BaseService {
  constructor() {
    super(CrossSection);
  }

  async create(data) {
    const { name, uom } = data;
    const exists = await this.model.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (exists) throw new ConflictError(`Tiết diện '${name.trim()}' đã tồn tại`);
    return await this.model.create({ name: name.trim(), uom: uom || null });
  }

  async update(id, data) {
    const { name, uom } = data;
    const exists = await this.model.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (exists) throw new ConflictError(`Tiết diện '${name.trim()}' đã tồn tại`);
    const doc = await this.model.findByIdAndUpdate(
      id,
      { name: name.trim(), uom: uom || null },
      { new: true }
    );
    if (!doc) throw new NotFoundError('Không tìm thấy tiết diện');
    return doc;
  }

  async getPaginated(query) {
    return super.getPaginated(query, {
      searchFields: ['name'],
      populate: [{ path: 'uom', select: 'name' }],
    });
  }

  async importData(data) {
    const operations = [];
    const invalidRows = [];

    // Load units for FK mapping
    const units = await Unit.find({}, { name: 1 }).lean();
    const unitMap = new Map(units.map(g => [g.name.trim(), g._id]));

    // Load existed
    const existed = await this.model.find({}, { name: 1 }).lean();
    const nameMap = new Map(
      existed.filter(p => p.name).map(p => [p.name.toLowerCase(), String(p._id)])
    );

    for (const item of data) {
      if (item.ignored !== undefined) delete item.ignored;
      let { _id, name, uom, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, '').trim();
        if (_id.length !== 24) { invalidRows.push({ item, error: 'ID không hợp lệ' }); continue; }
      }

      const cleanName = name ? String(name).trim() : null;

      // Map unit FK
      if (uom) {
        const gId = unitMap.get(String(uom).trim());
        if (!gId) { invalidRows.push({ item, error: `Đơn vị tính không tồn tại: ${uom}` }); continue; }
        updateData.uom = gId;
      } else {
        updateData.uom = null;
      }

      // DELETE
      if (_id && !cleanName) { operations.push({ deleteOne: { filter: { _id } } }); continue; }
      if (!cleanName) { invalidRows.push({ item, error: 'Tên tiết diện là bắt buộc' }); continue; }

      const nameKey = cleanName.toLowerCase();
      const existedNameId = nameMap.get(nameKey);

      // UPDATE
      if (_id) {
        if (existedNameId && existedNameId !== _id) { invalidRows.push({ item, error: `Tiết diện đã tồn tại: ${cleanName}` }); continue; }
        operations.push({ updateOne: { filter: { _id }, update: { $set: { name: cleanName, ...updateData } } } });
        nameMap.set(nameKey, _id);
        continue;
      }

      // INSERT
      if (existedNameId) { invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` }); continue; }
      operations.push({ insertOne: { document: { name: cleanName, ...updateData } } });
      nameMap.set(nameKey, new mongoose.Types.ObjectId().toString());
    }

    let bulkResult = null;
    if (operations.length > 0) bulkResult = await this.model.bulkWrite(operations);
    return { totalProcessed: data.length, insertedCount: bulkResult?.insertedCount || 0, updatedCount: bulkResult?.modifiedCount || 0, deletedCount: bulkResult?.deletedCount || 0, invalidCount: invalidRows.length, invalidRows };
  }

  async exportData() {
    const data = await this.model.find().populate('uom', 'name').lean();
    return data.map(i => ({
      name: i?.name || '',
      uom: i?.uom?.name || '',
      _id: String(i?._id || ''),
    }));
  }
}

module.exports = CrossSectionService;
