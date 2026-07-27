const mongoose = require('mongoose');

const rockRatioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tỷ lệ đá là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RockRatio', rockRatioSchema);
