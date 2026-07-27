const BaseService = require('../../shared/base/BaseService');
const MaterialAssignment = require('./material-assignment.model');
const AssignmentCode = require('../assignment-code/assignment-code.model');
const Unit = require('../reference/unit/unit.model');
const { checkUniqueCode } = require('../../shared/utils/codeValidator');
const {
  updatePriceAssignmentCode,
  resolveMaterialPrice,
  monthToNumber,
} = require('../../shared/utils/priceCalculator');
const ConflictError = require('../../shared/exceptions/ConflictError');
const NotFoundError = require('../../shared/exceptions/NotFoundError');
const ValidationError = require('../../shared/exceptions/ValidationError');
const mongoose = require('mongoose');

/**
 * Parse priceHistory từ string "YYYY-MM~YYYY-MM=price,..." sang array
 */
const parsePriceHistoryString = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str
    .split(',')
    .map((item) => {
      const match = item.trim().match(/^(\d{4}-\d{2})~(\d{4}-\d{2})=(.+)$/);
      if (!match) return null;
      return {
        startMonth: match[1],
        endMonth: match[2],
        price: Number(match[3]) || 0,
      };
    })
    .filter(Boolean);
};

/**
 * Format priceHistory array thành string "YYYY-MM~YYYY-MM=price,..."
 */
const formatPriceHistoryString = (priceHistory) => {
  if (!Array.isArray(priceHistory) || priceHistory.length === 0) return '';
  return priceHistory
    .map((item) => `${item.startMonth}~${item.endMonth}=${item.price}`)
    .join(',');
};

class MaterialAssignmentService extends BaseService {
  constructor() {
    super(MaterialAssignment);
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const doc = await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new NotFoundError('Không tìm thấy vật tư');
    // Cập nhật lại giá cho assignmentCode liên quan
    if (doc.assignmentCode) {
      await updatePriceAssignmentCode(doc.assignmentCode);
    }
    return doc;
  }

  async delete(id) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundError('Không tìm thấy vật tư');
    const assignmentCodeId = doc.assignmentCode;
    await doc.deleteOne();
    if (assignmentCodeId) {
      await updatePriceAssignmentCode(assignmentCodeId);
    }
    return doc;
  }

  async deleteMany(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new NotFoundError('Vui lòng chọn bản ghi cần xóa');
    }
    // Tìm các assignmentCode bị ảnh hưởng trước khi xóa
    const docs = await this.model.find(
      { _id: { $in: ids } },
      { assignmentCode: 1 }
    );
    const affectedAssignmentCodes = [
      ...new Set(
        docs
          .map((d) => d.assignmentCode?.toString())
          .filter(Boolean)
      ),
    ];
    const result = await this.model.deleteMany({ _id: { $in: ids } });
    // Cập nhật giá cho các assignmentCode bị ảnh hưởng
    for (const acId of affectedAssignmentCodes) {
      await updatePriceAssignmentCode(acId);
    }
    return result;
  }

  /**
   * GET /get - Aggregation pipeline với $lookup cho assignmentCode và uom
   */
  async get(query) {
    const { page = 1, limit = 10, q, assignmentCode, ...filter } = query;
    const skip = (page - 1) * limit;

    const matchStage = {};
    if (assignmentCode) {
      matchStage.assignmentCode = new mongoose.Types.ObjectId(assignmentCode);
    }

    if (q) {
      matchStage.$or = [
        { code: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') },
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'assignmentcodes',
          localField: 'assignmentCode',
          foreignField: '_id',
          as: 'assignmentCode',
        },
      },
      {
        $unwind: {
          path: '$assignmentCode',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'units',
          localField: 'uom',
          foreignField: '_id',
          as: 'uom',
        },
      },
      {
        $unwind: {
          path: '$uom',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { code: 1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: Number(limit) }],
        },
      },
    ];

    const result = await this.model.aggregate(pipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const data = result[0]?.data || [];

    return {
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      results: data.length,
    };
  }

  /**
   * GET /getGroup - Trả về AssignmentCodes kèm child materials với currentPrice
   */
  async getGroup(query) {
    const { page = 1, limit = 10, q } = query;
    const skip = (page - 1) * limit;

    const matchStage = {};
    if (q) {
      matchStage.$or = [
        { code: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') },
      ];
    }

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;

    const assignmentCodes = await AssignmentCode.find(matchStage)
      .sort({ code: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await AssignmentCode.countDocuments(matchStage);

    const result = [];
    for (const ac of assignmentCodes) {
      const materials = await this.model
        .find({ assignmentCode: ac._id })
        .populate('uom')
        .lean();

      const materialsWithPrice = materials.map((m) => ({
        ...m,
        currentPrice: resolveMaterialPrice(m, currentMonth),
      }));

      result.push({
        ...ac,
        materials: materialsWithPrice,
      });
    }

    return {
      data: result,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      results: result.length,
    };
  }

  /**
   * GET /getCount - Đếm materials có/không có assignmentCode
   */
  async getCount() {
    const result = await this.model.aggregate([
      {
        $facet: {
          withAssignmentCode: [
            { $match: { assignmentCode: { $ne: null } } },
            { $count: 'count' },
          ],
          withoutAssignmentCode: [
            { $match: { assignmentCode: null } },
            { $count: 'count' },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const facet = result[0] || {};
    return {
      withAssignmentCode: facet.withAssignmentCode?.[0]?.count || 0,
      withoutAssignmentCode: facet.withoutAssignmentCode?.[0]?.count || 0,
      total: facet.total?.[0]?.count || 0,
    };
  }

  /**
   * Import data với composite key (code|assignmentCodeId) cho upsert
   * priceHistory parse từ string "YYYY-MM~YYYY-MM=price,..."
   */
  async importData(data) {
    const operations = [];
    const invalidRows = [];

    // Load FK maps
    const uniqueAssignmentCodes = [
      ...new Set(
        data
          .map((d) => d.assignmentCode && String(d.assignmentCode).trim())
          .filter(Boolean)
      ),
    ];
    const uniqueUnits = [
      ...new Set(
        data
          .map((d) => d.uom && String(d.uom).trim())
          .filter(Boolean)
      ),
    ];

    const [assignmentCodes, units] = await Promise.all([
      AssignmentCode.find({ code: { $in: uniqueAssignmentCodes } }).lean(),
      Unit.find({ name: { $in: uniqueUnits } }).lean(),
    ]);

    const assignmentCodeMap = new Map(
      assignmentCodes.map((d) => [d.code, d._id])
    );
    const unitMap = new Map(units.map((u) => [u.name, u._id]));

    // Load existing materials để build composite key map
    const existingMaterials = await this.model
      .find({}, { code: 1, assignmentCode: 1 })
      .lean();
    const compositeKeyMap = new Map(
      existingMaterials.map((m) => [
        `${m.code}|${m.assignmentCode || ''}`,
        String(m._id),
      ])
    );

    for (const item of data) {
      let {
        _id,
        code,
        name,
        assignmentCode,
        uom,
        quantity,
        price,
        priceHistory,
        ...rest
      } = item;

      if (_id) {
        _id = String(_id)
          .replace(/"/g, '')
          .trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: 'ID không hợp lệ' });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      // Nếu chỉ có _id và không có code/name -> xóa
      if (_id && !cleanCode && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      if (!cleanCode || !cleanName) {
        invalidRows.push({ item, error: 'Mã và tên là bắt buộc' });
        continue;
      }

      // Map FK - assignmentCode
      let assignmentCodeId = null;
      if (assignmentCode) {
        const acId = assignmentCodeMap.get(String(assignmentCode).trim());
        if (!acId) {
          invalidRows.push({
            item,
            error: `Mã giao khoán không tồn tại: ${assignmentCode}`,
          });
          continue;
        }
        assignmentCodeId = acId;
      }

      // Map FK - uom
      let uomId = null;
      if (uom) {
        const uId = unitMap.get(String(uom).trim());
        if (!uId) {
          invalidRows.push({
            item,
            error: `Đơn vị tính không tồn tại: ${uom}`,
          });
          continue;
        }
        uomId = uId;
      }

      // Parse priceHistory từ string nếu có
      let parsedPriceHistory = [];
      if (typeof priceHistory === 'string') {
        parsedPriceHistory = parsePriceHistoryString(priceHistory);
      } else if (Array.isArray(priceHistory)) {
        parsedPriceHistory = priceHistory;
      }

      const updateData = {
        code: cleanCode,
        name: cleanName,
        assignmentCode: assignmentCodeId,
        uom: uomId,
        quantity: quantity != null ? Number(quantity) : undefined,
        priceHistory: parsedPriceHistory,
      };

      // Loại bỏ các field undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      // Composite key: code|assignmentCodeId
      const compositeKey = `${cleanCode}|${assignmentCodeId || ''}`;

      if (_id) {
        operations.push({
          updateOne: {
            filter: { _id },
            update: { $set: updateData },
            upsert: true,
          },
        });
      } else {
        // Tìm theo composite key
        const existingId = compositeKeyMap.get(compositeKey);
        if (existingId) {
          operations.push({
            updateOne: {
              filter: { _id: existingId },
              update: { $set: updateData },
            },
          });
        } else {
          operations.push({
            insertOne: { document: updateData },
          });
        }
      }

      // Cập nhật compositeKeyMap để tránh trùng trong cùng batch
      const fakeId = new mongoose.Types.ObjectId().toString();
      compositeKeyMap.set(compositeKey, fakeId);
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await this.model.bulkWrite(operations);
    }

    // Cập nhật giá cho các assignmentCode bị ảnh hưởng
    const affectedAssignmentCodes = [
      ...new Set(
        data
          .map((d) => {
            if (d.assignmentCode) {
              const acId = assignmentCodeMap.get(
                String(d.assignmentCode).trim()
              );
              return acId?.toString();
            }
            return null;
          })
          .filter(Boolean)
      ),
    ];
    for (const acId of affectedAssignmentCodes) {
      await updatePriceAssignmentCode(acId);
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
   * Export data với priceHistory format "YYYY-MM~YYYY-MM=price,..."
   */
  async exportData() {
    const data = await this.model
      .find()
      .populate('uom')
      .populate('assignmentCode')
      .lean();

    return data.map((i) => ({
      code: i?.code || '',
      name: i?.name || '',
      uom: i?.uom?.name || '',
      assignmentCode: i?.assignmentCode?.code || '',
      quantity: i?.quantity || '',
      price: formatPriceHistoryString(i?.priceHistory),
      _id: String(i?._id || ''),
    }));
  }
}

module.exports = MaterialAssignmentService;
