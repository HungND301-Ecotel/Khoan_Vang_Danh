const BaseService = require("./base.service");
const AppError = require("../utils/errors");


class UnitService extends BaseService {
  constructor(repository) {
    super(repository);
  }

  /**
   * Tạo mới đơn vị tính — kiểm tra trùng tên trước
   */
  async create(document) {
    const exist = await this.repository.count({ name: document.name });
    if (exist > 0) {
      throw new AppError(`Đơn vị tính '${document.name}' đã tồn tại`, 409);
    }
    return await this.repository.create(document);
  }

  /**
   * Cập nhật đơn vị tính theo id
   */
  async update(id, data) {
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError("Không tìm thấy đơn vị tính để cập nhật", 404);
    }
    return updated;
  }

  /**
   * Xóa nhiều bản ghi theo mảng ids
   */
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

  /**
   * Lấy danh sách có tìm kiếm theo tên (trả về query để paginateQuery dùng)
   */
  async getList(queryParams) {
    const filter = {};
    if (queryParams.q) filter.name = new RegExp(queryParams.q, "i");
    return this.repository.paginate(filter, queryParams);
  }

  /**
   * Import từ Excel — xử lý insert / update / delete hàng loạt
   */
  async importBulk(dataImport) {
    // Lấy danh sách name hiện có để check trùng
    const units = await this.repository.findAllNames();
    const nameMap = new Map(
      units.map((u) => [u.name.toLowerCase(), String(u._id)]),
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, name, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanName = name ? String(name).trim() : null;
      const nameKey = cleanName?.toLowerCase();
      const existedId = nameKey ? nameMap.get(nameKey) : null;

      // CASE 1: Có _id, không có name → DELETE
      if (_id && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      // CASE 2: Có _id + có name → UPDATE
      if (_id && cleanName) {
        if (existedId && existedId !== _id) {
          invalidRows.push({
            item,
            error: `Đơn vị tính đã tồn tại: ${cleanName}`,
          });
          continue;
        }
        operations.push({
          updateOne: {
            filter: { _id },
            update: { $set: { name: cleanName, ...updateData } },
          },
        });
        continue;
      }

      // CASE 3: Không có _id, có name → INSERT
      if (!_id && cleanName) {
        if (existedId) {
          invalidRows.push({
            item,
            error: `Đơn vị tính đã tồn tại: ${cleanName}`,
          });
          continue;
        }
        operations.push({
          insertOne: { document: { name: cleanName, ...updateData } },
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

  /**
   * Lấy toàn bộ danh sách (dùng cho export Excel)
   */
  async findAll() {
    return await this.repository.findAll();
  }
}

module.exports = UnitService;
