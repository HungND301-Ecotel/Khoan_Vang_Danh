const BaseService = require("./base.service");
const AppError = require("../utils/errors");

class DeviceCodeService extends BaseService {
  constructor(repository) {
    super(repository);
  }

  async create(document) {
    const exist = await this.repository.count({ code: document.code });
    if (exist > 0) {
      throw new AppError(`Mã thiết bị '${document.code}' đã tồn tại`, 409);
    }
    return await this.repository.create(document);
  }

  async update(id, data) {
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError("Không tìm thấy mã thiết bị để cập nhật", 404);
    }
    return updated;
  }

  async deleteMany(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError("Vui lòng chọn bản ghi cần xóa", 400);
    }
    const result = await this.repository.deleteMany(ids);
    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy bản ghi để xóa", 404);
    }
    return result;
  }

  async getList(queryParams) {
    const filter = {};
    if (queryParams.q) filter.code = new RegExp(queryParams.q, "i");
    return this.repository.paginate(filter, queryParams);
  }

  async importBulk(dataImport) {
    const devices = await this.repository.findAllCodes();
    const codeMap = new Map(
      devices.map((d) => [d.code.toLowerCase(), String(d._id)]),
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const codeKey = cleanCode?.toLowerCase();
      const existedId = codeKey ? codeMap.get(codeKey) : null;

      // CASE 1: Có _id, không có code → DELETE
      if (_id && !cleanCode) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      // CASE 2: Có _id + có code → UPDATE
      if (_id && cleanCode) {
        if (existedId && existedId !== _id) {
          invalidRows.push({
            item,
            error: `Mã thiết bị đã tồn tại: ${cleanCode}`,
          });
          continue;
        }
        operations.push({
          updateOne: {
            filter: { _id },
            update: { $set: { code: cleanCode, ...updateData } },
          },
        });
        continue;
      }

      // CASE 3: Không có _id, có code → INSERT
      if (!_id && cleanCode) {
        if (existedId) {
          invalidRows.push({
            item,
            error: `Mã thiết bị đã tồn tại: ${cleanCode}`,
          });
          continue;
        }
        operations.push({
          insertOne: { document: { code: cleanCode, ...updateData } },
        });
        continue;
      }

      // CASE INVALID
      invalidRows.push({ item, error: "Dòng không hợp lệ" });
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await this.repository.bulkWrite(operations);
    }

    return { bulkResult, invalidRows };
  }

  async findAll() {
    return await this.repository.findAll();
  }
}

module.exports = DeviceCodeService;
