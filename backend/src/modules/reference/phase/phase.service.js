const BaseService = require('../../../shared/base/BaseService');
const Phase = require('./phase.model');
const { checkUniqueCode } = require('../../../shared/utils/codeValidator');
const ConflictError = require('../../../shared/exceptions/ConflictError');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');

class PhaseService extends BaseService {
  constructor() {
    super(Phase);
  }

  /**
   * Override create - Thêm validation unique code/name
   */
  async create(data) {
    const { code, name, phaseGroup } = data;

    // Kiểm tra code trùng toàn hệ thống
    const { isDuplicate, collectionName } = await checkUniqueCode(code, null, 'Phase');
    if (isDuplicate) {
      throw new ConflictError(`Mã '${code.trim()}' đã tồn tại trong hệ thống`);
    }

    // Kiểm tra name trùng
    const existsName = await this.model.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existsName) {
      throw new ConflictError(`Công đoạn '${name.trim()}' đã tồn tại`);
    }

    return await this.model.create({
      code: code.trim(),
      name: name.trim(),
      phaseGroup,
    });
  }

  /**
   * Override update - Thêm validation unique code/name
   */
  async update(id, data) {
    const { code, name, phaseGroup } = data;

    // Kiểm tra code trùng toàn hệ thống
    const { isDuplicate, collectionName } = await checkUniqueCode(code, id, 'Phase');
    if (isDuplicate) {
      throw new ConflictError(`Mã '${code.trim()}' đã tồn tại trong hệ thống`);
    }

    // Kiểm tra name trùng (trừ chính nó)
    const existsName = await this.model.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existsName) {
      throw new ConflictError(`Công đoạn '${name.trim()}' đã tồn tại`);
    }

    const doc = await this.model.findByIdAndUpdate(
      id,
      { code: code.trim(), name: name.trim(), phaseGroup },
      { new: true, runValidators: true }
    ).populate('phaseGroup');

    if (!doc) {
      throw new NotFoundError('Không tìm thấy công đoạn');
    }

    return doc;
  }

  /**
   * Override getPaginated - Thêm search fields và populate
   */
  async getPaginated(query) {
    return super.getPaginated(query, {
      searchFields: ['code', 'name'],
      populate: ['phaseGroup'],
    });
  }

  /**
   * Override getById - Populate phaseGroup
   */
  async getById(id) {
    const doc = await this.model.findById(id).populate('phaseGroup');
    if (!doc) {
      throw new NotFoundError('Không tìm thấy công đoạn');
    }
    return doc;
  }

  /**
   * Import từ Excel
   */
  async importData(data) {
    const operations = [];
    const invalidRows = [];

    const existed = await this.model.find({}, { code: 1, name: 1 }).lean();
    const codeMap = new Map(
      existed.filter((p) => p.code).map((p) => [p.code.toLowerCase(), String(p._id)])
    );
    const nameMap = new Map(
      existed.filter((p) => p.name).map((p) => [p.name.toLowerCase(), String(p._id)])
    );

    for (const item of data) {
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, code, name, phaseGroup, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, '').trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: 'ID không hợp lệ' });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      // Xóa nếu chỉ có _id
      if (_id && !cleanCode && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      // Validate required fields
      if (!cleanCode || !cleanName) {
        invalidRows.push({ item, error: 'Mã và Tên công đoạn là bắt buộc' });
        continue;
      }

      // Kiểm tra code trùng toàn hệ thống
      let isCodeDuplicate = false;
      let duplicateSource = null;

      if (cleanCode) {
        const checkGlobal = await checkUniqueCode(cleanCode, _id, 'Phase');
        if (checkGlobal.isDuplicate) {
          isCodeDuplicate = true;
          duplicateSource = checkGlobal.collectionName;
        }
      }

      const docData = { code: cleanCode, name: cleanName };
      if (phaseGroup) docData.phaseGroup = phaseGroup;

      if (_id) {
        // Update
        if (isCodeDuplicate) {
          invalidRows.push({ item, error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}` });
          continue;
        }

        const existedNameId = nameMap.get(cleanName.toLowerCase());
        if (existedNameId && existedNameId !== _id) {
          invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: { $set: { ...docData, ...updateData } },
          },
        });
      } else {
        // Insert
        if (isCodeDuplicate) {
          invalidRows.push({ item, error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}` });
          continue;
        }

        const existedNameId = nameMap.get(cleanName.toLowerCase());
        if (existedNameId) {
          invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` });
          continue;
        }

        operations.push({
          insertOne: { document: { ...docData, ...updateData } },
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
    const data = await this.model.find().populate('phaseGroup').lean();
    return data.map((item) => ({
      code: item?.code || '',
      name: item?.name || '',
      phaseGroup: item?.phaseGroup?._id || '',
      _id: String(item?._id || ''),
    }));
  }
}

module.exports = PhaseService;
