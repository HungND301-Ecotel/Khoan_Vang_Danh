const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên bước chống giữ là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Step', stepSchema);
