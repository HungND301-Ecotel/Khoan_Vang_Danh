const mongoose = require("mongoose");
const dayjs = require("dayjs");

const MaterialAssignment = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "code is required"],
    },
    name: {
      type: String,
      required: [true, "MaterialAssignment name is required"],
    },
    uom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
    assignmentCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignmentCode",
    },
    quantity: {
      type: Number,
    },
    priceHistory: [
      {
        startDate: String,        // "dd/MM/yyyy"
        endDate: String,          // "dd/MM/yyyy"
        executionPrice: Number,   // Đơn giá thực hiện
        plannedPrice: Number,     // Đơn giá kế hoạch
      },
    ],
  },
  {
    timestamps: true,
  },
);
const monthToNumber = (month) => {
  if (!month) return null;
  return Number(month.replace("-", ""));
};

const dateToNumber = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const num = Number(`${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`);
  return isNaN(num) ? null : num;
};

const normalizeItem = (item) => {
  // nếu là mongoose subdocument
  if (item && typeof item.toObject === "function") {
    return item.toObject();
  }
  return item;
};

const validatePriceHistory = (priceHistory) => {
  if (!Array.isArray(priceHistory)) return;

  const normalized = priceHistory.map((item) => {
    const obj = normalizeItem(item);
    return {
      ...obj,
      _start: dateToNumber(obj.startDate),
      _end: dateToNumber(obj.endDate),
    };
  });

  // 1️⃣ start <= end
  for (const item of normalized) {
    if (item._start > item._end) {
      throw new Error(
        `Khoảng thời gian không hợp lệ: ${item.startDate} > ${item.endDate}`,
      );
    }
  }

  // 2️⃣ sort
  normalized.sort((a, b) => a._start - b._start);

  // 3️⃣ overlap
  for (let i = 0; i < normalized.length - 1; i++) {
    if (normalized[i + 1]._start <= normalized[i]._end) {
      throw new Error(
        `Khoảng thời gian bị trùng hoặc chồng chéo:
                ${normalized[i].startDate}->${normalized[i].endDate}
                và
                ${normalized[i + 1].startDate}->${normalized[i + 1].endDate}`,
      );
    }
  }
};

MaterialAssignment.pre("save", function (next) {
  try {
    validatePriceHistory(this.priceHistory);
    next();
  } catch (err) {
    next(err);
  }
});

MaterialAssignment.pre("findOneAndUpdate", function (next) {
  try {
    const update = this.getUpdate();

    const priceHistory = update?.priceHistory || update?.$set?.priceHistory;

    if (priceHistory) {
      validatePriceHistory(priceHistory);
    }

    next();
  } catch (err) {
    next(err);
  }
});

const MaterialAssignmentModel = mongoose.model(
  "MaterialAssignment",
  MaterialAssignment,
);

const dropOldIndexes = async () => {
  try {
    // Chờ kết nối DB sẵn sàng
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) =>
        mongoose.connection.once("connected", resolve),
      );
    }

    const collection = MaterialAssignmentModel.collection;
    const currentIndexes = await collection.indexes();
    const indexNames = currentIndexes.map((idx) => idx.name);

    if (indexNames.includes("code_1")) {
      await collection.dropIndex("code_1");
      console.log("--- [SYSTEM] Đã xóa index unique cũ: code_1");
    }

    if (indexNames.includes("name_1")) {
      await collection.dropIndex("name_1");
      console.log("--- [SYSTEM] Đã xóa index unique cũ: name_1");
    }
  } catch (error) {
    if (error.codeName !== "IndexNotFound") {
      console.error("--- [SYSTEM] Lỗi khi xử lý index:", error.message);
    }
  }
};

// Thực thi
dropOldIndexes();

// Export model duy nhất
module.exports = MaterialAssignmentModel;
