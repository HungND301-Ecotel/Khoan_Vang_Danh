const mongoose = require('mongoose');

const phaseGroupSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã nhóm công đoạn là bắt buộc'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên nhóm công đoạn là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PhaseGroup', phaseGroupSchema);
