const BaseService = require('../../../shared/base/BaseService');
const OtherMaterialCost = require('./other-material-cost.model');
const MaterialAssignment = require('../../material/material-assignment.model');
const {
  recalculateAssignmentCodePrice,
  monthToNumber,
} = require('../../../shared/utils/priceCalculator');
const ConflictError = require('../../../shared/exceptions/ConflictError');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');

class OtherMaterialCostService extends BaseService {
  constructor() {
    super(OtherMaterialCost);
  }

  /**
   * Xử lý giá cho danh sách vật tư
   * - Nếu material có assignmentCode -> recalculateAssignmentCodePrice
   * - Ngược lại -> lookup priceHistory theo month
   */
  async processMaterials(materials, month) {
    return Promise.all(
      materials.map(async (doc) => {
        const material = await MaterialAssignment.findById(doc?.material);
        let matched = null;

        if (material && Array.isArray(material.priceHistory)) {
          matched = material.priceHistory.find((priceItem) => {
            const start = monthToNumber(priceItem.startMonth);
            const end = monthToNumber(priceItem.endMonth);
            const checkMonth = monthToNumber(month);
            return start <= checkMonth && checkMonth <= end;
          });
        }

        const result = await recalculateAssignmentCodePrice(
          material?.assignmentCode,
          month
        );

        const price = material.assignmentCode
          ? result
          : matched
            ? matched.price
            : 0;
        return {
          material: doc.material,
          quantity: Number(doc.quantity),
          price: price || 0,
          cost: (price || 0) * Number(doc.quantity || 0),
        };
      })
    );
  }

  /**
   * Tạo mới - chỉ cho phép 1 OtherMaterialCost per department per month
   */
  async create(data) {
    const { department, month, materials } = data;

    const existing = await this.model.findOne({ department, month });
    if (existing) {
      throw new ConflictError(
        'Mỗi tháng phân xưởng chỉ được tạo 1 Công việc khác'
      );
    }

    const processedMaterials = await this.processMaterials(materials, month);
    const totalUsedCost = processedMaterials.reduce(
      (sum, item) => sum + item.cost,
      0
    );

    const newDoc = new this.model({
      department,
      month,
      materials: processedMaterials,
      totalUsedCost,
    });
    await newDoc.save();
    return newDoc;
  }

  /**
   * Cập nhật - kiểm tra trùng department/month với bản ghi khác
   */
  async update(id, data) {
    const { department, month, materials } = data;

    const existing = await this.model.findOne({
      department,
      month,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictError(
        'Mỗi tháng phân xưởng chỉ được tạo 1 Công việc khác'
      );
    }

    const processedMaterials = await this.processMaterials(materials, month);
    const totalUsedCost = processedMaterials.reduce(
      (sum, item) => sum + item.cost,
      0
    );

    const doc = await this.model.findByIdAndUpdate(
      id,
      { department, month, materials: processedMaterials, totalUsedCost },
      { new: true }
    );
    if (!doc) {
      throw new NotFoundError('Sửa thất bại');
    }
    return doc;
  }

  /**
   * Xóa
   */
  async delete(id) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) {
      throw new NotFoundError('Xóa thất bại');
    }
    return doc;
  }

  /**
   * Lấy danh sách có phân trang
   */
  async getPaginated(query, options = {}) {
    const { page = 1, limit = 10, ...filter } = query;
    const skip = (page - 1) * limit;
    const { sort = { createdAt: -1 }, populate = [] } = options;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate(populate),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      results: data.length,
    };
  }
}

module.exports = OtherMaterialCostService;
