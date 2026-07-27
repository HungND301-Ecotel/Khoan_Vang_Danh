const mongoose = require('mongoose');

const materialItemSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaterialAssignment',
    },
    quantity: {
      type: Number,
    },
    price: Number,
    cost: Number,
  },
  { _id: false }
);

const otherMaterialCostSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    month: String,
    totalUsedCost: Number,
    materials: [materialItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OtherMaterialCost', otherMaterialCostSchema);
