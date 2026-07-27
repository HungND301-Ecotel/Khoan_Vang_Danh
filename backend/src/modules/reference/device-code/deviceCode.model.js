const mongoose = require('mongoose');

const deviceCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã thiết bị là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeviceCode', deviceCodeSchema);
