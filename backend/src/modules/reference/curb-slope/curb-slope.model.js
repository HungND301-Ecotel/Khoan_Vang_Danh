const mongoose = require('mongoose');

const curbSlopeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên độ dốc vỉa than là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CurbSlope', curbSlopeSchema);
