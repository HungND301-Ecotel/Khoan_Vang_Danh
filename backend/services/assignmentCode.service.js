const BaseService = require("./base.service");
const AppError = require("../utils/errors");
const {
  updatePriceAssignmentCode,
} = require("../utils/recalculateAssignmentCodePrice");
const mongoose = require("mongoose");

class AssignmentCodeService extends BaseService {
  constructor({
    assignmentCodeRepository,
    deviceCodeRepository,
    unitRepository,
  }) {
    super(assignmentCodeRepository);
    this.DeviceCode = deviceCodeRepository;
    this.Unit = unitRepository;
  }

  async create(document) {
    const exist = await this.repository.count({ code: document.code });
    if (exist > 0) {
      throw new AppError(`Mã giao khoán '${document.code}' đã tồn tại`, 409);
    }
    return await this.repository.create(document);
  }

  async update(id, data) {
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError("Không tìm thấy mã giao khoán để cập nhật", 404);
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
    if (queryParams.q) {
      filter.$or = [
        { code: new RegExp(queryParams.q, "i") },
        { name: new RegExp(queryParams.q, "i") },
      ];
    }

    const pagination = await this.repository.paginate(filter, queryParams);

    for (const assignment of pagination.data) {
      await updatePriceAssignmentCode(assignment._id);
    }

    return pagination;
  }

  async importBulk(dataImport) {
    // Load existing data để check trùng
    const existedAssignments = await this.repository.findAllCodeNames();
    const codeMap = new Map(
      existedAssignments.map((d) => [d.code.toLowerCase(), String(d._id)]),
    );
    const nameMap = new Map(
      existedAssignments.map((d) => [d.name.toLowerCase(), String(d._id)]),
    );

    // Resolve FK: deviceCode và uom
    const uniqueDeviceCodes = [
      ...new Set(
        dataImport
          .map((d) => d.deviceCode && String(d.deviceCode).trim())
          .filter(Boolean),
      ),
    ];
    const uniqueUnits = [
      ...new Set(
        dataImport.map((d) => d.uom && String(d.uom).trim()).filter(Boolean),
      ),
    ];

    const [deviceCodes, units] = await Promise.all([
      this.DeviceCode.findByCodes(uniqueDeviceCodes),
      this.Unit.findByNames(uniqueUnits),
    ]);

    const deviceCodeMap = new Map(deviceCodes.map((d) => [d.code, d._id]));
    const unitMap = new Map(units.map((u) => [u.name, u._id]));

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, name, deviceCode, uom, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      // CASE 1: Có _id, không có code và name → DELETE
      if (_id && !cleanCode && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      // Validate bắt buộc
      if (!cleanCode || !cleanName) {
        invalidRows.push({ item, error: "Mã và tên là bắt buộc" });
        continue;
      }

      const codeKey = cleanCode.toLowerCase();
      const nameKey = cleanName.toLowerCase();
      const existedCodeId = codeMap.get(codeKey);
      const existedNameId = nameMap.get(nameKey);

      // Resolve FK deviceCode
      if (deviceCode) {
        const dcId = deviceCodeMap.get(String(deviceCode).trim());
        if (!dcId) {
          invalidRows.push({
            item,
            error: `Mã thiết bị không tồn tại: ${deviceCode}`,
          });
          continue;
        }
        updateData.deviceCode = dcId;
      } else {
        updateData.deviceCode = null;
      }

      // Resolve FK uom
      if (uom) {
        const uomId = unitMap.get(String(uom).trim());
        if (!uomId) {
          invalidRows.push({
            item,
            error: `Đơn vị tính không tồn tại: ${uom}`,
          });
          continue;
        }
        updateData.uom = uomId;
      } else {
        updateData.uom = null;
      }

      // CASE 2: UPDATE
      if (_id) {
        if (existedCodeId && existedCodeId !== _id) {
          invalidRows.push({ item, error: `Mã đã tồn tại: ${cleanCode}` });
          continue;
        }
        if (existedNameId && existedNameId !== _id) {
          invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` });
          continue;
        }
        operations.push({
          updateOne: {
            filter: { _id },
            update: {
              $set: { code: cleanCode, name: cleanName, ...updateData },
            },
          },
        });
        codeMap.set(codeKey, _id);
        nameMap.set(nameKey, _id);
        continue;
      }

      // CASE 3: INSERT
      if (existedCodeId) {
        invalidRows.push({ item, error: `Mã đã tồn tại: ${cleanCode}` });
        continue;
      }
      if (existedNameId) {
        invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` });
        continue;
      }
      operations.push({
        insertOne: {
          document: { code: cleanCode, name: cleanName, ...updateData },
        },
      });
      const fakeId = new mongoose.Types.ObjectId().toString();
      codeMap.set(codeKey, fakeId);
      nameMap.set(nameKey, fakeId);
    }

    const bulkResult =
      operations.length > 0
        ? await this.repository.bulkWrite(operations)
        : null;

    return { bulkResult, invalidRows };
  }

  async findAll() {
    return this.repository.findAll()
  }

  async getDropdownLists() {
    const [deviceCodes, units] = await Promise.all([
      this.DeviceCode.findAllCodes(),
      this.Unit.findAllNames(),
    ]);
    return {
      deviceCodeList: [
        ...new Set(deviceCodes.map((d) => d.code).filter(Boolean)),
      ],
      unitList: [...new Set(units.map((u) => u.name).filter(Boolean))],
    };
  }
}

module.exports = AssignmentCodeService;
