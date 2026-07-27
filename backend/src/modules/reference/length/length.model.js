const mongoose = require('mongoose');

const lengthSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên chiều dài là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Length', lengthSchema);
