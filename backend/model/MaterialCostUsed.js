const mongoose = require("mongoose");

const MaterialCostUsed = new mongoose.Schema(
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
    totalUsedCost: Number,
    materials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MaterialAssignment",
        },
        assignmentCode: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AssignmentCode",
        },
        quantity: Number,
        price: Number,
        cost: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

MaterialCostUsed.pre("save", async function (next) {
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
      await mongoose.models.MaterialCostUsed.findOne(conflictQuery);
    if (existingDocument) {
      const error = new Error("Diện + Khâu này trong tháng đã tồn tại");
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const MaterialCostUsedModel = mongoose.model(
  "MaterialCostUsed",
  MaterialCostUsed,
);

MaterialCostUsedModel.collection
  .dropIndex("code_1")
  .then(() => console.log("Đã xóa index code_1 thành công"))
  .catch((err) => console.log("Index không tồn tại hoặc lỗi:", err.message));

module.exports = MaterialCostUsedModel;
