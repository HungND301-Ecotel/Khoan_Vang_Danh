const mongoose = require('mongoose');

const excavationTechSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên công nghệ đào lò là bắt buộc'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ExcavationTech', excavationTechSchema);
