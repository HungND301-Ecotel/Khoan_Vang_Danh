const mongoose = require("mongoose");

const Unit = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Unit name is required"],
      unique: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Unit", Unit);
