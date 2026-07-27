const mongoose = require('mongoose');

const mirrorRatioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tỷ lệ than mềm là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MirrorRatio', mirrorRatioSchema);
