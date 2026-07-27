const mongoose = require('mongoose');

const initialPlannedCostDetailSchema = new mongoose.Schema(
  {
    assignmentCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignmentCode',
    },
    baseNorm: Number,
    adjustmentNorm: Number,
    norm: Number,
    quantity: Number,
    price: Number,
    cost: Number,
  },
  { _id: false }
);

const initialPlannedCostSchema = new mongoose.Schema(
  {
    productionScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionScope',
      required: [true, 'Phạm vi sản xuất là bắt buộc'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Phân xưởng là bắt buộc'],
    },
    month: {
      type: String,
      required: [true, 'Tháng là bắt buộc'],
    },
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Phase',
      required: [true, 'Công đoạn là bắt buộc'],
    },
    production: Number,
    unit: String,
    assignmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignmentNorm',
    },
    adjustmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdjustmentNorm',
    },
    initialPlannedCostDetails: [initialPlannedCostDetailSchema],
    totalInitialPlannedCost: Number,
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: ngăn trùng lặp (productionScope + department + month + phase)
 */
initialPlannedCostSchema.pre('save', async function (next) {
  const conflictQuery = {
    _id: { $ne: this._id },
    productionScope: this.productionScope,
    department: this.department,
    month: this.month,
    phase: this.phase,
  };

  try {
    const existing = await mongoose.models.InitialPlannedCost.findOne(conflictQuery);
    if (existing) {
      const error = new Error('Diện + Khâu này trong tháng đã tồn tại.');
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('InitialPlannedCost', initialPlannedCostSchema);
