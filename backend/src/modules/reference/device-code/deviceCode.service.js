const BaseService = require('../../../shared/base/BaseService');
const DeviceCode = require('./deviceCode.model');
const { checkUniqueCode } = require('../../../shared/utils/codeValidator');
const ConflictError = require('../../../shared/exceptions/ConflictError');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');

class DeviceCodeService extends BaseService {
  constructor() {
    super(DeviceCode);
  }

  /**
   * Override create - Thêm validation unique code
   */
  async create(data) {
    const { code } = data;

    // Kiểm tra code trùng toàn hệ thống
    const { isDuplicate, collectionName } = await checkUniqueCode(code, null, 'DeviceCode');
    if (isDuplicate) {
      throw new ConflictError(`Mã '${code.trim()}' đã tồn tại trong hệ thống`);
    }

    return await this.model.create({
      code: code.trim(),
    });
  }

  /**
   * Override update - Thêm validation unique code
   */
  async update(id, data) {
    const { code } = data;

    // Kiểm tra code trùng toàn hệ thống
    const { isDuplicate, collectionName } = await checkUniqueCode(code, id, 'DeviceCode');
    if (isDuplicate) {
      throw new ConflictError(`Mã '${code.trim()}' đã tồn tại trong hệ thống`);
    }

    const doc = await this.model.findByIdAndUpdate(
      id,
      { code: code.trim() },
      { new: true, runValidators: true }
    );

    if (!doc) {
      throw new NotFoundError('Không tìm thấy mã thiết bị');
    }

    return doc;
  }

  /**
   * Override getPaginated - Thêm search fields
   */
  async getPaginated(query) {
    return super.getPaginated(query, {
      searchFields: ['code'],
    });
  }

  /**
   * Import từ Excel
   */
  async importData(data) {
    const operations = [];
    const invalidRows = [];

    const existed = await this.model.find({}, { code: 1 }).lean();
    const codeMap = new Map(
      existed.filter((p) => p.code).map((p) => [p.code.toLowerCase(), String(p._id)])
    );

    for (const item of data) {
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, code, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, '').trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: 'ID không hợp lệ' });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;

      // Xóa nếu chỉ có _id
      if (_id && !cleanCode) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      // Validate required fields
      if (!cleanCode) {
        invalidRows.push({ item, error: 'Mã thiết bị là bắt buộc' });
        continue;
      }

      // Kiểm tra code trùng toàn hệ thống
      let isCodeDuplicate = false;
      let duplicateSource = null;

      if (cleanCode) {
        const checkGlobal = await checkUniqueCode(cleanCode, _id, 'DeviceCode');
        if (checkGlobal.isDuplicate) {
          isCodeDuplicate = true;
          duplicateSource = checkGlobal.collectionName;
        }
      }

      if (_id) {
        // Update
        if (isCodeDuplicate) {
          invalidRows.push({ item, error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}` });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: { $set: { code: cleanCode, ...updateData } },
          },
        });
      } else {
        // Insert
        if (isCodeDuplicate) {
          invalidRows.push({ item, error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}` });
          continue;
        }

        operations.push({
          insertOne: { document: { code: cleanCode, ...updateData } },
        });
      }
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await this.model.bulkWrite(operations, { ordered: false });
    }

    return {
      totalProcessed: data.length,
      insertedCount: bulkResult?.insertedCount || 0,
      updatedCount: bulkResult?.modifiedCount || 0,
      deletedCount: bulkResult?.deletedCount || 0,
      invalidCount: invalidRows.length,
      invalidRows,
    };
  }

  /**
   * Export ra Excel
   */
  async exportData() {
    const data = await this.model.find().lean();
    return data.map((item) => ({
      code: item?.code || '',
      _id: String(item?._id || ''),
    }));
  }
}

module.exports = DeviceCodeService;
