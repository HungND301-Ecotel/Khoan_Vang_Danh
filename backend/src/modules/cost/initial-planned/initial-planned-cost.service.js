const mongoose = require('mongoose');
const BaseService = require('../../../shared/base/BaseService');
const InitialPlannedCost = require('./initial-planned-cost.model');
const MaterialCostUsed = require('../material-cost-used/material-cost-used.model');
const MaterialBudget = require('../material-budget/material-budget.model');
const MaterialAssignment = require('../../material/material-assignment.model');
const Department = require('../../reference/department/department.model');
const { calculatedPhase } = require('../../../shared/utils/costCalculator');
const { recalculateAssignmentCodePrice, monthToNumber } = require('../../../shared/utils/priceCalculator');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');
const ValidationError = require('../../../shared/exceptions/ValidationError');

class InitialPlannedCostService extends BaseService {
  constructor() {
    super(InitialPlannedCost);
  }

  /**
   * Đồng bộ dữ liệu liên quan: MaterialCostUsed và MaterialBudget
   * @param {Object} data - Dữ liệu đã tính toán (result từ calculatedPhase)
   * @param {Object|null} oldKey - Kh cũ khi cập nhật { productionScope, department, month, phase }
   * @param {Object} session - MongoDB session
   */
  async syncRelatedData(data, oldKey, session) {
    const {
      productionScope,
      department,
      month,
      phase,
      unit,
      assignmentNormCode,
      adjustmentNormCode,
    } = data;

    const searchKey = oldKey || { productionScope, department, month, phase };

    // 1. Đồng bộ MaterialCostUsed
    const existingMCU = await MaterialCostUsed.findOne(searchKey).session(session);
    const mcuProduction = existingMCU?.production ?? 0;

    if (existingMCU) {
      existingMCU.productionScope = productionScope;
      existingMCU.department = department;
      existingMCU.month = month;
      existingMCU.phase = phase;
      existingMCU.unit = unit;
      existingMCU.assignmentNormCode = assignmentNormCode;
      existingMCU.adjustmentNormCode = adjustmentNormCode;
      // production giữ nguyên giá trị thực tế đang có ở MCU, không lấy từ data initial/budget

      if (existingMCU.materials && existingMCU.materials.length > 0) {
        const refreshedMaterials = await Promise.all(
          existingMCU.materials.map(async (doc) => {
            const material = await MaterialAssignment.findById(doc?.material).session(session);
            let matched = null;

            if (material && Array.isArray(material.priceHistory)) {
              matched = material.priceHistory.find((priceItem) => {
                const start = monthToNumber(priceItem.startMonth);
                const end = monthToNumber(priceItem.endMonth);
                const checkMonth = monthToNumber(month);
                return start <= checkMonth && checkMonth <= end;
              });
            }

            const priceResult = await recalculateAssignmentCodePrice(
              material?.assignmentCode,
              month,
              session,
            );

            const price = material?.assignmentCode
              ? priceResult
              : matched
                ? matched.price
                : 0;

            return {
              material: doc.material,
              quantity: Number(doc.quantity),
              price: price || 0,
              cost: (price || 0) * Number(doc.quantity || 0),
            };
          }),
        );

        existingMCU.materials = refreshedMaterials;
        existingMCU.totalUsedCost = refreshedMaterials.reduce(
          (sum, item) => sum + item.cost,
          0,
        );
      }

      await existingMCU.save({ session });
    } else {
      const newMCU = new MaterialCostUsed({
        productionScope,
        department,
        month,
        phase,
        production: 0,
        unit,
        assignmentNormCode,
        adjustmentNormCode,
        materials: [],
        totalUsedCost: 0,
      });
      await newMCU.save({ session });
    }

    // 2. Tính và đồng bộ MaterialBudget - dùng production thực tế lấy từ MCU
    const budgetSourceData = { ...data, production: mcuProduction };
    const budgetResult = await calculatedPhase(budgetSourceData, month, 'budget', session);

    await MaterialBudget.findOneAndUpdate(
      searchKey,
      {
        productionScope,
        department,
        month,
        phase,
        production: budgetResult.production,
        unit: budgetResult.unit,
        assignmentNormCode: budgetResult.assignmentNormCode,
        adjustmentNormCode: budgetResult.adjustmentNormCode,
        budgetCostDetails: budgetResult.budgetCostDetails,
        totalBudgetCost: budgetResult.totalBudgetCost,
      },
      { upsert: true, new: true, session },
    );
  }

  /**
   * Tạo mới chi phí kế hoạch ban đầu (với transaction + sync)
   */
  async create(data) {
    const session = await mongoose.startSession();
    let saved;

    try {
      await session.withTransaction(async () => {
        const result = await calculatedPhase(data, data.month, 'initial', session);

        saved = await InitialPlannedCost.findOneAndUpdate(
          {
            productionScope: data.productionScope,
            department: data.department,
            month: data.month,
            phase: data.phase,
          },
          {
            productionScope: data.productionScope,
            department: data.department,
            month: data.month,
            phase: data.phase,
            production: result.production,
            unit: result.unit,
            assignmentNormCode: result.assignmentNormCode,
            adjustmentNormCode: result.adjustmentNormCode,
            initialPlannedCostDetails: result.initialPlannedCostDetails,
            totalInitialPlannedCost: result.totalInitialPlannedCost,
          },
          { upsert: true, new: true, session },
        );

        await this.syncRelatedData(result, null, session);
      });

      return saved;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Tạo batch chi phí kế hoạch ban đầu (với transaction + sync)
   */
  async createBatch(items) {
    const session = await mongoose.startSession();
    const savedDocs = [];

    try {
      await session.withTransaction(async () => {
        for (const data of items) {
          const result = await calculatedPhase(data, data.month, 'initial', session);
          let saved;
          let oldKey = null;

          if (data._id) {
            // Có _id -> đây là sửa, lấy khoá cũ trước khi ghi đè
            const oldData = await InitialPlannedCost.findById(data._id).session(session);
            if (!oldData) {
              throw new Error(`Không tìm thấy dữ liệu cũ với id ${data._id}`);
            }

            oldKey = {
              productionScope: oldData.productionScope,
              department: oldData.department,
              month: oldData.month,
              phase: oldData.phase,
            };

            saved = await InitialPlannedCost.findByIdAndUpdate(
              data._id,
              {
                productionScope: result.productionScope,
                department: result.department,
                month: result.month,
                phase: result.phase,
                production: result.production,
                unit: result.unit,
                assignmentNormCode: result.assignmentNormCode,
                adjustmentNormCode: result.adjustmentNormCode,
                initialPlannedCostDetails: result.initialPlannedCostDetails,
                totalInitialPlannedCost: result.totalInitialPlannedCost,
              },
              { new: true, session },
            );
          } else {
            // Không có _id -> tạo mới (hoặc upsert nếu trùng khoá)
            saved = await InitialPlannedCost.findOneAndUpdate(
              {
                productionScope: data.productionScope,
                department: data.department,
                month: data.month,
                phase: data.phase,
              },
              {
                productionScope: data.productionScope,
                department: data.department,
                month: data.month,
                phase: data.phase,
                production: result.production,
                unit: result.unit,
                assignmentNormCode: result.assignmentNormCode,
                adjustmentNormCode: result.adjustmentNormCode,
                initialPlannedCostDetails: result.initialPlannedCostDetails,
                totalInitialPlannedCost: result.totalInitialPlannedCost,
              },
              { upsert: true, new: true, session },
            );
          }

          savedDocs.push(saved);
          await this.syncRelatedData(result, oldKey, session);
        }
      });

      return savedDocs;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Cập nhật chi phí kế hoạch ban đầu (với transaction + sync)
   */
  async update(id, data) {
    const session = await mongoose.startSession();
    let updated;

    try {
      await session.withTransaction(async () => {
        const oldData = await InitialPlannedCost.findById(id).session(session);
        if (!oldData) {
          throw new NotFoundError('Sửa thất bại - Không tìm thấy dữ liệu');
        }

        const result = await calculatedPhase(data, data.month, 'initial', session);

        updated = await InitialPlannedCost.findByIdAndUpdate(
          id,
          {
            productionScope: result.productionScope,
            department: result.department,
            month: result.month,
            phase: result.phase,
            production: result.production,
            unit: result.unit,
            assignmentNormCode: result.assignmentNormCode,
            adjustmentNormCode: result.adjustmentNormCode,
            initialPlannedCostDetails: result.initialPlannedCostDetails,
            totalInitialPlannedCost: result.totalInitialPlannedCost,
          },
          { new: true, session },
        );

        const oldKey = {
          productionScope: oldData.productionScope,
          department: oldData.department,
          month: oldData.month,
          phase: oldData.phase,
        };

        await this.syncRelatedData(result, oldKey, session);
      });

      return updated;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Cập nhật batch chi phí kế hoạch ban đầu (với transaction + sync)
   */
  async updateBatch(items) {
    const session = await mongoose.startSession();
    const updatedDocs = [];

    try {
      await session.withTransaction(async () => {
        for (const data of items) {
          if (!data._id) {
            throw new Error('Thiếu _id trong item cần sửa');
          }

          const oldData = await InitialPlannedCost.findById(data._id).session(session);
          if (!oldData) {
            throw new Error(`Không tìm thấy dữ liệu cũ với id ${data._id}`);
          }

          const result = await calculatedPhase(data, data.month, 'initial', session);

          const updated = await InitialPlannedCost.findByIdAndUpdate(
            data._id,
            {
              productionScope: result.productionScope,
              department: result.department,
              month: result.month,
              phase: result.phase,
              production: result.production,
              unit: result.unit,
              assignmentNormCode: result.assignmentNormCode,
              adjustmentNormCode: result.adjustmentNormCode,
              initialPlannedCostDetails: result.initialPlannedCostDetails,
              totalInitialPlannedCost: result.totalInitialPlannedCost,
            },
            { new: true, session },
          );

          updatedDocs.push(updated);

          const oldKey = {
            productionScope: oldData.productionScope,
            department: oldData.department,
            month: oldData.month,
            phase: oldData.phase,
          };

          await this.syncRelatedData(result, oldKey, session);
        }
      });

      return updatedDocs;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Xóa chi phí kế hoạch ban đầu (cascade xóa MaterialCostUsed + MaterialBudget)
   */
  async delete(id) {
    const targetDoc = await InitialPlannedCost.findByIdAndDelete(id);
    if (!targetDoc) {
      throw new NotFoundError('Xóa thất bại - Không tìm thấy dữ liệu');
    }

    const key = {
      productionScope: targetDoc.productionScope,
      department: targetDoc.department,
      month: targetDoc.month,
      phase: targetDoc.phase,
    };

    await MaterialCostUsed.findOneAndDelete(key);
    await MaterialBudget.findOneAndDelete(key);

    return targetDoc;
  }

  /**
   * Xóa batch chi phí kế hoạch ban đầu (với transaction, cascade)
   */
  async deleteBatch(ids) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        for (const id of ids) {
          const targetDoc = await InitialPlannedCost.findByIdAndDelete(id, { session });
          if (!targetDoc) {
            throw new Error(`Không tìm thấy dữ liệu với id ${id}`);
          }

          const key = {
            productionScope: targetDoc.productionScope,
            department: targetDoc.department,
            month: targetDoc.month,
            phase: targetDoc.phase,
          };

          await MaterialCostUsed.findOneAndDelete(key, { session });
          await MaterialBudget.findOneAndDelete(key, { session });
        }
      });

      return { deletedCount: ids.length };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Xóa theo phân xưởng (với transaction, cascade)
   */
  async deleteByDepartment(departmentIds) {
    const session = await mongoose.startSession();

    try {
      let deletedCount = 0;

      await session.withTransaction(async () => {
        const result = await InitialPlannedCost.deleteMany(
          { department: { $in: departmentIds } },
          { session },
        );
        deletedCount = result.deletedCount;

        if (deletedCount === 0) {
          throw new Error('Không tìm thấy dữ liệu để xóa cho phân xưởng này');
        }

        await MaterialCostUsed.deleteMany(
          { department: { $in: departmentIds } },
          { session },
        );
        await MaterialBudget.deleteMany(
          { department: { $in: departmentIds } },
          { session },
        );
      });

      return { deletedCount };
    } finally {
      await session.endSession();
    }
  }

  // ===================== AGGREGATION ENDPOINTS =====================

  /**
   * Cấp 0: Danh sách departments + tổng cost + khoảng tháng
   */
  async getDepartments(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const matchStage = {};
    if (query.department) {
      matchStage.department = new mongoose.Types.ObjectId(query.department);
    }
    if (query.q) {
      const departments = await Department.find({
        code: new RegExp(query.q, 'i'),
      }).select('_id');
      matchStage.department = { $in: departments.map((d) => d._id) };
    }

    const basePipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$department',
          totalInitialPlannedCost: { $sum: '$totalInitialPlannedCost' },
          minMonth: { $min: '$month' },
          maxMonth: { $max: '$month' },
        },
      },
    ];

    const countResult = await InitialPlannedCost.aggregate([
      ...basePipeline,
      { $count: 'total' },
    ]);
    const totalItems = countResult[0]?.total || 0;

    const results = await InitialPlannedCost.aggregate([
      ...basePipeline,
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: '$department' },
    ]);

    const formatMonth = (m) => {
      if (!m) return '';
      const [y, mm] = m.split('-');
      return `${mm}/${y}`;
    };

    const data = results.map((r) => ({
      _id: r._id,
      department: {
        _id: r.department._id,
        code: r.department.code,
        name: r.department.name,
      },
      totalInitialPlannedCost: r.totalInitialPlannedCost,
      month: `${formatMonth(r.minMonth)} -> ${formatMonth(r.maxMonth)}`,
    }));

    return {
      data,
      page,
      totalDocs: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  /**
   * Cấp 1: Các tháng trong 1 department hoặc productionScope
   */
  async getMonths(query) {
    const { department, productionScope } = query;
    if (!department) {
      throw new ValidationError('Thiếu department');
    }

    const matchStage = { department: new mongoose.Types.ObjectId(department) };
    if (productionScope) {
      matchStage.productionScope = new mongoose.Types.ObjectId(productionScope);
    }

    const results = await InitialPlannedCost.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$month',
          totalMonthCost: { $sum: '$totalInitialPlannedCost' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return results.map((r) => ({
      _id: r._id,
      month: r._id,
      totalMonthCost: r.totalMonthCost,
    }));
  }

  /**
   * Cấp 2: Các diện (productionScope) trong 1 department + 1 tháng
   */
  async getScopesByMonth(query) {
    const { department, month } = query;
    if (!department || !month) {
      throw new ValidationError('Thiếu department hoặc month');
    }

    const results = await InitialPlannedCost.aggregate([
      {
        $match: {
          department: new mongoose.Types.ObjectId(department),
          month,
        },
      },
      {
        $group: {
          _id: '$productionScope',
          totalInitialPlannedCost: { $sum: '$totalInitialPlannedCost' },
        },
      },
      {
        $lookup: {
          from: 'productionscopes',
          localField: '_id',
          foreignField: '_id',
          as: 'productionScope',
        },
      },
      { $unwind: '$productionScope' },
      { $sort: { 'productionScope.code': 1 } },
    ]);

    return results.map((r) => ({
      _id: r._id,
      productionScope: {
        _id: r.productionScope._id,
        code: r.productionScope.code,
        name: r.productionScope.name,
      },
      totalInitialPlannedCost: r.totalInitialPlannedCost,
    }));
  }

  /**
   * Cấp 3: Các phase thuộc 1 department + 1 tháng + 1 diện
   */
  async getPhasesByScope(query) {
    const { department, month, productionScope } = query;
    if (!department || !month || !productionScope) {
      throw new ValidationError('Thiếu department, month hoặc productionScope');
    }

    const docs = await InitialPlannedCost.find({
      department,
      month,
      productionScope,
    })
      .populate('phase', 'code name')
      .populate({ path: 'assignmentNormCode', select: 'code' })
      .populate({ path: 'adjustmentNormCode', select: 'code' })
      .populate({
        path: 'initialPlannedCostDetails.assignmentCode',
        select: 'code name uom',
        populate: { path: 'uom', select: 'name' },
      })
      .lean();

    return docs.map((d) => ({
      ...d,
      key: d._id.toString(),
    }));
  }

  /**
   * Lấy scopes theo department
   */
  async getScopesByDepartment(departmentId) {
    const scopes = await InitialPlannedCost.find({ department: departmentId })
      .populate('productionScope', 'code name')
      .lean();

    const uniqueScopes = [];
    const scopeSet = new Set();
    for (const doc of scopes) {
      if (doc.productionScope && !scopeSet.has(doc.productionScope._id.toString())) {
        scopeSet.add(doc.productionScope._id.toString());
        uniqueScopes.push(doc.productionScope);
      }
    }

    return uniqueScopes;
  }

  /**
   * Lấy 1 bản ghi chi tiết theo productionScope
   */
  async getOne(productionScope, departmentId) {
    const query = { productionScope };
    if (departmentId) {
      query.department = departmentId;
    }

    const modelQuery = InitialPlannedCost.find(query)
      .populate({
        path: 'productionScope',
        select: 'code name',
      })
      .populate('phases.phase', 'code name')
      .populate({
        path: 'phases.initialPlannedCostDetails.assignmentCode',
        select: 'code name uom',
        populate: 'uom',
      })
      .populate({
        path: 'phases.assignmentNormCode',
        select: 'norms code',
        populate: [{ path: 'norms.assignmentCode', populate: 'uom' }],
      })
      .populate({
        path: 'phases.adjustmentNormCode',
        select: 'norms code',
        populate: [{ path: 'norms.assignmentCode', populate: 'uom' }],
      });

    const allDocs = await modelQuery.lean().exec();
    if (allDocs.length === 0) {
      throw new NotFoundError(
        'Không tìm thấy dữ liệu chi phí kế hoạch ban đầu cho phạm vi sản xuất này.',
      );
    }

    const data = {
      _id: productionScope,
      productionScope: allDocs[0]?.productionScope,
      group: [],
    };

    for (const doc of allDocs) {
      data.group.push({
        _id: doc._id,
        month: doc.month,
        totalInitialPlannedCost: doc.totalInitialPlannedCost,
        phases: doc.phases
          ? doc.phases.map((phaseItem) => ({
              ...phaseItem,
              key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`,
            }))
          : [],
      });
    }

    return data;
  }
}

module.exports = InitialPlannedCostService;
