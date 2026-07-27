const mongoose = require('mongoose');

const normItemSchema = new mongoose.Schema(
  {
    assignmentCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignmentCode',
    },
    norm: {
      type: Number,
    },
  },
  { _id: false }
);

const adjustmentNormSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã điều chỉnh là bắt buộc'],
      unique: true,
      trim: true,
    },
    hardness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardness',
    },
    rockRatio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RockRatio',
    },
    mirrorRatio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MirrorRatio',
    },
    type: {
      type: String,
      enum: {
        values: ['CM', 'CKKT', 'CKĐL'],
        message: 'Loại phải là CM, CKKT hoặc CKĐL',
      },
      required: [true, 'Loại là bắt buộc'],
    },
    norms: [normItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdjustmentNorm', adjustmentNormSchema);
