const BaseService = require('../../shared/base/BaseService');
const AssignmentCode = require('./assignment-code.model');
const DeviceCode = require('../reference/device-code/deviceCode.model');
const Unit = require('../reference/unit/unit.model');
const { checkUniqueCode } = require('../../shared/utils/codeValidator');
const { updatePriceAssignmentCode } = require('../../shared/utils/priceCalculator');
const ConflictError = require('../../shared/exceptions/ConflictError');
const NotFoundError = require('../../shared/exceptions/NotFoundError');
const mongoose = require('mongoose');

class AssignmentCodeService extends BaseService {
  constructor() {
    super(AssignmentCode);
  }

  async create(data) {
    const { code } = data;
    const { isDuplicate, collectionName } = await checkUniqueCode(code, null, 'AssignmentCode');
    if (isDuplicate) throw new ConflictError(`Mã giao khoán '${code}' đã tồn tại trong hệ thống`);
    return await this.model.create(data);
  }

  async update(id, data) {
    const { code } = data;
    if (code) {
      const { isDuplicate, collectionName } = await checkUniqueCode(code, id, 'AssignmentCode');
      if (isDuplicate) throw new ConflictError(`Mã giao khoán '${code}' đã tồn tại trong hệ thống`);
    }
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true });
    if (!doc) throw new NotFoundError('Không tìm thấy mã giao khoán');
    return doc;
  }

  async getPaginated(query) {
    const result = await super.getPaginated(query, {
      searchFields: ['code', 'name'],
      populate: ['uom', 'deviceCode'],
      sort: { code: 1 },
    });

    // Cập nhật giá cho mỗi assignment code
    for (const assignment of result.data) {
      await updatePriceAssignmentCode(assignment._id);
    }

    return result;
  }

  async importData(data) {
    const operations = [];
    const invalidRows = [];

    const existed = await this.model.find({}, { code: 1, name: 1 }).lean();
    const codeMap = new Map(existed.map(d => [d.code.toLowerCase(), String(d._id)]));
    const nameMap = new Map(existed.map(d => [d.name.toLowerCase(), String(d._id)]));

    // Load FK maps
    const uniqueDeviceCodes = [...new Set(data.map(d => d.deviceCode && String(d.deviceCode).trim()).filter(Boolean))];
    const uniqueUnits = [...new Set(data.map(d => d.uom && String(d.uom).trim()).filter(Boolean))];

    const [deviceCodes, units] = await Promise.all([
      DeviceCode.find({ code: { $in: uniqueDeviceCodes } }).lean(),
      Unit.find({ name: { $in: uniqueUnits } }).lean(),
    ]);

    const deviceCodeMap = new Map(deviceCodes.map(d => [d.code, d._id]));
    const unitMap = new Map(units.map(u => [u.name, u._id]));

    for (const item of data) {
      let { _id, code, name, deviceCode, uom, ...updateData } = item;

      if (_id) { _id = String(_id).replace(/"/g, '').trim(); if (_id.length !== 24) { invalidRows.push({ item, error: 'ID không hợp lệ' }); continue; } }
      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      if (_id && !cleanCode && !cleanName) { operations.push({ deleteOne: { filter: { _id } } }); continue; }
      if (!cleanCode || !cleanName) { invalidRows.push({ item, error: 'Mã và tên là bắt buộc' }); continue; }

      // Map FK
      if (deviceCode) {
        const dcId = deviceCodeMap.get(String(deviceCode).trim());
        if (!dcId) { invalidRows.push({ item, error: `Mã thiết bị không tồn tại: ${deviceCode}` }); continue; }
        updateData.deviceCode = dcId;
      } else { updateData.deviceCode = null; }

      if (uom) {
        const uomId = unitMap.get(String(uom).trim());
        if (!uomId) { invalidRows.push({ item, error: `Đơn vị tính không tồn tại: ${uom}` }); continue; }
        updateData.uom = uomId;
      } else { updateData.uom = null; }

      // Check unique code
      const { isDuplicate, collectionName } = await checkUniqueCode(cleanCode, _id, 'AssignmentCode');
      if (isDuplicate) { invalidRows.push({ item, error: `Mã đã tồn tại trong danh mục ${collectionName}: ${cleanCode}` }); continue; }

      if (_id) {
        if (nameMap.get(cleanName.toLowerCase()) && nameMap.get(cleanName.toLowerCase()) !== _id) { invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` }); continue; }
        operations.push({ updateOne: { filter: { _id }, update: { $set: { code: cleanCode, name: cleanName, ...updateData } } } });
      } else {
        if (nameMap.get(cleanName.toLowerCase())) { invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` }); continue; }
        operations.push({ insertOne: { document: { code: cleanCode, name: cleanName, ...updateData } } });
      }

      const fakeId = new mongoose.Types.ObjectId().toString();
      codeMap.set(cleanCode.toLowerCase(), fakeId);
      nameMap.set(cleanName.toLowerCase(), fakeId);
    }

    let bulkResult = null;
    if (operations.length > 0) bulkResult = await this.model.bulkWrite(operations);
    return { totalProcessed: data.length, insertedCount: bulkResult?.insertedCount || 0, updatedCount: bulkResult?.modifiedCount || 0, deletedCount: bulkResult?.deletedCount || 0, invalidCount: invalidRows.length, invalidRows };
  }

  async exportData() {
    const data = await this.model.find().populate('uom').populate('deviceCode').lean();
    return data.map(i => ({
      deviceCode: i?.deviceCode?.code || '',
      code: i?.code || '',
      name: i?.name || '',
      uom: i?.uom?.name || '',
      price: i?.price || '',
      _id: String(i?._id || ''),
    }));
  }
}

module.exports = AssignmentCodeService;
