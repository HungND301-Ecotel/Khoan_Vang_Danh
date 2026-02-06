const mongoose = require("mongoose");

const MaterialBudget = new mongoose.Schema(
  {
    productionScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionScope",
      required: [true, "ProductionScope is required"],
    },
    month: String,
    phases: [
      {
        phase: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Phase",
          required: [true, "Phase is required"],
        },
        production: {
          type: Number,
        },
        unit: {
          type: String,
        },
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
        totalBudgetCost: Number,
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
      },
    ],
    totalBudgetCost: Number,
  },
  {
    timestamps: true,
  },
);

MaterialBudget.pre("save", async function (next) {
  const newMonth = this.month; // Ví dụ: "2025-12"
  const currentScope = this.productionScope;

  // 2. Xây dựng truy vấn để tìm các tài liệu xung đột
  const conflictQuery = {
    _id: { $ne: this._id },
    productionScope: currentScope,
    month: newMonth,
  };

  try {
    const existingDocument =
      await mongoose.models.MaterialBudget.findOne(conflictQuery);

    // 3. Xử lý kết quả truy vấn
    if (existingDocument) {
      // Nếu tìm thấy tài liệu xung đột
      const error = new Error("Thời gian không hợp lệ.");
      return next(error);
    }
    next();
  } catch (error) {
    // Xử lý lỗi trong quá trình truy vấn
    next(error);
  }
});
const MaterialBudgetModel = mongoose.model("MaterialBudget", MaterialBudget);

// Thêm dòng này để xóa index cũ
MaterialBudgetModel.collection
  .dropIndex("code_1")
  .then(() => console.log("Đã xóa index code_1 thành công"))
  .catch((err) => console.log("Index không tồn tại hoặc lỗi:", err.message));

module.exports = MaterialBudgetModel;
