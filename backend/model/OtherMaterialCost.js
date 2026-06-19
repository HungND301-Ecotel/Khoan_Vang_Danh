const mongoose = require("mongoose");

const OtherMaterialCost = new mongoose.Schema(
  {
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
      },
    ],
    totalUsedCost: Number,
    materials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MaterialAssignment",
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

const OtherMaterialCostModel = mongoose.model(
  "OtherMaterialCost",
  OtherMaterialCost,
);

module.exports = OtherMaterialCostModel;
