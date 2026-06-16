const mongoose = require("mongoose");

const Department = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Mã phân xưởng là bắt buộc"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Tên phân xưởng là bắt buộc"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Department", Department);
