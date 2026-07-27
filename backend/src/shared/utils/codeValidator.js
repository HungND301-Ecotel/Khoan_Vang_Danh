const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cache models để không phải load lại mỗi lần gọi
let cachedModels = null;

/**
 * Load tất cả models có field 'code' từ thư mục model
 */
const loadModels = () => {
  if (cachedModels) return cachedModels;

  const modelsDir = path.join(__dirname, '../../modules');
  cachedModels = [];

  // Scan tất cả module folders
  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.model.js')) {
        try {
          const model = require(fullPath);
          if (model.schema && model.schema.paths.code) {
            cachedModels.push({
              name: model.modelName,
              model,
            });
          }
        } catch (err) {
          // Skip files that can't be loaded
        }
      }
    }
  };

  // Also scan old model directory for backward compatibility
  const oldModelsDir = path.join(__dirname, '../../../model');
  if (fs.existsSync(oldModelsDir)) {
    fs.readdirSync(oldModelsDir).forEach((file) => {
      if (file.endsWith('.js') && file !== 'index.js') {
        try {
          const model = require(path.join(oldModelsDir, file));
          if (model.schema && model.schema.paths.code) {
            cachedModels.push({
              name: model.modelName,
              model,
            });
          }
        } catch (err) {
          // Skip
        }
      }
    });
  }

  scanDir(modelsDir);
  return cachedModels;
};

/**
 * Kiểm tra code có trùng lặp toàn hệ thống không
 * @param {string} code - Mã cần kiểm tra
 * @param {string} excludeId - ID cần bỏ qua (khi update)
 * @param {string} currentModelName - Tên model hiện tại
 * @returns {Promise<{isDuplicate: boolean, collectionName: string|null}>}
 */
const checkUniqueCode = async (code, excludeId = null, currentModelName = null) => {
  if (!code) return { isDuplicate: false, collectionName: null };

  const models = loadModels();
  const searchCode = { $regex: `^${code.trim()}$`, $options: 'i' };

  // Các model cho phép trùng code nội bộ
  const allowedInternalDuplicateModels = ['MaterialAssignment'];

  for (const { name, model } of models) {
    // Skip self-check cho models cho phép duplicate nội bộ
    if (name === currentModelName && allowedInternalDuplicateModels.includes(name)) {
      continue;
    }

    const query = { code: searchCode };
    if (excludeId && name === currentModelName) {
      query._id = { $ne: excludeId };
    }

    const exists = await model.findOne(query).select('_id code').lean();
    if (exists) {
      return { isDuplicate: true, collectionName: name };
    }
  }

  return { isDuplicate: false, collectionName: null };
};

/**
 * Reset cache (dùng khi test)
 */
const resetCache = () => {
  cachedModels = null;
};

module.exports = {
  checkUniqueCode,
  resetCache,
};
