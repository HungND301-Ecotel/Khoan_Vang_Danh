const mongoose = require('mongoose');
const MaterialCostUsed = require('./material-cost-used.model');
const MaterialAssignment = require('../../material/material-assignment.model');
const MaterialBudget = require('../material-budget/material-budget.model');
const OtherMaterialCost = require('../other-material-cost/other-material-cost.model');
const InitialPlannedCost = require('../initial-planned/initial-planned-cost.model');
const Department = require('../../reference/department/department.model');
const { calculatedPhase } = require('../../../shared/utils/costCalculator');
const { recalculateAssignmentCodePrice, monthToNumber, resolveMaterialPrice } = require('../../../shared/utils/priceCalculator');

class MaterialCostUsedService {
  /**
   * Build lại materials với giá đã tính toán
   */
  async buildMaterials(materials, month, session = null) {
    const processedMaterials = await Promise.all(
      materials.map(async (doc) => {
        let query = MaterialAssignment.findById(doc.material);
        if (session) query = query.session(session);
        const material = await query;

        let price = 0;

        if (material?.assignmentCode) {
          // Có assignmentCode -> tính giá trung bình có trọng số
          const assignmentPrice = await recalculateAssignmentCodePrice(
            material.assignmentCode,
            month,
            session,
          );
          price = assignmentPrice || 0;
        } else {
          // Không có assignmentCode -> lookup priceHistory theo tháng
          price = resolveMaterialPrice(material, month);
        }

        return {
          material: doc.material,
          assignmentCode: material?.assignmentCode || null,
          quantity: Number(doc.quantity),
          price: price || 0,
          cost: Number(doc.quantity || 0) * (price || 0),
        };
      }),
    );

    return {
      materials: processedMaterials,
      totalUsedCost: processedMaterials.reduce((sum, item) => sum + item.cost, 0),
    };
  }

  /**
   * Build dữ liệu nguồn cho budget từ InitialPlannedCost
   */
  async buildBudgetSourceData({ productionScope, department, month, phase, unit, production }, session) {
    const initialData = await InitialPlannedCost.findOne({
      productionScope,
      department,
      month,
      phase,
    })
      .session(session)
      .lean();

    const assignmentCodes = (initialData?.initialPlannedCostDetails || []).map((d) => ({
      assignmentCode: d.assignmentCode,
      baseNorm: d.baseNorm,
      adjustmentNorm: d.adjustmentNorm,
      norm: d.norm,
    }));

    return {
      productionScope,
      department,
      month,
      phase,
      unit,
      production,
      assignmentNormCode: initialData?.assignmentNormCode,
      adjustmentNormCode: initialData?.adjustmentNormCode,
      assignmentCodes,
    };
  }

  /**
   * Reset budget về production=0 sau khi xóa
   */
  async resetBudgetAfterDelete(key, session) {
    const budgetSourceData = await this.buildBudgetSourceData(
      { ...key, unit: undefined, production: 0 },
      session,
    );

    const budgetResult = await calculatedPhase(
      budgetSourceData,
      key.month,
      'budget',
      session,
    );

    await MaterialBudget.findOneAndUpdate(
      key,
      {
        production: budgetResult.production,
        unit: budgetResult.unit,
        assignmentNormCode: budgetResult.assignmentNormCode,
        adjustmentNormCode: budgetResult.adjustmentNormCode,
        budgetCostDetails: budgetResult.budgetCostDetails,
        totalBudgetCost: budgetResult.totalBudgetCost,
      },
      { session },
    );
  }

  /**
   * Group materials theo assignmentCode
   */
  groupMaterialsByAssignmentCode(materials) {
    const groupMap = {};
    materials.forEach((mat) => {
      const material = mat.material;
      const assignmentCode = mat.assignmentCode || material?.assignmentCode || null;
      const assignmentCodeValue = assignmentCode?.code || '';
      const price = material?.assignmentCode ? mat.price : '';
      const compoundKey = assignmentCode ? `${assignmentCodeValue}_${price}` : '';

      if (!groupMap[compoundKey]) {
        groupMap[compoundKey] = {
          assignmentCode,
          price,
          materials: [],
        };
      }
      groupMap[compoundKey].materials.push({ ...mat, material, assignmentCode });
    });

    const result = Object.values(groupMap);
    result.sort((a, b) => {
      const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
      const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
      if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') return 1;
      if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') return -1;
      if (codeA < codeB) return -1;
      if (codeA > codeB) return 1;
      return 0;
    });
    return result;
  }

  /**
   * Đồng bộ MaterialBudget sau khi lưu
   */
  async syncMaterialBudget(data, session) {
    const budgetSourceData = await this.buildBudgetSourceData(
      {
        productionScope: data.productionScope,
        department: data.department,
        month: data.month,
        phase: data.phase,
        unit: data.unit,
        production: data.production,
      },
      session,
    );

    const budgetResult = await calculatedPhase(
      budgetSourceData,
      data.month,
      'budget',
      session,
    );

    await MaterialBudget.findOneAndUpdate(
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
        production: budgetResult.production,
        unit: budgetResult.unit,
        assignmentNormCode: budgetResult.assignmentNormCode,
        adjustmentNormCode: budgetResult.adjustmentNormCode,
        budgetCostDetails: budgetResult.budgetCostDetails,
        totalBudgetCost: budgetResult.totalBudgetCost,
      },
      {
        upsert: true,
        new: true,
        session,
      },
    );
  }

  /**
   * Tạo mới (upsert theo productionScope+department+month+phase)
   */
  async create(data) {
    const session = await mongoose.startSession();
    let saved;

    try {
      await session.withTransaction(async () => {
        const { materials: processedMaterials, totalUsedCost } =
          await this.buildMaterials(data.materials, data.month, session);

        saved = await MaterialCostUsed.findOneAndUpdate(
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
            production: data.production,
            unit: data.unit,
            materials: processedMaterials,
            totalUsedCost,
          },
          {
            upsert: true,
            new: true,
            session,
          },
        );

        await this.syncMaterialBudget(data, session);
      });

      return saved;
    } finally {
      session.endSession();
    }
  }

  /**
   * Tạo batch
   */
  async createBatch(items) {
    const session = await mongoose.startSession();
    const savedDocs = [];

    try {
      await session.withTransaction(async () => {
        for (const data of items) {
          const { materials, productionScope, department, month, phase, production, unit } = data;

          const { materials: processedMaterials, totalUsedCost } =
            await this.buildMaterials(materials, month, session);

          let saved;

          if (data._id) {
            saved = await MaterialCostUsed.findByIdAndUpdate(
              data._id,
              {
                productionScope,
                department,
                month,
                phase,
                production,
                unit,
                materials: processedMaterials,
                totalUsedCost,
              },
              { new: true, session },
            );
          } else {
            saved = await MaterialCostUsed.findOneAndUpdate(
              { productionScope, department, month, phase },
              {
                productionScope,
                department,
                month,
                phase,
                production,
                unit,
                materials: processedMaterials,
                totalUsedCost,
              },
              { upsert: true, new: true, session },
            );
          }

          savedDocs.push(saved);

          await this.syncMaterialBudget(data, session);
        }
      });

      return savedDocs;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cập nhật
   */
  async update(id, data) {
    const session = await mongoose.startSession();
    let updated;

    try {
      await session.withTransaction(async () => {
        const oldData = await MaterialCostUsed.findById(id).session(session);
        if (!oldData) {
          throw new Error('Sửa thất bại - Không tìm thấy dữ liệu cũ');
        }

        const { productionScope, department, month, phase, production, unit, materials } = data;

        const { materials: processedMaterials, totalUsedCost } =
          await this.buildMaterials(materials, month, session);

        updated = await MaterialCostUsed.findByIdAndUpdate(
          id,
          {
            productionScope,
            department,
            month,
            phase,
            production,
            unit,
            materials: processedMaterials,
            totalUsedCost,
          },
          { new: true, session },
        );

        const budgetSourceData = await this.buildBudgetSourceData(
          {
            productionScope: data.productionScope,
            department: data.department,
            month: data.month,
            phase: data.phase,
            unit: data.unit,
            production: data.production,
          },
          session,
        );

        const budgetResult = await calculatedPhase(
          budgetSourceData,
          data.month,
          'budget',
          session,
        );

        const oldKey = {
          productionScope: oldData.productionScope,
          department: oldData.department,
          month: oldData.month,
          phase: oldData.phase,
        };

        await MaterialBudget.findOneAndUpdate(
          oldKey,
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
          { new: true, session },
        );
      });

      return updated;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cập nhật batch
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

          const oldData = await MaterialCostUsed.findById(data._id).session(session);
          if (!oldData) {
            throw new Error(`Không tìm thấy MaterialCostUsed với id ${data._id}`);
          }

          const { productionScope, department, month, phase, production, unit, materials } = data;

          const { materials: processedMaterials, totalUsedCost } =
            await this.buildMaterials(materials, month, session);

          const updated = await MaterialCostUsed.findByIdAndUpdate(
            data._id,
            {
              productionScope,
              department,
              month,
              phase,
              production,
              unit,
              materials: processedMaterials,
              totalUsedCost,
            },
            { new: true, session },
          );

          updatedDocs.push(updated);

          const budgetSourceData = await this.buildBudgetSourceData(
            {
              productionScope: data.productionScope,
              department: data.department,
              month: data.month,
              phase: data.phase,
              unit: data.unit,
              production: data.production,
            },
            session,
          );

          const budgetResult = await calculatedPhase(
            budgetSourceData,
            data.month,
            'budget',
            session,
          );

          const oldKey = {
            productionScope: oldData.productionScope,
            department: oldData.department,
            month: oldData.month,
            phase: oldData.phase,
          };

          await MaterialBudget.findOneAndUpdate(
            oldKey,
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
            { new: true, session },
          );
        }
      });

      return updatedDocs;
    } finally {
      session.endSession();
    }
  }

  /**
   * Xóa (reset MaterialBudget về production=0)
   */
  async delete(id) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const deleteData = await MaterialCostUsed.findByIdAndDelete(id, { session });
        if (!deleteData) {
          throw new Error('Xóa thất bại - Không tìm thấy dữ liệu');
        }

        const key = {
          productionScope: deleteData.productionScope,
          department: deleteData.department,
          month: deleteData.month,
          phase: deleteData.phase,
        };

        await this.resetBudgetAfterDelete(key, session);
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Xóa batch
   */
  async deleteBatch(ids) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        for (const id of ids) {
          const deleteData = await MaterialCostUsed.findByIdAndDelete(id, { session });
          if (!deleteData) {
            throw new Error(`Xóa thất bại - Không tìm thấy dữ liệu với id ${id}`);
          }

          const key = {
            productionScope: deleteData.productionScope,
            department: deleteData.department,
            month: deleteData.month,
            phase: deleteData.phase,
          };

          await this.resetBudgetAfterDelete(key, session);
        }
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Xóa theo phân xưởng (reset budget về 0)
   */
  async deleteByDepartment(departmentIds) {
    const session = await mongoose.startSession();
    let deletedCount = 0;

    try {
      await session.withTransaction(async () => {
        const mcuDocs = await MaterialCostUsed.find(
          { department: { $in: departmentIds } },
          null,
          { session },
        ).lean();

        const otherResult = await OtherMaterialCost.deleteMany(
          { department: { $in: departmentIds } },
          { session },
        );

        const mcuResult = await MaterialCostUsed.deleteMany(
          { department: { $in: departmentIds } },
          { session },
        );

        deletedCount = mcuResult.deletedCount + otherResult.deletedCount;

        if (deletedCount === 0) {
          throw new Error('Không tìm thấy dữ liệu để xóa cho phân xưởng này');
        }

        for (const doc of mcuDocs) {
          const key = {
            productionScope: doc.productionScope,
            department: doc.department,
            month: doc.month,
            phase: doc.phase,
          };
          await this.resetBudgetAfterDelete(key, session);
        }
      });

      return deletedCount;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cấp 0: Danh sách departments + tổng cost + khoảng tháng (gộp MaterialCostUsed + OtherMaterialCost)
   */
  async getDepartments(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    let matchStage = {};
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
      { $project: { department: 1, month: 1, totalUsedCost: 1 } },
      {
        $unionWith: {
          coll: 'othermaterialcosts',
          pipeline: [
            { $match: matchStage },
            { $project: { department: 1, month: 1, totalUsedCost: 1 } },
          ],
        },
      },
      {
        $group: {
          _id: '$department',
          totalUsedCost: { $sum: '$totalUsedCost' },
          minMonth: { $min: '$month' },
          maxMonth: { $max: '$month' },
        },
      },
    ];

    const countResult = await MaterialCostUsed.aggregate([
      ...basePipeline,
      { $count: 'total' },
    ]);
    const totalItems = countResult[0]?.total || 0;

    const results = await MaterialCostUsed.aggregate([
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
      totalUsedCost: r.totalUsedCost,
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
   * Cấp 1: Các tháng trong 1 department (gộp cả 2 collection)
   */
  async getMonths(department) {
    const deptId = new mongoose.Types.ObjectId(department);

    const results = await MaterialCostUsed.aggregate([
      { $match: { department: deptId } },
      { $project: { month: 1, totalUsedCost: 1 } },
      {
        $unionWith: {
          coll: 'othermaterialcosts',
          pipeline: [
            { $match: { department: deptId } },
            { $project: { month: 1, totalUsedCost: 1 } },
          ],
        },
      },
      {
        $group: {
          _id: '$month',
          totalMonthCost: { $sum: '$totalUsedCost' },
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
   * Cấp 2: Các diện (productionScope) + "Công việc khác" trong 1 department + 1 tháng
   */
  async getScopes(department, month) {
    const deptId = new mongoose.Types.ObjectId(department);

    const scopeResults = await MaterialCostUsed.aggregate([
      { $match: { department: deptId, month } },
      {
        $group: {
          _id: '$productionScope',
          totalUsedCost: { $sum: '$totalUsedCost' },
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

    const data = scopeResults.map((r) => ({
      _id: r._id,
      isOtherTask: false,
      productionScope: {
        _id: r.productionScope._id,
        code: r.productionScope.code,
        name: r.productionScope.name,
      },
      totalUsedCost: r.totalUsedCost,
    }));

    const otherDoc = await OtherMaterialCost.findOne({
      department: deptId,
      month,
    })
      .select('_id totalUsedCost')
      .lean();

    if (otherDoc) {
      data.push({
        _id: otherDoc._id,
        isOtherTask: true,
        productionScope: {
          _id: otherDoc._id,
          code: 'Công việc khác',
          name: 'Công việc khác',
        },
        totalUsedCost: otherDoc.totalUsedCost,
      });
    }

    return data;
  }

  /**
   * Cấp 3: phase-document(s) + materials đã group, thuộc 1 scope (hoặc OtherMaterialCost)
   */
  async getPhases(query) {
    const { department, month, productionScope, isOtherTask } = query;

    if (isOtherTask === 'true') {
      const doc = await OtherMaterialCost.findById(productionScope)
        .populate({
          path: 'materials.material',
          populate: [
            { path: 'uom', select: 'name' },
            {
              path: 'assignmentCode',
              select: 'code name uom',
              populate: 'uom',
            },
          ],
        })
        .lean();

      if (!doc) {
        throw new Error('Không tìm thấy dữ liệu');
      }

      const materials = this.groupMaterialsByAssignmentCode(doc.materials || []);

      return [
        {
          _id: doc._id,
          key: doc._id.toString(),
          isOtherTask: true,
          totalUsedCost: doc.totalUsedCost,
          materials,
        },
      ];
    }

    if (!productionScope) {
      throw new Error('Thiếu productionScope');
    }

    const docs = await MaterialCostUsed.find({
      department,
      month,
      productionScope,
    })
      .populate('phase', 'code name')
      .populate({
        path: 'materials.material',
        populate: [
          { path: 'uom', select: 'name' },
          { path: 'assignmentCode', select: 'code name uom', populate: 'uom' },
        ],
      })
      .populate({
        path: 'materials.assignmentCode',
        select: 'code name uom',
        populate: 'uom',
      })
      .lean();

    return docs.map((d) => ({
      _id: d._id,
      key: d._id.toString(),
      isOtherTask: false,
      phase: d.phase,
      unit: d.unit,
      production: d.production,
      totalUsedCost: d.totalUsedCost,
      materials: this.groupMaterialsByAssignmentCode(d.materials || []),
    }));
  }
}

module.exports = MaterialCostUsedService;
