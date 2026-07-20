const mongoose = require("mongoose");

const InitialPlannedCost = new mongoose.Schema(
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
    month: {
      type: String,
      required: [true, "month is required"],
    },
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
    },
    adjustmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdjustmentNorm",
    },
    initialPlannedCostDetails: [
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
    totalInitialPlannedCost: Number,
  },
  {
    timestamps: true,
  },
);

InitialPlannedCost.pre("save", async function (next) {
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
      await mongoose.models.InitialPlannedCost.findOne(conflictQuery);
    if (existingDocument) {
      const error = new Error("Diện + Khâu này trong tháng đã tồn tại.");
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("InitialPlannedCost", InitialPlannedCost);
