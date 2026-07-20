const mongoose = require("mongoose");

const MaterialBudget = new mongoose.Schema(
  {
    productionScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionScope",
      required: [true, "ProductionScope is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    month: String,
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Phase",
      required: [true, "Phase is required"],
    },
    production: Number,
    unit: String,
    assignmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignmentNorm",
      required: [true, "AssignmentNorm is required"],
    },
    adjustmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdjustmentNorm",
      required: [true, "AdjustmentNorm is required"],
    },
    budgetCostDetails: [
      {
        assignmentCode: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AssignmentCode",
        },
        baseNorm: Number,
        adjustmentNorm: Number,
        norm: Number,
        quantity: Number,
        price: Number,
        cost: Number,
      },
    ],
    totalBudgetCost: Number,
  },
  {
    timestamps: true,
  },
);

MaterialBudget.pre("save", async function (next) {
  const newMonth = this.month;
  const currentScope = this.productionScope;
  const currentDepartment = this.department;
  const currentPhase = this.phase;

  const conflictQuery = {
    _id: { $ne: this._id },
    productionScope: currentScope,
    department: currentDepartment,
    month: newMonth,
    phase: currentPhase,
  };

  try {
    const existingDocument =
      await mongoose.models.MaterialBudget.findOne(conflictQuery);
    if (existingDocument) {
      const error = new Error("Diện + Khâu này trong tháng không hợp lệ.");
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const MaterialBudgetModel = mongoose.model("MaterialBudget", MaterialBudget);

MaterialBudgetModel.collection
  .dropIndex("code_1")
  .then(() => console.log("Đã xóa index code_1 thành công"))
  .catch((err) => console.log("Index không tồn tại hoặc lỗi:", err.message));

module.exports = MaterialBudgetModel;
