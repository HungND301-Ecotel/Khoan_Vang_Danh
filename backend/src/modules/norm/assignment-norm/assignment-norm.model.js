const mongoose = require('mongoose');

const assignmentNormSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã định mức giao khoán là bắt buộc'],
      unique: true,
      trim: true,
    },
    phaseGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhaseGroup',
    },
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Phase',
    },
    excavationTech: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExcavationTech',
    },
    step: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step',
    },
    length: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Length',
    },
    crossSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CrossSection',
    },
    curbSlope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CurbSlope',
    },
    hardness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardness',
    },
    thickness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thickness',
    },
    type: {
      type: String,
      enum: {
        values: ['cutting', 'excavation', 'coal_kb', 'coal_zh', 'coal_zry'],
        message: 'Loại không hợp lệ: {VALUE}',
      },
    },
    norms: [
      {
        assignmentCode: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AssignmentCode',
        },
        norm: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AssignmentNorm', assignmentNormSchema);
