const InitialPlannedCost = require("../model/InitialPlannedCost");
const MaterialCostUsed = require("../model/MaterialCostUsed");
const MaterialBudget = require("../model/MaterialBudget");
const MaterialAssignment = require("../model/MaterialAssignment");
const { paginateQuery } = require("../utils/pagination");
const {
  recalculateAssignmentCodePrice,
  calculatedPhase,
} = require("../utils/recalculateAssignmentCodePrice");
const { monthToNumber, dateToNumber } = require("../utils/helpers");
const Department = require("../model/Department");

const syncRelatedData = async (data, oldKey, session) => {
  try {
    const {
      productionScope,
      department,
      month,
      phase,
      unit,
      assignmentNormCode,
      adjustmentNormCode,
    } = data;

    // Mặc định date=1, shift=1 khi sync từ kế hoạch ban đầu
    const defaultDate = 1;
    const defaultShift = 1;

    const searchKey = oldKey || {
      productionScope,
      department,
      month,
      date: defaultDate,
      shift: defaultShift,
      phase,
    };

    // 1. Đồng bộ MaterialCostUsed
    const existingMCU =
      await MaterialCostUsed.findOne(searchKey).session(session);

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
            const material = await MaterialAssignment.findById(
              doc?.material,
            ).session(session);
            let matched = null;

            // Chuyển month (yyyy-MM) sang dd/MM/yyyy để so sánh
            let checkDate = month;
            if (month && month.match(/^\d{4}-\d{2}$/)) {
              const [year, m] = month.split("-");
              checkDate = `01/${m}/${year}`;
            }

            if (material && Array.isArray(material.priceHistory)) {
              const checkDateNum = dateToNumber(checkDate);
              matched = material.priceHistory.find((priceItem) => {
                const start = dateToNumber(priceItem.startDate);
                const end = dateToNumber(priceItem.endDate);
                return start <= checkDateNum && checkDateNum <= end;
              });
            }

            // Chi phí kế hoạch ban đầu: chỉ lấy plannedPrice (mode month)
            let price = 0;
            if (material?.assignmentCode) {
              // Có mã giao khoán: lấy plannedPrice từ assignmentCode
              const priceResult = await recalculateAssignmentCodePrice(
                material?.assignmentCode,
                null,
                null,
                month,  // truyền tháng
                session,
                true,   // isMonthMode = true
              );
              price = priceResult?.plannedPrice ?? 0;
            } else if (matched) {
              // Không có mã giao khoán: lấy plannedPrice từ priceHistory
              price = matched.plannedPrice ?? 0;
            }
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
        date: 1,           // Mặc định ngày 1
        shift: 1,          // Mặc định ca 1
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
    const budgetResult = await calculatedPhase(
      budgetSourceData,
      month,
      "budget",
      session,
    );
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
  } catch (error) {
    console.error("Lỗi đồng bộ dữ liệu liên quan:", error.stack);
    throw error;
  }
};

exports.create = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let saved;

    await session.withTransaction(async () => {
      const data = req.body;

      const result = await calculatedPhase(
        data,
        data.month,
        "initial",
        session,
      );

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
        {
          upsert: true,
          new: true,
          session,
        },
      );

      await syncRelatedData(result, null, session);
    });

    res.status(201).json({
      status: "success",
      message: "Tạo và đồng bộ thành công",
      data: saved,
    });
  } catch (err) {
    console.error(err.stack);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  } finally {
    session.endSession();
  }
};

// ===================== CREATE BATCH =====================

exports.createBatch = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body; // [{ _id?, productionScope, department, month, phase, production, unit, ... }, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu dữ liệu items hoặc items không hợp lệ",
      });
    }

    const savedDocs = [];

    await session.withTransaction(async () => {
      for (const data of items) {
        const result = await calculatedPhase(
          data,
          data.month,
          "initial",
          session,
        );

        let saved;
        let oldKey = null;

        if (data._id) {
          // Có _id -> đây là sửa, lấy khoá cũ trước khi ghi đè (phòng trường hợp đổi productionScope/department/month/phase)
          const oldData = await InitialPlannedCost.findById(data._id).session(
            session,
          );
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
          // Không có _id -> tạo mới (hoặc upsert nếu trùng khoá với bản ghi có sẵn)
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

        await syncRelatedData(result, oldKey, session);
      }
    });

    res.status(201).json({
      status: "success",
      message: "Lưu và đồng bộ thành công",
      data: savedDocs,
    });
  } catch (err) {
    console.error("Lỗi trong createBatch, đã rollback:", err.stack);
    res.status(500).json({
      status: "error",
      message: `Lưu thất bại, đã hoàn tác toàn bộ thay đổi: ${err.message}`,
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
      const oldData = await InitialPlannedCost.findById(req.params.id).session(
        session,
      );

      if (!oldData) {
        return res.status(404).json({
          status: "error",
          message: "Sửa thất bại - Không tìm thấy dữ liệu",
        });
      }

      const data = req.body;

      const result = await calculatedPhase(
        data,
        data.month,
        "initial",
        session,
      );

      updated = await InitialPlannedCost.findByIdAndUpdate(
        req.params.id,
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
        {
          new: true,
          session,
        },
      );

      const oldKey = {
        productionScope: oldData.productionScope,
        department: oldData.department,
        month: oldData.month,
        phase: oldData.phase,
      };

      await syncRelatedData(result, oldKey, session);
    });

    res.status(200).json({
      status: "success",
      message: "Sửa và đồng bộ thành công",
      data: updated,
    });
  } catch (err) {
    console.error(err.stack);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  } finally {
    session.endSession();
  }
};

// ===================== UPDATE BATCH =====================

exports.updateBatch = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items } = req.body; // [{ _id, productionScope, department, month, phase, production, unit, ... }, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu dữ liệu items hoặc items không hợp lệ",
      });
    }

    const updatedDocs = [];

    await session.withTransaction(async () => {
      for (const data of items) {
        if (!data._id) {
          throw new Error("Thiếu _id trong item cần sửa");
        }

        const oldData = await InitialPlannedCost.findById(data._id).session(
          session,
        );
        if (!oldData) {
          throw new Error(`Không tìm thấy dữ liệu cũ với id ${data._id}`);
        }

        const result = await calculatedPhase(
          data,
          data.month,
          "initial",
          session,
        );

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

        await syncRelatedData(result, oldKey, session);
      }
    });

    res.status(200).json({
      status: "success",
      message: "Sửa và đồng bộ thành công",
      data: updatedDocs,
    });
  } catch (err) {
    console.error("Lỗi trong updateBatch, đã rollback:", err.stack);
    res.status(500).json({
      status: "error",
      message: `Sửa thất bại, đã hoàn tác toàn bộ thay đổi: ${err.message}`,
    });
  } finally {
    session.endSession();
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const targetDoc = await InitialPlannedCost.findByIdAndDelete(id);
    if (!targetDoc) {
      return res.status(404).json({
        status: "error",
        message: "Xóa thất bại - Không tìm thấy dữ liệu",
      });
    }

    const key = {
      productionScope: targetDoc.productionScope,
      department: targetDoc.department,
      month: targetDoc.month,
      phase: targetDoc.phase,
    };

    await MaterialCostUsed.findOneAndDelete(key);
    await MaterialBudget.findOneAndDelete(key);

    res
      .status(200)
      .json({ status: "success", message: "Xóa và đồng bộ thành công" });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ===================== DELETE BATCH =====================

exports.deleteBatch = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { ids } = req.body; // ["id1", "id2", ...]

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu dữ liệu ids hoặc ids không hợp lệ",
      });
    }

    await session.withTransaction(async () => {
      for (const id of ids) {
        const targetDoc = await InitialPlannedCost.findByIdAndDelete(id, {
          session,
        });
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

    res
      .status(200)
      .json({ status: "success", message: "Xóa và đồng bộ thành công" });
  } catch (err) {
    console.error("Lỗi trong deleteBatch, đã rollback:", err.stack);
    res.status(500).json({
      status: "error",
      message: `Xóa thất bại, đã hoàn tác toàn bộ thay đổi: ${err.message}`,
    });
  } finally {
    session.endSession();
  }
};

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
      const result = await InitialPlannedCost.deleteMany(
        { department: { $in: departmentIds } },
        { session },
      );
      deletedCount = result.deletedCount;

      if (deletedCount === 0) {
        throw new Error("Không tìm thấy dữ liệu để xóa cho phân xưởng này");
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

const mongoose = require("mongoose");

// ===== Cấp 0: departments + tổng cost + khoảng tháng (đã có, chỉ gọn lại) =====
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

    const basePipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$department",
          totalInitialPlannedCost: { $sum: "$totalInitialPlannedCost" },
          minMonth: { $min: "$month" },
          maxMonth: { $max: "$month" },
        },
      },
    ];

    const countResult = await InitialPlannedCost.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);
    const totalItems = countResult[0]?.total || 0;

    const results = await InitialPlannedCost.aggregate([
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
      totalInitialPlannedCost: r.totalInitialPlannedCost,
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

// ===== Cấp 1: các tháng trong 1 department or  productionScope =====
exports.getMonths = async (req, res) => {
  try {
    const { department, productionScope } = req.query;
    if (!department) {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu department" });
    }

    const matchStage = { department: new mongoose.Types.ObjectId(department) };
    if (productionScope) {
      matchStage.productionScope = new mongoose.Types.ObjectId(productionScope);
    }

    const results = await InitialPlannedCost.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$month",
          totalMonthCost: { $sum: "$totalInitialPlannedCost" },
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

// ===== Cấp 2: các diện (productionScope) trong 1 department + 1 tháng =====
exports.getScopesByMonth = async (req, res) => {
  try {
    const { department, month } = req.query;
    if (!department || !month) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu department hoặc month",
      });
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
          _id: "$productionScope",
          totalInitialPlannedCost: { $sum: "$totalInitialPlannedCost" },
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

    const data = results.map((r) => ({
      _id: r._id, // dùng làm khoá đại diện cho group (productionScope) khi cần xoá/sửa cả nhóm
      productionScope: {
        _id: r.productionScope._id,
        code: r.productionScope.code,
        name: r.productionScope.name,
      },
      totalInitialPlannedCost: r.totalInitialPlannedCost,
    }));

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ===== Cấp 3: các phase thuộc 1 department + 1 tháng + 1 diện =====
exports.getPhasesByScope = async (req, res) => {
  try {
    const { department, month, productionScope } = req.query;
    if (!department || !month || !productionScope) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu department, month hoặc productionScope",
      });
    }

    const docs = await InitialPlannedCost.find({
      department,
      month,
      productionScope,
    })
      .populate("phase", "code name")
      .populate({ path: "assignmentNormCode", select: "code" })
      .populate({ path: "adjustmentNormCode", select: "code" })
      .populate({
        path: "initialPlannedCostDetails.assignmentCode",
        select: "code name uom",
        populate: { path: "uom", select: "name" },
      })
      .lean();

    const data = docs.map((d) => ({
      ...d,
      key: d._id.toString(),
    }));

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getScopesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const scopes = await InitialPlannedCost.find({ department: departmentId })
      .populate("productionScope", "code name")
      .lean();

    const uniqueScopes = [];
    const scopeSet = new Set();
    for (const doc of scopes) {
      if (
        doc.productionScope &&
        !scopeSet.has(doc.productionScope._id.toString())
      ) {
        scopeSet.add(doc.productionScope._id.toString());
        uniqueScopes.push(doc.productionScope);
      }
    }
    res.status(200).json({ status: "success", data: uniqueScopes });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    // 2. Thực hiện query với Populate
    // Lấy tất cả dữ liệu liên quan mà không cần nhóm, nhưng giới hạn theo phân trang
    const scopeId = req.params.productionScope;
    const departmentId = req.query.department;

    const query = { productionScope: scopeId };
    if (departmentId) {
      query.department = departmentId;
    }

    const modelQuery = InitialPlannedCost.find(query)
      .populate({
        path: "productionScope",
        select: "code name",
      })
      .populate("phases.phase", "code name")
      .populate({
        path: "phases.initialPlannedCostDetails.assignmentCode", // Đường dẫn lồng
        select: "code name uom", // Chọn các trường bạn muốn hiển thị ở Frontend
        populate: "uom",
      })
      .populate({
        path: "phases.assignmentNormCode",
        select: "norms code",
        populate: [{ path: "norms.assignmentCode", populate: "uom" }],
      })
      .populate({
        path: "phases.adjustmentNormCode",
        select: "norms code",
        populate: [{ path: "norms.assignmentCode", populate: "uom" }],
      });
    // Thêm các populate còn thiếu

    const allDocs = await modelQuery.lean().exec(); // Dùng .lean() để tăng hiệu suất
    if (allDocs.length === 0) {
      return res.status(404).json({
        status: "error",
        message:
          "Không tìm thấy dữ liệu InitialPlannedCost cho phạm vi sản xuất này.",
      });
    }
    // 3. Xử lý dữ liệu bằng JavaScript để nhóm
    let data = {
      _id: scopeId,
      productionScope: allDocs[0]?.productionScope,
      group: [],
    };

    for (const doc of allDocs) {
      // Thêm dữ liệu vào mảng 'group'
      data.group.push({
        _id: doc._id,
        month: doc.month,
        totalInitialPlannedCost: doc.totalInitialPlannedCost,
        phases: doc.phases.map((phaseItem) => ({
          ...phaseItem,
          key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`,
        })),
      });
    }

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};
