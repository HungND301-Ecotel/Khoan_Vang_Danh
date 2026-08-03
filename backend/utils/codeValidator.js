const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Tự động load tất cả các model trong thư mục model để kiểm tra
const modelsDir = path.join(__dirname, "../model");
const models = [];

fs.readdirSync(modelsDir).forEach((file) => {
  if (file.endsWith(".js") && file !== "index.js") {
    const modelName = file.replace(".js", "");
    try {
      const model = require(path.join(modelsDir, file));
      if (model.schema && model.schema.paths.code) {
        models.push({ name: modelName, model });
      }
    } catch (err) {
      console.error(`Không thể load model ${modelName}:`, err.message);
    }
  }
});

/**
 * Kiểm tra xem mã (code) đã tồn tại trong bất kỳ collection nào chưa
 * @param {string} code - Mã cần kiểm tra
 * @param {string} excludeId - ID của bản ghi hiện tại (để bỏ qua khi update)
 * @param {string} currentModelName - Tên của model đang gọi hàm này
 * @returns {Promise<{isDuplicate: boolean, collectionName: string | null}>}
 */
const checkUniqueCode = async (
  code,
  excludeId = null,
  currentModelName = null,
) => {
  if (!code) return { isDuplicate: false, collectionName: null };

  const searchCode = { $regex: `^${code.trim()}$`, $options: "i" };

  // Các bảng được phép có mã trùng lặp nội bộ (nhưng vẫn không được trùng với các bảng khác)
  const allowedInternalDuplicateModels = [
    "MaterialAssignment",
    "AssignmentNorm",
  ];

  for (const { name, model } of models) {
    // Nếu bảng đang gọi thuộc diện "cho phép trùng lặp nội bộ" và ta đang xét chính bảng đó -> Bỏ qua check
    if (
      name === currentModelName &&
      allowedInternalDuplicateModels.includes(name)
    ) {
      continue;
    }

    const query = { code: searchCode };
    // Chỉ loại trừ excludeId nếu ta đang query chính model hiện tại
    if (excludeId && name === currentModelName) {
      query._id = { $ne: excludeId };
    }

    const exists = await model.findOne(query).select("_id code").lean();
    if (exists) {
      return { isDuplicate: true, collectionName: name };
    }
  }

  return { isDuplicate: false, collectionName: null };
};

module.exports = { checkUniqueCode };
