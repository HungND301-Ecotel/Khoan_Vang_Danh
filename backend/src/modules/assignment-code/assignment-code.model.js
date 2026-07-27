const mongoose = require('mongoose');

const assignmentCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã giao khoán là bắt buộc'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên giao khoán là bắt buộc'],
    },
    uom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },
    deviceCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceCode',
    },
    price: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AssignmentCode', assignmentCodeSchema);
