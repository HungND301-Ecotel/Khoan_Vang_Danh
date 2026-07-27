const BaseService = require('../../../shared/base/BaseService');
const MaterialBudget = require('./material-budget.model');
const Department = require('../../reference/department/department.model');
const MaterialAssignment = require('../../material/material-assignment.model');
const { monthToNumber, updatePriceAssignmentCode } = require('../../../shared/utils/priceCalculator');
const mongoose = require('mongoose');

class MaterialBudgetService extends BaseService {
  constructor() {
    super(MaterialBudget);
  }

  /**
   * Cấp 0: departments aggregation với phân trang
   */
  async getDepartments(query) {
    const { page = 1, limit = 10, department, q } = query;
    const skip = (page - 1) * limit;

    let matchStage = {};
    if (department) {
      matchStage.department = new mongoose.Types.ObjectId(department);
    }
    if (q) {
      const departments = await Department.find({
        code: new RegExp(q, 'i'),
      }).select('_id');
      matchStage.department = { $in: departments.map((d) => d._id) };
    }

    const basePipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$department',
          totalBudgetCost: { $sum: '$totalBudgetCost' },
          minMonth: { $min: '$month' },
          maxMonth: { $max: '$month' },
        },
      },
    ];

    const countResult = await this.model.aggregate([
      ...basePipeline,
      { $count: 'total' },
    ]);
    const totalItems = countResult[0]?.total || 0;

    const results = await this.model.aggregate([
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
      totalBudgetCost: r.totalBudgetCost,
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
   * Cấp 1: các tháng trong 1 department hoặc productionScope
   */
  async getMonths(query) {
    const { department, productionScope } = query;
    if (!department) {
      throw new Error('Thiếu department');
    }

    const matchStage = { department: new mongoose.Types.ObjectId(department) };
    if (productionScope) {
      matchStage.productionScope = new mongoose.Types.ObjectId(productionScope);
    }

    const results = await this.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$month',
          totalMonthCost: { $sum: '$totalBudgetCost' },
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
   * Cấp 2: các diện (productionScope) trong 1 department + 1 tháng
   */
  async getScopes(query) {
    const { department, month } = query;
    if (!department || !month) {
      throw new Error('Thiếu department hoặc month');
    }

    const results = await this.model.aggregate([
      {
        $match: {
          department: new mongoose.Types.ObjectId(department),
          month,
        },
      },
      {
        $group: {
          _id: '$productionScope',
          totalBudgetCost: { $sum: '$totalBudgetCost' },
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
      totalBudgetCost: r.totalBudgetCost,
    }));
  }

  /**
   * Cấp 3: các phase thuộc 1 department + 1 tháng + 1 diện
   */
  async getPhases(query) {
    const { department, month, productionScope } = query;
    if (!department || !month || !productionScope) {
      throw new Error('Thiếu department, month hoặc productionScope');
    }

    const docs = await this.model.find({
      department,
      month,
      productionScope,
    })
      .populate('phase', 'code name')
      .populate({ path: 'assignmentNormCode', select: 'code' })
      .populate({ path: 'adjustmentNormCode', select: 'code' })
      .populate({
        path: 'budgetCostDetails.assignmentCode',
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
   * Get one với current price resolution
   */
  async getOne(id) {
    const materialbudget = await this.model.findById(id)
      .populate('phase')
      .populate({
        path: 'assignmentNormCode',
        populate: {
          path: 'norms.assignmentCode',
          populate: {
            path: 'uom',
          },
        },
      })
      .populate({
        path: 'adjustmentNormCode',
        populate: {
          path: 'norms.assignmentCode',
          populate: {
            path: 'uom',
          },
        },
      });

    if (!materialbudget) {
      throw new Error('Không tìm thấy MaterialBudget');
    }

    const assignmentNorms = materialbudget.assignmentNormCode?.norms || [];
    const adjustmentNorms = materialbudget.adjustmentNormCode?.norms || [];
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;

    const currentMonthNum = monthToNumber(currentYearMonth);

    const result = [];

    for (const norm of adjustmentNorms) {
      const assignment = norm.assignmentCode;
      if (!assignment?._id) continue;
      await updatePriceAssignmentCode(assignment._id);

      const adjustmentNorm = assignmentNorms.find(
        (a) => a.assignmentCode?._id?.toString() === assignment._id.toString(),
      );

      const materials = await MaterialAssignment.find({
        assignmentCode: assignment._id,
      }).populate('uom');

      const materialsWithPrice = materials.map((item) => {
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
          ...item.toObject(),
          currentPrice,
        };
      });

      const totalNorm =
        norm.norm && adjustmentNorm?.norm ? norm.norm * adjustmentNorm.norm : 0;
      const quantity = totalNorm * materialbudget.production;
      const cost = quantity * (assignment.price || 0);
      result.push({
        _id: assignment._id,
        name: assignment.name,
        code: assignment.code,
        uom: assignment.uom?.name,
        price: assignment.price,
        assignmentNorm: norm?.norm,
        adjustmentNorm: adjustmentNorm?.norm,
        totalNorm: totalNorm,
        quantity: totalNorm * materialbudget.production,
        cost: cost,
        materials: materialsWithPrice,
      });
    }

    return {
      materialbudget,
      assignments: result,
    };
  }
}

module.exports = MaterialBudgetService;
