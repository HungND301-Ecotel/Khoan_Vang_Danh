const MaterialCostUsed = require("../model/MaterialCostUsed");
const MaterialAssignment = require("../model/MaterialAssignment");
const MaterialBudget = require("../model/MaterialBudget");
const OtherMaterialCost = require("../model/OtherMaterialCost");
const mongoose = require("mongoose");
const {
  recalculateAssignmentCodePrice,
  calculatedPhase,
} = require("../utils/recalculateAssignmentCodePrice");
const { monthToNumber, dateToNumber } = require("../utils/helpers");
const Department = require("../model/Department");
const InitialPlannedCost = require("../model/InitialPlannedCost"); // 👈 thêm import

// Helper: build lại assignmentCodes input cho calculatedPhase từ InitialPlannedCost tương ứng
const buildBudgetSourceData = async (
  { productionScope, department, month, phase, unit, production },
  session,
) => {
  const initialData = await InitialPlannedCost.findOne({
    productionScope,
    department,
    month,
    phase,
  })
    .session(session)
    .lean();

  const assignmentCodes = (initialData?.initialPlannedCostDetails || []).map(
    (d) => ({
      assignmentCode: d.assignmentCode,
      baseNorm: d.baseNorm,
      adjustmentNorm: d.adjustmentNorm,
      norm: d.norm,
    }),
  );

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
};

const resetBudgetAfterDelete = async (key, session) => {
  const budgetSourceData = await buildBudgetSourceData(
    { ...key, unit: undefined, production: 0 },
    session,
  );

  // Nếu không tìm thấy InitialPlannedCost tương ứng, budgetSourceData.assignmentCodes sẽ rỗng,
  // calculatedPhase vẫn chạy được, chỉ trả totalBudgetCost = 0, budgetCostDetails = []
  const budgetResult = await calculatedPhase(
    budgetSourceData,
    key.month,
    "budget",
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
    { session }, // không upsert - chỉ cập nhật nếu MaterialBudget đã tồn tại
  );
};

const groupMaterialsByAssignmentCode = (materials) => {
  const groupMap = {};
  materials.forEach((mat) => {
    const material = mat.material;
    const assignmentCode =
      mat.assignmentCode || material?.assignmentCode || null;
    const assignmentCodeValue = assignmentCode?.code || "";
    const price = material?.assignmentCode ? mat.price : "";
    const compoundKey = assignmentCode ? `${assignmentCodeValue}_${price}` : "";

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
    const codeA = a.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    const codeB = b.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    if (codeA === "NO_ASSIGNMENTCODE" && codeB !== "NO_ASSIGNMENTCODE")
      return 1;
    if (codeA !== "NO_ASSIGNMENTCODE" && codeB === "NO_ASSIGNMENTCODE")
      return -1;
    if (codeA < codeB) return -1;
    if (codeA > codeB) return 1;
    return 0;
  });
  return result;
};

const buildMaterials = async (materials, date, session = null) => {
  const processedMaterials = await Promise.all(
    materials.map(async (doc) => {
      const query = MaterialAssignment.findById(doc.material);

      if (session) query.session(session);

      const material = await query;

      let matched = null;

      if (material && Array.isArray(material.priceHistory)) {
        // date có thể là "dd/MM/yyyy" hoặc "yyyy-MM" (backward compat)
        // Chuyển về dd/MM/yyyy để so sánh
        let checkDate = date;
        if (date && date.match(/^\d{4}-\d{2}$/)) {
          // Nếu là "2026-01", chuyển thành "01/01/2026"
          const [year, month] = date.split('-');
          checkDate = `01/${month}/${year}`;
        }
        const checkDateNum = dateToNumber(checkDate);

        matched = material.priceHistory.find((priceItem) => {
          const start = dateToNumber(priceItem.startDate);
          const end = dateToNumber(priceItem.endDate);
          return start <= checkDateNum && checkDateNum <= end;
        });
      }

      const assignmentPriceResult = await recalculateAssignmentCodePrice(
        material?.assignmentCode,
        null,
        null,
        date,
        session,
      );

      // Chi phí thực hiện: dùng executionPrice
      let price = 0;
      if (material?.assignmentCode) {
        price = assignmentPriceResult?.executionPrice ?? 0;
      } else if (matched) {
        price = matched.executionPrice ?? 0;
      }

      return {
        material: doc.material,
        assignmentCode: material?.assignmentCode,
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
};

exports.create = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const data = req.body;

    let saved;

    await session.withTransaction(async () => {
      const { materials: processedMaterials, totalUsedCost } =
        await buildMaterials(data.materials, data.month, session);

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

      const budgetSourceData = await buildBudgetSourceData(
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
        "budget",
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
    });

    res.status(201).json({
      status: "success",
      message: "Tạo thành công",
      data: saved,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  } finally {
    session.endSession();
  }
};

exports.createBatch = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu dữ liệu items",
      });
    }

    const savedDocs = [];

    await session.withTransaction(async () => {
      for (const data of items) {
        const {
          materials,
          productionScope,
          department,
          month,
          phase,
          production,
          unit,
        } = data;

        const { materials: processedMaterials, totalUsedCost } =
          await buildMaterials(materials, month, session);

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
            {
              new: true,
              session,
            },
          );
        } else {
          saved = await MaterialCostUsed.findOneAndUpdate(
            {
              productionScope,
              department,
              month,
              phase,
            },
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
            {
              upsert: true,
              new: true,
              session,
            },
          );
        }

        savedDocs.push(saved);

        const budgetSourceData = await buildBudgetSourceData(
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
          "budget",
          session,
        );

        await MaterialBudget.findOneAndUpdate(
          {
            productionScope,
            department,
            month,
            phase,
          },
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
          {
            upsert: true,
            new: true,
            session,
          },
        );
      }
    });

    res.status(201).json({
      status: "success",
      message: "Lưu thành công",
      data: savedDocs,
    });
  } catch (err) {
    console.log(err.stack);

    res.status(500).json({
      status: "error",
      message: `Lưu thất bại, rollback: ${err.message}`,
    });
  } finally {
    session.endSession();
  }
};

exports.update = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      const oldData = await MaterialCostUsed.findById(req.params.id).session(
        session,
      );

      if (!oldData) {
        throw new Error("Sửa thất bại - Không tìm thấy dữ liệu cũ");
      }

      const data = req.body;

      const {
        productionScope,
        department,
        month,
        phase,
        production,
        unit,
        materials,
      } = data;

      const { materials: processedMaterials, totalUsedCost } =
        await buildMaterials(materials, month, session);

      updated = await MaterialCostUsed.findByIdAndUpdate(
        req.params.id,
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
        {
          new: true,
          session,
        },
      );

      const budgetSourceData = await buildBudgetSourceData(
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
        "budget",
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
        {
          new: true,
          session,
        },
      );
    });

    res.status(200).json({
      status: "success",
      message: "Sửa thành công",
      data: updated,
    });
  } catch (err) {
    console.log(err.stack);

    if (err.message === "Sửa thất bại - Không tìm thấy dữ liệu cũ") {
      return res.status(404).json({
        status: "error",
        message: err.message,
      });
    }

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  } finally {
    session.endSession();
  }
};

exports.updateBatch = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu dữ liệu items",
      });
    }

    const updatedDocs = [];

    await session.withTransaction(async () => {
      for (const data of items) {
        if (!data._id) {
          throw new Error("Thiếu _id trong item cần sửa");
        }

        const oldData = await MaterialCostUsed.findById(data._id).session(
          session,
        );

        if (!oldData) {
          throw new Error(`Không tìm thấy MaterialCostUsed với id ${data._id}`);
        }

        const {
          productionScope,
          department,
          month,
          phase,
          production,
          unit,
          materials,
        } = data;

        const { materials: processedMaterials, totalUsedCost } =
          await buildMaterials(materials, month, session);

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
          {
            new: true,
            session,
          },
        );

        updatedDocs.push(updated);

        const budgetSourceData = await buildBudgetSourceData(
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
          "budget",
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
          {
            new: true,
            session,
          },
        );
      }
    });

    res.status(200).json({
      status: "success",
      message: "Sửa thành công",
      data: updatedDocs,
    });
  } catch (err) {
    console.log(err.stack);

    res.status(500).json({
      status: "error",
      message: `Sửa thất bại, rollback: ${err.message}`,
    });
  } finally {
    session.endSession();
  }
};

exports.delete = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let deleteData;

    await session.withTransaction(async () => {
      deleteData = await MaterialCostUsed.findByIdAndDelete(req.params.id, {
        session,
      });

      if (!deleteData) {
        throw new Error("Xóa thất bại - Không tìm thấy dữ liệu");
      }

      const key = {
        productionScope: deleteData.productionScope,
        department: deleteData.department,
        month: deleteData.month,
        phase: deleteData.phase,
      };

      await resetBudgetAfterDelete(key, session);
    });

    res.status(200).json({ status: "success", message: "Xóa thành công" });
  } catch (err) {
    console.error(err.stack);
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ status: "error", message: err.message });
  } finally {
    session.endSession();
  }
};

// ===================== DELETE BY DEPARTMENT (sửa lại - reset budget về 0 thay vì xoá) =====================
exports.deleteByDepartment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { departmentIds } = req.body;

    if (
      !departmentIds ||
      !Array.isArray(departmentIds) ||
      departmentIds.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Chọn phân xưởng cần xóa",
      });
    }

    let deletedCount = 0;

    await session.withTransaction(async () => {
      // Lấy trước danh sách sẽ bị xoá để biết key nào cần reset budget
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
        throw new Error("Không tìm thấy dữ liệu để xóa cho phân xưởng này");
      }

      // Reset production = 0 và tính lại budget cho từng key vừa xoá
      // (OtherMaterialCost không có phase/budget tương ứng nên không cần xử lý riêng)
      for (const doc of mcuDocs) {
        const key = {
          productionScope: doc.productionScope,
          department: doc.department,
          month: doc.month,
          phase: doc.phase,
        };
        await resetBudgetAfterDelete(key, session);
      }
    });

    res.status(200).json({
      status: "success",
      message: `Đã xóa ${deletedCount} bản ghi và đồng bộ thành công`,
    });
  } catch (err) {
    console.error("Lỗi trong deleteByDepartment, đã rollback:", err.stack);
    res.status(500).json({
      status: "error",
      message: `Xóa thất bại, đã hoàn tác: ${err.message}`,
    });
  } finally {
    session.endSession();
  }
};

// ===== Cấp 0: departments + tổng cost + khoảng tháng (gộp cả MaterialCostUsed + OtherMaterialCost) =====
exports.get = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let matchStage = {};
    if (req.query.department) {
      matchStage.department = new mongoose.Types.ObjectId(req.query.department);
    }
    if (req.query.q) {
      const departments = await Department.find({
        code: new RegExp(req.query.q, "i"),
      }).select("_id");
      matchStage.department = { $in: departments.map((d) => d._id) };
    }

    // Gộp 2 collection bằng $unionWith, group theo department
    const basePipeline = [
      { $match: matchStage },
      { $project: { department: 1, month: 1, totalUsedCost: 1 } },
      {
        $unionWith: {
          coll: "othermaterialcosts",
          pipeline: [
            { $match: matchStage },
            { $project: { department: 1, month: 1, totalUsedCost: 1 } },
          ],
        },
      },
      {
        $group: {
          _id: "$department",
          totalUsedCost: { $sum: "$totalUsedCost" },
          minMonth: { $min: "$month" },
          maxMonth: { $max: "$month" },
        },
      },
    ];

    const countResult = await MaterialCostUsed.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);
    const totalItems = countResult[0]?.total || 0;

    const results = await MaterialCostUsed.aggregate([
      ...basePipeline,
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
    ]);

    const formatMonth = (m) => {
      if (!m) return "";
      const [y, mm] = m.split("-");
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

    res.status(200).json({
      status: "success",
      data: {
        data,
        page,
        totalDocs: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ===== Cấp 1: các tháng trong 1 department (gộp cả 2 collection) =====
exports.getMonths = async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu department" });
    }

    const deptId = new mongoose.Types.ObjectId(department);

    const results = await MaterialCostUsed.aggregate([
      { $match: { department: deptId } },
      { $project: { month: 1, totalUsedCost: 1 } },
      {
        $unionWith: {
          coll: "othermaterialcosts",
          pipeline: [
            { $match: { department: deptId } },
            { $project: { month: 1, totalUsedCost: 1 } },
          ],
        },
      },
      {
        $group: {
          _id: "$month",
          totalMonthCost: { $sum: "$totalUsedCost" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const data = results.map((r) => ({
      _id: r._id,
      month: r._id,
      totalMonthCost: r.totalMonthCost,
    }));

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ===== Cấp 2: các diện (productionScope) + "Công việc khác" trong 1 department + 1 tháng =====
exports.getScopesByMonth = async (req, res) => {
  try {
    const { department, month } = req.query;
    if (!department || !month) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu department hoặc month",
      });
    }

    const deptId = new mongoose.Types.ObjectId(department);

    // Group theo productionScope (MaterialCostUsed - có phase, có scope)
    const scopeResults = await MaterialCostUsed.aggregate([
      { $match: { department: deptId, month } },
      {
        $group: {
          _id: "$productionScope",
          totalUsedCost: { $sum: "$totalUsedCost" },
        },
      },
      {
        $lookup: {
          from: "productionscopes",
          localField: "_id",
          foreignField: "_id",
          as: "productionScope",
        },
      },
      { $unwind: "$productionScope" },
      { $sort: { "productionScope.code": 1 } },
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

    // "Công việc khác" - từ OtherMaterialCost, không có phase/scope thật
    const otherDoc = await OtherMaterialCost.findOne({
      department: deptId,
      month,
    })
      .select("_id totalUsedCost")
      .lean();

    if (otherDoc) {
      data.push({
        _id: otherDoc._id,
        isOtherTask: true,
        productionScope: {
          _id: otherDoc._id,
          code: "Công việc khác",
          name: "Công việc khác",
        },
        totalUsedCost: otherDoc.totalUsedCost,
      });
    }

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ===== Cấp 3: phase-document(s) + materials đã group, thuộc 1 scope (hoặc OtherMaterialCost) =====
exports.getPhasesByScope = async (req, res) => {
  try {
    const { department, month, productionScope, isOtherTask } = req.query;
    if (!department || !month) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu department hoặc month",
      });
    }

    // Trường hợp "Công việc khác" - lấy thẳng OtherMaterialCost theo id (productionScope lúc này chính là _id của OtherMaterialCost)
    if (isOtherTask === "true") {
      const doc = await OtherMaterialCost.findById(productionScope)
        .populate({
          path: "materials.material",
          populate: [
            { path: "uom", select: "name" },
            {
              path: "assignmentCode",
              select: "code name uom",
              populate: "uom",
            },
          ],
        })
        .lean();

      if (!doc) {
        return res
          .status(404)
          .json({ status: "error", message: "Không tìm thấy dữ liệu" });
      }

      const materials = groupMaterialsByAssignmentCode(doc.materials || []);

      return res.status(200).json({
        status: "success",
        data: [
          {
            _id: doc._id,
            key: doc._id.toString(),
            isOtherTask: true,
            totalUsedCost: doc.totalUsedCost,
            materials,
          },
        ],
      });
    }

    // Trường hợp bình thường - MaterialCostUsed, có thể có nhiều phase-document trong cùng scope
    if (!productionScope) {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu productionScope" });
    }

    const docs = await MaterialCostUsed.find({
      department,
      month,
      productionScope,
    })
      .populate("phase", "code name")
      .populate({
        path: "materials.material",
        populate: [
          { path: "uom", select: "name" },
          { path: "assignmentCode", select: "code name uom", populate: "uom" },
        ],
      })
      .populate({
        path: "materials.assignmentCode",
        select: "code name uom",
        populate: "uom",
      })
      .lean();

    const data = docs.map((d) => ({
      _id: d._id,
      key: d._id.toString(),
      isOtherTask: false,
      phase: d.phase,
      unit: d.unit,
      production: d.production,
      totalUsedCost: d.totalUsedCost,
      materials: groupMaterialsByAssignmentCode(d.materials || []),
    }));

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};
