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
        },
        adjustmentNormCode: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AdjustmentNorm",
        },
      },
    ],
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
        quantity: {
          type: Number,
        },
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

  // 2. Xây dựng truy vấn để tìm các tài liệu xung đột
  const conflictQuery = {
    _id: { $ne: this._id },
    productionScope: currentScope,
    department: currentDepartment,
    month: newMonth,
  };

  try {
    const existingDocument =
      await mongoose.models.MaterialCostUsed.findOne(conflictQuery);
    // 3. Xử lý kết quả truy vấn
    if (existingDocument) {
      // Nếu tìm thấy tài liệu xung đột
      const error = new Error("Thời gian đã tồn tại");
      return next(error);
    }
    next();
  } catch (error) {
    // Xử lý lỗi trong quá trình truy vấn
    next(error);
  }
});
const MaterialCostUsedModel = mongoose.model(
  "MaterialCostUsed",
  MaterialCostUsed,
);

// Thêm dòng này để xóa index cũ
MaterialCostUsedModel.collection
  .dropIndex("code_1")
  .then(() => console.log("Đã xóa index code_1 thành công"))
  .catch((err) => console.log("Index không tồn tại hoặc lỗi:", err.message));

module.exports = MaterialCostUsedModel;
