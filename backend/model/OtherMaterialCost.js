const mongoose = require("mongoose");

const OtherMaterialCost = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    month: String,
    date: Number,
    shift: Number,
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

OtherMaterialCost.pre("save", async function (next) {
  const conflictQuery = {
    _id: { $ne: this._id },
    department: this.department,
    month: this.month,
    date: this.date,
    shift: this.shift,
  };

  try {
    const existingDocument =
      await mongoose.models.OtherMaterialCost.findOne(conflictQuery);
    if (existingDocument) {
      const error = new Error("Ngày + Ca này trong tháng đã tồn tại");
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const OtherMaterialCostModel = mongoose.model(
  "OtherMaterialCost",
  OtherMaterialCost,
);

module.exports = OtherMaterialCostModel;
