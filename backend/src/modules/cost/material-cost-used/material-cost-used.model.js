const mongoose = require('mongoose');

const materialCostUsedSchema = new mongoose.Schema(
  {
    productionScope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionScope',
      required: [true, 'Diện sản xuất là bắt buộc'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Phân xưởng là bắt buộc'],
    },
    month: String,
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Phase',
      required: [true, 'Khâu là bắt buộc'],
    },
    production: Number,
    unit: String,
    totalUsedCost: Number,
    materials: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MaterialAssignment',
        },
        assignmentCode: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AssignmentCode',
        },
        quantity: Number,
        price: Number,
        cost: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

materialCostUsedSchema.pre('save', async function (next) {
  const conflictQuery = {
    _id: { $ne: this._id },
    productionScope: this.productionScope,
    department: this.department,
    month: this.month,
    phase: this.phase,
  };

  try {
    const existingDocument = await mongoose.models.MaterialCostUsed.findOne(conflictQuery);
    if (existingDocument) {
      return next(new Error('Diện + Khâu này trong tháng đã tồn tại'));
    }
    next();
  } catch (error) {
    next(error);
  }
});

const MaterialCostUsedModel = mongoose.model('MaterialCostUsed', materialCostUsedSchema);

// Drop old code_1 index on startup
MaterialCostUsedModel.collection
  .dropIndex('code_1')
  .then(() => console.log('Đã xóa index code_1 thành công'))
  .catch((err) => console.log('Index không tồn tại hoặc lỗi:', err.message));

module.exports = MaterialCostUsedModel;
