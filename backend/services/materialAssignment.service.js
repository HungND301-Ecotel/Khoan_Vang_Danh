const BaseService = require("./base.service");
const AppError = require("../utils/errors");
const { monthToNumber } = require("../utils/helpers");
const {
  updatePriceAssignmentCode,
  recalculateAssignmentCodePrice,
} = require("../utils/recalculateAssignmentCodePrice");
const mongoose = require("mongoose");

const parsePriceRanges = (value) => {
  if (!value || typeof value !== "string") return [];
  const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((item) => {
      const [range, price] = item.split("=");
      if (!range || price === undefined) return null;

      const [startMonth, endMonth] = range.split("~");
      const numericPrice = Number(price);

      if (
        !MONTH_REGEX.test(startMonth) ||
        !MONTH_REGEX.test(endMonth) ||
        isNaN(numericPrice)
      ) {
        return null;
      }

      return {
        startMonth,
        endMonth,
        price: numericPrice,
        _start: parseInt(startMonth.replace("-", "")),
        _end: parseInt(endMonth.replace("-", "")),
      };
    })
    .filter(Boolean);
};

class MaterialAssignmentService extends BaseService {
  constructor({
    materialAssignmentRepository,
    assignmentCodeRepository,
    unitRepository,
  }) {
    super(materialAssignmentRepository);
    this.AssignmentCode = assignmentCodeRepository;
    this.Unit = unitRepository;
  }

  async create(document) {
    const exist = await this.repository.count({
      code: document.code,
      assignmentCode: document.assignmentCode,
    });
    if (exist > 0) {
      throw new AppError(
        `Mã giao khoán và mã vật tư này đã là của vật tư, tài sản '${document.name}'`,
        409,
      );
    }

    const newMaterial = await this.repository.create(document);
    await updatePriceAssignmentCode(document.assignmentCode);
    return newMaterial;
  }

  async update(id, data) {
    const duplicate = await this.repository.findOne({
      code: data.code,
      assignmentCode: data.assignmentCode,
      _id: { $ne: id },
    });

    if (duplicate) {
      throw new AppError(
        `Mã giao khoán và mã vật tư này đã tồn tại ở vật tư/tài sản '${duplicate.name}'`,
        409,
      );
    }

    const updated = await this.repository.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    
    if (!updated) {
      throw new AppError("Sửa thất bại", 404);
    }
    await updatePriceAssignmentCode(updated.assignmentCode);
    return updated;
  }

  async deleteOne(id) {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError("Xóa thất bại", 404);
    }
    if (deleted.assignmentCode) {
      await updatePriceAssignmentCode(deleted.assignmentCode);
    }
    return deleted;
  }

  async getGroupList(queryParams) {
    let query = {};
    if (queryParams.q) {
      query.$or = [
        { code: new RegExp(queryParams.q, "i") },
        { name: new RegExp(queryParams.q, "i") },
      ];
    }

    const pagination = await this.repository.paginateGroup(
      query,
      queryParams,
      this.AssignmentCode.model,
    );

    const result = [];
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const checkMonthStr = queryParams.month || currentYearMonth;
    const checkMonthNum = monthToNumber(checkMonthStr);

    for (const assignment of pagination.data) {
      const materials = await this.repository.findByAssignmentCode(assignment._id);

      const materialsWithPrice = materials.map((item) => {
        let currentPrice = null;
        if (Array.isArray(item.priceHistory)) {
          const matched = item.priceHistory.find((priceItem) => {
            const start = monthToNumber(priceItem.startMonth);
            const end = monthToNumber(priceItem.endMonth);
            return start <= checkMonthNum && checkMonthNum <= end;
          });
          if (matched) currentPrice = matched.price;
        }

        return {
          ...item.toObject(),
          currentPrice,
        };
      });

      result.push({
        _id: assignment._id,
        name: assignment.name,
        code: assignment.code,
        uom: assignment.uom?.name,
        price: await recalculateAssignmentCodePrice(
          assignment._id,
          null,
          null,
          checkMonthStr,
        ),
        device: assignment.deviceCode?.code,
        materials: materialsWithPrice,
      });
    }

    pagination.data = result;
    return pagination;
  }

  async getList(queryParams) {
    let query = {};
    if (queryParams.q) {
      const assignments = await this.AssignmentCode.model.find({ code: queryParams.q });
      const assignmentId = assignments.map((i) => i._id);
      query.$or = [
        { code: new RegExp(queryParams.q, "i") },
        { name: new RegExp(queryParams.q, "i") },
        { assignmentCode: { $in: assignmentId } },
      ];
    }

    if (queryParams.type === "in") {
      query.assignmentCode = { $ne: null };
    } else if (queryParams.type === "out") {
      query.assignmentCode = null;
    }

    const pagination = await this.repository.paginateMaterials(query, queryParams);

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const currentMonthNum = monthToNumber(currentYearMonth);

    pagination.data = pagination.data.map((item) => {
      let currentPrice = null;
      if (Array.isArray(item.priceHistory)) {
        const matched = item.priceHistory.find((priceItem) => {
          const start = monthToNumber(priceItem.startMonth);
          const end = monthToNumber(priceItem.endMonth);
          return start <= currentMonthNum && currentMonthNum <= end;
        });
        if (matched) currentPrice = matched.price;
      }
      return {
        ...item,
        currentPrice,
      };
    });

    return pagination;
  }

  async getCounts() {
    const counts = await this.repository.getCounts();
    return {
      countWithAssignment: counts[0].withAssignment[0]?.count || 0,
      countWithoutAssignment: counts[0].withoutAssignment[0]?.count || 0,
      totalCount: counts[0].totalCount[0]?.count || 0,
    };
  }

  async importBulk(dataImport) {
    const [existedMaterials, assignmentCodes, units] = await Promise.all([
      this.repository.findAllCompositeKeys(),
      this.AssignmentCode.model.find({}).lean(),
      this.Unit.findAllNames(),
    ]);

    const compositeMap = new Map(
      existedMaterials.map((m) => {
        const s_acId = m.assignmentCode ? String(m.assignmentCode) : "null";
        const key = `${String(m.code).toLowerCase().trim()}|${s_acId}`;
        return [key, { id: String(m._id), name: m.name }];
      }),
    );

    const assignmentCodeMap = new Map(assignmentCodes.map((a) => [a.code, a._id]));
    const unitMap = new Map(units.map((u) => [u.name, u._id]));

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      const rowIndex = dataImport.indexOf(item) + 2;

      let {
        _id,
        code,
        name,
        assignmentCode,
        uom,
        quantity,
        price,
        ...updateData
      } = item;

      let cleanId = _id ? String(_id).replace(/[^a-fA-F0-9]/g, "") : null;
      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      if (cleanId && !cleanCode && !cleanName) {
        if (cleanId.length === 24) {
          operations.push({ deleteOne: { filter: { _id: cleanId } } });
          continue;
        } else {
          invalidRows.push({ row: rowIndex, error: "ID để xóa không hợp lệ" });
          continue;
        }
      }

      if (!cleanCode || !cleanName) {
        invalidRows.push({
          row: rowIndex,
          error: "Mã và Tên vật tư là bắt buộc",
        });
        continue;
      }

      let acId = null;
      if (assignmentCode) {
        const foundAcId = assignmentCodeMap.get(String(assignmentCode).trim());
        if (foundAcId) acId = String(foundAcId);
        else {
          invalidRows.push({
            row: rowIndex,
            error: `Không tìm thấy Mã giao khoán '${assignmentCode}'`,
          });
          continue;
        }
      }

      const uomName = uom ? String(uom).trim() : null;
      updateData.uom = uomName ? unitMap.get(uomName) : null;

      const cleanPriceStr = price ? String(price).trim() : "";
      let history = parsePriceRanges(cleanPriceStr);

      if (history.length > 0) {
        let hasTimeError = false;
        const normalized = history.map((h) => ({
          ...h,
          _start: parseInt(h.startMonth.replace("-", "")),
          _end: parseInt(h.endMonth.replace("-", "")),
        }));

        for (const h of normalized) {
          if (h._start > h._end) {
            invalidRows.push({
              row: rowIndex,
              error: `Khoảng thời gian không hợp lệ: ${h.startMonth} > ${h.endMonth}`,
            });
            hasTimeError = true;
            break;
          }
        }
        if (hasTimeError) continue;

        normalized.sort((a, b) => a._start - b._start);

        for (let i = 0; i < normalized.length - 1; i++) {
          if (normalized[i + 1]._start <= normalized[i]._end) {
            invalidRows.push({
              row: rowIndex,
              error: `Thời gian bị chồng chéo: ${normalized[i].startMonth}->${normalized[i].endMonth} và ${normalized[i + 1].startMonth}->${normalized[i + 1].endMonth}`,
            });
            hasTimeError = true;
            break;
          }
        }
        if (hasTimeError) continue;

        updateData.priceHistory = normalized.map(
          ({ _start, _end, ...rest }) => rest,
        );
      } else {
        updateData.priceHistory = [];
      }

      if (acId && quantity !== undefined && quantity !== null) {
        const q = Number(quantity);
        updateData.quantity = isNaN(q) ? 0 : q;
      } else {
        delete updateData.quantity;
      }

      const s_acId = acId ? String(acId) : "null";
      const compositeKey = `${cleanCode.toLowerCase()}|${s_acId}`;
      const existedRecord = compositeMap.get(compositeKey);

      let filter = null;
      if (cleanId && cleanId.length === 24) {
        filter = { _id: cleanId };
      } else if (existedRecord) {
        filter = { _id: existedRecord.id };
      }

      const finalDoc = {
        code: cleanCode,
        name: cleanName,
        assignmentCode: acId,
        uom: updateData.uom,
        priceHistory: updateData.priceHistory,
        ...updateData,
      };

      if (filter) {
        operations.push({ updateOne: { filter, update: { $set: finalDoc } } });
      } else {
        operations.push({ insertOne: { document: finalDoc } });
      }

      compositeMap.set(compositeKey, {
        id: filter?._id || "temp",
        name: cleanName,
      });
    }

    const bulkResult =
      operations.length > 0
        ? await this.repository.bulkWrite(operations)
        : null;

    return { bulkResult, invalidRows };
  }

  async findAllForExport(type) {
    let query = {};
    if (type === "in") {
      query.assignmentCode = { $ne: null };
    } else if (type === "out") {
      query.assignmentCode = null;
    }
    return await this.repository.findAllForExport(query);
  }

  async getDropdownLists() {
    const [assignmentCodes, units] = await Promise.all([
      this.AssignmentCode.model.find().lean(),
      this.Unit.findAllNames(),
    ]);
    return {
      assignmentCodeList: [
        ...new Set(assignmentCodes.map((d) => d.code).filter(Boolean)),
      ],
      unitList: [...new Set(units.map((u) => u.name).filter(Boolean))],
    };
  }
}

module.exports = MaterialAssignmentService;
