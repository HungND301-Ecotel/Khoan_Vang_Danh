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

exports.get = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let scopeMatchQuery = {};

    if (req.query.q) {
      const departments = await Department.find({
        code: new RegExp(req.query.q, "i"),
      }).select("_id");
      const departmentIds = departments.map((i) => i?._id);
      scopeMatchQuery.department = { $in: departmentIds };
    }

    if (req.query.department) {
      scopeMatchQuery.department = req.query.department;
    }

    const uniqueDepartmentIds = await MaterialBudget.distinct(
      "department",
      scopeMatchQuery,
    );

    const totalItems = uniqueDepartmentIds.length;

    const paginatedDepartmentIds = uniqueDepartmentIds.slice(skip, skip + limit);

    const targetDepartments = await Department.find({
      _id: { $in: paginatedDepartmentIds },
    })
      .select("code name")
      .lean()
      .exec();

    const matchQuery = { department: { $in: paginatedDepartmentIds } };

    const allDocs = await MaterialBudget.find(matchQuery)
      .populate({
        path: "productionScope",
        select: "code name",
      })
      .populate({
        path: "department",
        select: "code name",
      })
      .populate("phases.phase", "code name")
      .populate({
        path: "phases.budgetCostDetails.assignmentCode",
        select: "code name uom",
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
      })
      .lean()
      .exec();

    const groupedMap = new Map();

    for (const dept of targetDepartments) {
      groupedMap.set(dept?._id.toString(), {
        _id: dept?._id.toString(),
        department: dept,
        minMonth: null,
        maxMonth: null,
        totalBudgetCost: 0,
        monthGroups: {},
      });
    }

    for (const doc of allDocs) {
      const deptId = doc.department?._id?.toString();

      if (groupedMap.has(deptId)) {
        const deptGroup = groupedMap.get(deptId);

        const currentMonthDate = new Date(doc.month + "-01");
        if (
          !deptGroup.minMonth ||
          currentMonthDate < new Date(deptGroup.minMonth + "-01")
        ) {
          deptGroup.minMonth = doc.month;
        }
        if (
          !deptGroup.maxMonth ||
          currentMonthDate > new Date(deptGroup.maxMonth + "-01")
        ) {
          deptGroup.maxMonth = doc.month;
        }

        deptGroup.totalBudgetCost += doc.totalBudgetCost || 0;

        if (!deptGroup.monthGroups[doc.month]) {
          deptGroup.monthGroups[doc.month] = {
            _id: doc.month,
            month: doc.month,
            totalMonthCost: 0,
            scopes: [],
          };
        }

        const monthGroup = deptGroup.monthGroups[doc.month];
        monthGroup.totalMonthCost += doc.totalBudgetCost || 0;

        monthGroup.scopes.push({
          _id: doc._id,
          productionScope: doc.productionScope,
          totalBudgetCost: doc.totalBudgetCost,
          phases: doc.phases?.map((phaseItem) => ({
            ...phaseItem,
            key: `${doc._id.toString()}_${phaseItem.phase?._id?.toString()}`,
          })),
        });
      }
    }

    const results = Array.from(groupedMap.values()).map((item) => {
      const formatMonth = (m) => {
        if (!m) return "";
        const [y, mm] = m.split("-");
        return `${mm}/${y}`;
      };

      const monthsArray = Object.values(item.monthGroups).sort((a, b) => {
        return new Date(b.month + "-01") - new Date(a.month + "-01");
      });

      return {
        _id: item._id,
        department: item.department,
        totalBudgetCost: item.totalBudgetCost,
        month: `${formatMonth(item.minMonth)} -> ${formatMonth(item.maxMonth)}`,
        months: monthsArray,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);
    const pagination = {
      data: results,
      page: page,
      totalDocs: totalItems,
      totalPages: totalPages,
    };

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.error(err.stack); // Dùng console.error để theo dõi lỗi
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
