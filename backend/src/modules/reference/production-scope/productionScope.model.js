const mongoose = require('mongoose');

const productionScopeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã phạm vi sản xuất là bắt buộc'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên phạm vi sản xuất là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProductionScope', productionScopeSchema);
