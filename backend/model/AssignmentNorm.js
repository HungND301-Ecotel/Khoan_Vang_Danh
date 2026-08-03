const mongoose = require("mongoose");

const AssignmentNorm = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "code is required"],
    },
    year: {
      type: Number,
      required: [true, "year is required"],
    },
    phaseGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhaseGroup",
    },
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Phase",
    },
    excavationTech: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExcavationTech",
    },
    step: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Step",
    },
    length: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Length",
    },
    cutting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cutting",
    },
    crossSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrossSection",
    },
    curbSlope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CurbSlope",
    },
    hardness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hardness",
    },
    thickness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thickness",
    },
    type: {
      type: String,
      enum: ["cutting", "excavation", "coal_kb", "coal_zh", "coal_zry"],
    },
    startMonth: String,
    endMonth: String,
    norms: [
      {
        assignmentCode: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AssignmentCode",
          required: [true, "AssignmentCode is required"],
        },
        norm: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);
AssignmentNorm.index({ code: 1 });

const monthToNumber = (month) => {
  if (!month) return null;
  return Number(month.replace("-", ""));
};

const checkOverlap = async (doc, model) => {
  if (!doc.startMonth || !doc.endMonth) return;

  const newStart = monthToNumber(doc.startMonth);
  const newEnd = monthToNumber(doc.endMonth);

  if (newStart > newEnd) {
    throw new Error(
      `Khoảng thời gian không hợp lệ: ${doc.startMonth} > ${doc.endMonth}`,
    );
  }

  const conflictQuery = {
    _id: { $ne: doc._id },
    type: doc.type,
    year: doc.year,
    startMonth: { $exists: true, $ne: null, $ne: "" },
    endMonth: { $exists: true, $ne: null, $ne: "" },
  };

  if (doc.type === "cutting") {
    if (doc.phaseGroup) conflictQuery.phaseGroup = doc.phaseGroup;
    if (doc.phase) conflictQuery.phase = doc.phase;
    if (doc.excavationTech) conflictQuery.excavationTech = doc.excavationTech;
    if (doc.step) conflictQuery.step = doc.step;
    if (doc.length) conflictQuery.length = doc.length;
    if (doc.cutting) conflictQuery.cutting = doc.cutting;
  } else if (doc.type === "excavation") {
    if (doc.phaseGroup) conflictQuery.phaseGroup = doc.phaseGroup;
    if (doc.phase) conflictQuery.phase = doc.phase;
    if (doc.excavationTech) conflictQuery.excavationTech = doc.excavationTech;
    if (doc.step) conflictQuery.step = doc.step;
    if (doc.length) conflictQuery.length = doc.length;
    if (doc.crossSection) conflictQuery.crossSection = doc.crossSection;
  } else if (["coal_kb", "coal_zh", "coal_zry"].includes(doc.type)) {
    if (doc.curbSlope) conflictQuery.curbSlope = doc.curbSlope;
    if (doc.hardness) conflictQuery.hardness = doc.hardness;
    if (doc.thickness) conflictQuery.thickness = doc.thickness;
  }

  const existingDocs = await model.find(conflictQuery);

  for (const existing of existingDocs) {
    const oldStart = monthToNumber(existing.startMonth);
    const oldEnd = monthToNumber(existing.endMonth);

    if (newStart <= oldEnd && newEnd >= oldStart) {
      throw new Error(
        `Khoảng thời gian bị trùng hoặc chồng chéo với định mức ${existing.code} (${existing.startMonth} -> ${existing.endMonth}).`,
      );
    }
  }
};

AssignmentNorm.pre("save", async function (next) {
  try {
    await checkOverlap(this, this.constructor);
    next();
  } catch (error) {
    next(error);
  }
});

AssignmentNorm.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate();
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) return next();

    const mergedDoc = { ...docToUpdate.toObject() };

    // Merge updates
    const updateFields = update.$set || update;
    for (const key in updateFields) {
      if (!key.startsWith("$")) {
        mergedDoc[key] = updateFields[key];
      }
    }

    // Convert ObjectIds to strings for accurate comparisons if they were updated
    for (const key of [
      "phaseGroup",
      "phase",
      "excavationTech",
      "step",
      "length",
      "cutting",
      "crossSection",
      "curbSlope",
      "hardness",
      "thickness",
    ]) {
      if (mergedDoc[key] && mergedDoc[key]._id)
        mergedDoc[key] = mergedDoc[key]._id;
      if (mergedDoc[key] && typeof mergedDoc[key] === "object")
        mergedDoc[key] = mergedDoc[key].toString();
    }

    await checkOverlap(mergedDoc, this.model);
    next();
  } catch (error) {
    next(error);
  }
});

const AssignmentNormModel = mongoose.model("AssignmentNorm", AssignmentNorm);
const dropOldIndexes = async () => {
  try {
    // Chờ kết nối DB sẵn sàng
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) =>
        mongoose.connection.once("connected", resolve),
      );
    }

    const collection = AssignmentNormModel.collection;
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

module.exports = AssignmentNormModel;
