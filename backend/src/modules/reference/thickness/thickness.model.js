const mongoose = require('mongoose');

const thicknessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên độ dày vỉa than là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Thickness', thicknessSchema);
