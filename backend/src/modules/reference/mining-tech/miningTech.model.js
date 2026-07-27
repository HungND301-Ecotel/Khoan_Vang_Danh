const mongoose = require('mongoose');

const miningTechSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã công nghệ khai thác là bắt buộc'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên công nghệ khai thác là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MiningTech', miningTechSchema);
