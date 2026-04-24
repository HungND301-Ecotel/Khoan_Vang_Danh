const mongoose = require("mongoose");

const SystemConfig = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Key is required"],
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Value is required"],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SystemConfig", SystemConfig);
