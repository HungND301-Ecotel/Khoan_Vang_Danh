const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã công đoạn là bắt buộc'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên công đoạn là bắt buộc'],
      unique: true,
      trim: true,
    },
    phaseGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhaseGroup',
      required: [true, 'Nhóm công đoạn là bắt buộc'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Phase', phaseSchema);
