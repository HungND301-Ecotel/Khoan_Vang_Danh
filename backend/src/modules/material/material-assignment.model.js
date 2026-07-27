const mongoose = require('mongoose');
const { monthToNumber } = require('../../shared/utils/priceCalculator');

const priceHistoryItemSchema = new mongoose.Schema(
  {
    price: { type: Number },
    startMonth: { type: String },
    endMonth: { type: String },
  },
  { _id: false }
);

const materialAssignmentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã vật tư là bắt buộc'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên vật tư là bắt buộc'],
    },
    uom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },
    assignmentCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignmentCode',
    },
    quantity: {
      type: Number,
    },
    priceHistory: [priceHistoryItemSchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Validate priceHistory: startMonth <= endMonth và không trùng khoảng thời gian
 */
function validatePriceHistory(priceHistory) {
  if (!Array.isArray(priceHistory) || priceHistory.length === 0) return;

  for (let i = 0; i < priceHistory.length; i++) {
    const item = priceHistory[i];
    if (!item.startMonth || !item.endMonth) continue;

    const startNum = monthToNumber(item.startMonth);
    const endNum = monthToNumber(item.endMonth);

    if (startNum !== null && endNum !== null && startNum > endNum) {
      throw new Error(
        `Lỗi priceHistory: startMonth (${item.startMonth}) phải nhỏ hơn hoặc bằng endMonth (${item.endMonth})`
      );
    }
  }

  // Kiểm tra trùng khoảng thời gian
  const sorted = priceHistory
    .filter((item) => item.startMonth && item.endMonth)
    .map((item) => ({
      start: monthToNumber(item.startMonth),
      end: monthToNumber(item.endMonth),
    }))
    .sort((a, b) => a.start - b.start);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start <= sorted[i - 1].end) {
      throw new Error(
        'Lỗi priceHistory: Các khoảng thời gian không được trùng lặp'
      );
    }
  }
}

// Pre-save hook
materialAssignmentSchema.pre('save', function (next) {
  try {
    validatePriceHistory(this.priceHistory);
    next();
  } catch (err) {
    next(err);
  }
});

// Pre-findOneAndUpdate hook
materialAssignmentSchema.pre('findOneAndUpdate', function (next) {
  try {
    const update = this.getUpdate();
    const priceHistory =
      update?.priceHistory || update?.$set?.priceHistory;
    if (priceHistory) {
      validatePriceHistory(priceHistory);
    }
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Drop old indexes on code/name on startup
 */
materialAssignmentSchema.statics.dropOldIndexes = async function () {
  try {
    const indexes = await this.collection.indexes();
    for (const idx of indexes) {
      const key = Object.keys(idx.key);
      if (
        key.length === 1 &&
        (key[0] === 'code' || key[0] === 'name') &&
        idx.name !== '_id'
      ) {
        await this.collection.dropIndex(idx.name);
        console.log(`Dropped old index: ${idx.name}`);
      }
    }
  } catch (err) {
    // Index có thể không tồn tại, bỏ qua
  }
};

module.exports = mongoose.model(
  'MaterialAssignment',
  materialAssignmentSchema
);
