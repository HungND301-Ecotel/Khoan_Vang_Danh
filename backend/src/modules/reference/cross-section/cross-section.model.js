const mongoose = require('mongoose');

const crossSectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tiết diện là bắt buộc'],
      unique: true,
      trim: true,
    },
    uom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CrossSection', crossSectionSchema);
