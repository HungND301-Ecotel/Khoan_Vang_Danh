const MaterialBudget = require("../model/MaterialBudget");
const MaterialAssignment = require("../model/MaterialAssignment");
const {
  updatePriceAssignmentCode,
} = require("../utils/recalculateAssignmentCodePrice");
const ProductionScope = require("../model/ProductionScope");
const Department = require("../model/Department");

const monthToNumber = (month) => (month ? Number(month.replace("-", "")) : "");

exports.create = async (req, res) => {
  try {
    const {
      code,
      phaseGroup,
      phase,
      assignmentNormCode,
      adjustmentNormCode,
      production,
    } = req.body;
    const newMaterialBudget = new MaterialBudget({
      code,
      phaseGroup,
      phase,
      assignmentNormCode,
      adjustmentNormCode,
      production,
    });
    await newMaterialBudget.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await MaterialBudget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updateData) {
      return res.status(404).json({ status: "error", message: "Sửa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Sửa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleteData = await MaterialBudget.findByIdAndDelete(req.params.id);
    if (!deleteData) {
      return res.status(404).json({ status: "error", message: "Xóa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
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
          totalBudgetCost: { $sum: "$totalBudgetCost" },
          minMonth: { $min: "$month" },
          maxMonth: { $max: "$month" },
        },
      },
    ];

    const countResult = await MaterialBudget.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);
    const totalItems = countResult[0]?.total || 0;

    const results = await MaterialBudget.aggregate([
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
      totalBudgetCost: r.totalBudgetCost,
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

    const results = await MaterialBudget.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$month",
          totalMonthCost: { $sum: "$totalBudgetCost" },
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

    const results = await MaterialBudget.aggregate([
      {
        $match: {
          department: new mongoose.Types.ObjectId(department),
          month,
        },
      },
      {
        $group: {
          _id: "$productionScope",
          totalBudgetCost: { $sum: "$totalBudgetCost" },
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
      totalBudgetCost: r.totalBudgetCost,
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

    const docs = await MaterialBudget.find({
      department,
      month,
      productionScope,
    })
      .populate("phase", "code name")
      .populate({ path: "assignmentNormCode", select: "code" })
      .populate({ path: "adjustmentNormCode", select: "code" })
      .populate({
        path: "budgetCostDetails.assignmentCode",
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

exports.getOne = async (req, res) => {
  try {
    const materialbudget = await MaterialBudget.findById(req.params.id)
      .populate("phase")
      .populate({
        path: "assignmentNormCode",
        populate: {
          path: "norms.assignmentCode",
          populate: {
            path: "uom",
          },
        },
      })
      .populate({
        path: "adjustmentNormCode",
        populate: {
          path: "norms.assignmentCode",
          populate: {
            path: "uom",
          },
        },
      });

    const assignmentNorms = materialbudget.assignmentNormCode?.norms || [];
    const adjustmentNorms = materialbudget.adjustmentNormCode?.norms || [];
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

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
      }).populate("uom");

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

      const matchedDetail = (materialbudget.budgetCostDetails || []).find(
        (d) =>
          (d.assignmentCode?._id || d.assignmentCode)?.toString() ===
          assignment._id.toString(),
      );
      const extraQuantity = matchedDetail?.extraQuantity || 0;
      const cost = (quantity + extraQuantity) * (assignment.price || 0);

      result.push({
        _id: assignment._id,
        name: assignment.name,
        code: assignment.code,
        uom: assignment.uom?.name,
        price: assignment.price,
        assignmentNorm: norm?.norm,
        adjustmentNorm: adjustmentNorm?.norm,
        totalNorm: totalNorm,
        quantity: quantity,
        extraQuantity: extraQuantity,
        cost: cost,
        materials: materialsWithPrice,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        materialbudget,
        assignments: result,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateExtraQuantity = async (req, res) => {
  try {
    const {
      id,
      productionScope,
      department,
      month,
      phase,
      assignmentCodeId,
      extraQuantity,
    } = req.body;

    if (!assignmentCodeId) {
      return res.status(400).json({
        status: "error",
        message: "Tham số assignmentCodeId là bắt buộc.",
      });
    }

    let budgetDoc;
    if (id) {
      budgetDoc = await MaterialBudget.findById(id);
    } else if (productionScope && department && month && phase) {
      budgetDoc = await MaterialBudget.findOne({
        productionScope,
        department,
        month,
        phase,
      });
    } else {
      return res.status(400).json({
        status: "error",
        message:
          "Cần truyền id hoặc bộ 4 tham số (productionScope, department, month, phase).",
      });
    }

    if (!budgetDoc) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy bản ghi MaterialBudget.",
      });
    }

    const detailItem = (budgetDoc.budgetCostDetails || []).find((detail) => {
      const detailCodeId = detail.assignmentCode?._id
        ? detail.assignmentCode._id.toString()
        : detail.assignmentCode?.toString();
      return detailCodeId === assignmentCodeId.toString();
    });

    if (!detailItem) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy mã giao khoán trong MaterialBudget.",
      });
    }

    detailItem.extraQuantity = Number(extraQuantity) || 0;
    detailItem.cost =
      ((detailItem.quantity || 0) + detailItem.extraQuantity) *
      (detailItem.price || 0);

    budgetDoc.totalBudgetCost = (budgetDoc.budgetCostDetails || []).reduce(
      (sum, item) => sum + (item.cost || 0),
      0,
    );

    await budgetDoc.save();

    res.status(200).json({
      status: "success",
      message: "Cập nhật số lượng ngoài khoán thành công.",
      data: budgetDoc,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};
