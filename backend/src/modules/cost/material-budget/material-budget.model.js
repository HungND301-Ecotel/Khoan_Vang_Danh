const mongoose = require('mongoose');

const materialBudgetSchema = new mongoose.Schema(
  {
    productionScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionScope',
      required: [true, 'ProductionScope is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    month: String,
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Phase',
      required: [true, 'Phase is required'],
    },
    production: Number,
    unit: String,
    assignmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignmentNorm',
      required: [true, 'AssignmentNorm is required'],
    },
    adjustmentNormCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdjustmentNorm',
      required: [true, 'AdjustmentNorm is required'],
    },
    budgetCostDetails: [
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
    ],
    totalBudgetCost: Number,
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: ngăn trùng (productionScope + department + month + phase)
 */
materialBudgetSchema.pre('save', async function (next) {
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
    const existingDocument = await mongoose.models.MaterialBudget.findOne(conflictQuery);
    if (existingDocument) {
      const error = new Error('Diện + Khâu này trong tháng không hợp lệ.');
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Drop old code_1 index on startup
 */
materialBudgetSchema.statics.dropOldIndexes = async function () {
  try {
    await this.collection.dropIndex('code_1');
    console.log('Đã xóa index code_1 thành công');
  } catch (err) {
    // Index có thể không tồn tại, bỏ qua
  }
};

module.exports = mongoose.model('MaterialBudget', materialBudgetSchema);
