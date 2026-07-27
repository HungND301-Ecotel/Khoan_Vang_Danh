const mongoose = require('mongoose');

const hardnessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên độ cứng đá là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hardness', hardnessSchema);
