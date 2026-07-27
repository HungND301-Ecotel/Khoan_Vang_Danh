const BaseService = require('../../../shared/base/BaseService');
const AdjustmentNorm = require('./adjustment-norm.model');
const AssignmentCode = require('../../assignment-code/assignment-code.model');
const Hardness = require('../../reference/hardness/hardness.model');
const RockRatio = require('../../reference/rock-ratio/rock-ratio.model');
const MirrorRatio = require('../../reference/mirror-ratio/mirror-ratio.model');
const { checkUniqueCode } = require('../../../shared/utils/codeValidator');
const ConflictError = require('../../../shared/exceptions/ConflictError');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');
const ValidationError = require('../../../shared/exceptions/ValidationError');
const mongoose = require('mongoose');

/**
 * Lấy tên cột Excel từ số (1-based)
 * @param {number} col - Số thứ tự cột (1 = A, 2 = B, ...)
 * @returns {string} Tên cột Excel
 */
const getColumnName = (col) => {
  let name = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    col = Math.floor((col - 1) / 26);
  }
  return name;
};

class AdjustmentNormService extends BaseService {
  constructor() {
    super(AdjustmentNorm);
  }

  async create(data) {
    const { code } = data;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      'AdjustmentNorm'
    );
    if (isDuplicate)
      throw new ConflictError(
        `Mã điều chỉnh '${code}' đã tồn tại trong hệ thống`
      );
    return await this.model.create(data);
  }

  async update(id, data) {
    const { code } = data;
    if (code) {
      const { isDuplicate, collectionName } = await checkUniqueCode(
        code,
        id,
        'AdjustmentNorm'
      );
      if (isDuplicate)
        throw new ConflictError(
          `Mã điều chỉnh '${code}' đã tồn tại trong hệ thống`
        );
    }
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true });
    if (!doc) throw new NotFoundError('Không tìm thấy điều chỉnh định mức');
    return doc;
  }

  async getPaginated(query) {
    return await super.getPaginated(query, {
      searchFields: ['code'],
      populate: ['hardness', 'rockRatio', 'mirrorRatio', 'norms.assignmentCode'],
      sort: { code: 1 },
    });
  }

  /**
   * Xuất dữ liệu dạng ma trận
   * - Row 1 (ẩn): IDs
   * - Cột A: code
   * - Cột B: type
   * - Cột C/D tùy loại: hardness+rockRatio (CKKT/CKĐL) hoặc mirrorRatio (CM)
   * - Các cột còn lại: norms theo assignmentCode
   * - Cột 200+: dropdown data
   */
  async matrixExport(type = null) {
    // Load all reference data
    const [assignmentCodes, hardnessList, rockRatioList, mirrorRatioList] =
      await Promise.all([
        AssignmentCode.find().sort({ code: 1 }).lean(),
        Hardness.find().sort({ name: 1 }).lean(),
        RockRatio.find().sort({ name: 1 }).lean(),
        MirrorRatio.find().sort({ name: 1 }).lean(),
      ]);

    // Build query filter
    const filter = {};
    if (type) filter.type = type;

    // Load adjustment norms
    const norms = await this.model
      .find(filter)
      .populate('hardness')
      .populate('rockRatio')
      .populate('mirrorRatio')
      .populate('norms.assignmentCode')
      .sort({ code: 1 })
      .lean();

    // Build matrix data
    const matrix = [];

    // Row 0: Headers
    const headers = ['Mã điều chỉnh', 'Loại', 'Độ cứng đá', 'Tỷ lệ đá', 'Tỷ lệ than mềm'];
    // Add assignmentCode columns
    assignmentCodes.forEach((ac) => {
      headers.push(ac.code);
    });
    matrix.push(headers);

    // Row 1 (hidden): IDs
    const idRow = norms.map((n) => String(n._id));
    // Pad to match header length
    while (idRow.length < headers.length) idRow.push('');
    matrix.push(idRow);

    // Data rows
    norms.forEach((norm) => {
      const row = [];
      row.push(norm.code || '');
      row.push(norm.type || '');
      row.push(norm.hardness?.name || '');
      row.push(norm.rockRatio?.name || '');
      row.push(norm.mirrorRatio?.name || '');

      // Map norms to assignmentCode columns
      const normMap = new Map(
        (norm.norms || []).map((n) => [
          String(n.assignmentCode?._id || n.assignmentCode),
          n.norm,
        ])
      );
      assignmentCodes.forEach((ac) => {
        row.push(normMap.get(String(ac._id)) ?? '');
      });

      matrix.push(row);
    });

    // Build dropdown data in columns 200+ (column indices: 200=GR, etc.)
    const dropdowns = {
      types: ['CM', 'CKKT', 'CKĐL'],
      hardness: hardnessList.map((h) => h.name),
      rockRatio: rockRatioList.map((r) => r.name),
      mirrorRatio: mirrorRatioList.map((m) => m.name),
    };

    return { matrix, dropdowns, assignmentCodes, norms };
  }

  /**
   * Nhập dữ liệu từ ma trận
   * - Row 1 (ẩn): IDs
   * - Row 2+: dữ liệu
   * - Hỗ trợ upsert theo code+type khi không có ID
   */
  async matrixImport(matrix, type = null) {
    if (!matrix || matrix.length < 2) {
      throw new ValidationError('File không chứa dữ liệu hợp lệ');
    }

    const headerRow = matrix[0];
    const idRow = matrix[1];
    const dataRows = matrix.slice(2);

    // Load reference data for mapping
    const [assignmentCodes, hardnessList, rockRatioList, mirrorRatioList] =
      await Promise.all([
        AssignmentCode.find().lean(),
        Hardness.find().lean(),
        RockRatio.find().lean(),
        MirrorRatio.find().lean(),
      ]);

    // Build lookup maps
    const hardnessMap = new Map(hardnessList.map((h) => [h.name, h._id]));
    const rockRatioMap = new Map(rockRatioList.map((r) => [r.name, r._id]));
    const mirrorRatioMap = new Map(
      mirrorRatioList.map((m) => [m.name, m._id])
    );
    const assignmentCodeMap = new Map(
      assignmentCodes.map((ac) => [ac.code, ac._id])
    );

    const operations = [];
    const invalidRows = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowIndex = i + 3; // Excel row number (1-based, +2 for header+id row)

      try {
        // Extract basic fields
        const code = row[0] ? String(row[0]).trim() : null;
        const rowType = row[1] ? String(row[1]).trim() : type;
        const hardnessName = row[2] ? String(row[2]).trim() : null;
        const rockRatioName = row[3] ? String(row[3]).trim() : null;
        const mirrorRatioName = row[4] ? String(row[4]).trim() : null;

        if (!code) {
          invalidRows.push({ row: rowIndex, error: 'Mã điều chỉnh là bắt buộc' });
          continue;
        }

        if (!rowType) {
          invalidRows.push({ row: rowIndex, error: 'Loại là bắt buộc' });
          continue;
        }

        // Map reference fields
        let hardnessId = null;
        let rockRatioId = null;
        let mirrorRatioId = null;

        if (rowType === 'CKKT' || rowType === 'CKĐL') {
          if (hardnessName) {
            hardnessId = hardnessMap.get(hardnessName);
            if (!hardnessId) {
              invalidRows.push({
                row: rowIndex,
                error: `Độ cứng đá không tồn tại: ${hardnessName}`,
              });
              continue;
            }
          }
          if (rockRatioName) {
            rockRatioId = rockRatioMap.get(rockRatioName);
            if (!rockRatioId) {
              invalidRows.push({
                row: rowIndex,
                error: `Tỷ lệ đá không tồn tại: ${rockRatioName}`,
              });
              continue;
            }
          }
        } else if (rowType === 'CM') {
          if (mirrorRatioName) {
            mirrorRatioId = mirrorRatioMap.get(mirrorRatioName);
            if (!mirrorRatioId) {
              invalidRows.push({
                row: rowIndex,
                error: `Tỷ lệ than mềm không tồn tại: ${mirrorRatioName}`,
              });
              continue;
            }
          }
        }

        // Map norms (columns 5+)
        const norms = [];
        for (let j = 5; j < headerRow.length; j++) {
          const acCode = headerRow[j] ? String(headerRow[j]).trim() : null;
          const normValue = row[j];

          if (!acCode) continue;

          const acId = assignmentCodeMap.get(acCode);
          if (!acId) {
            invalidRows.push({
              row: rowIndex,
              error: `Mã giao khoán không tồn tại: ${acCode}`,
            });
            continue;
          }

          if (normValue !== null && normValue !== undefined && normValue !== '') {
            const numValue = Number(normValue);
            if (isNaN(numValue)) {
              invalidRows.push({
                row: rowIndex,
                error: `Giá trị định mức không hợp lệ tại cột ${acCode}: ${normValue}`,
              });
              continue;
            }
            norms.push({ assignmentCode: acId, norm: numValue });
          }
        }

        // Check unique code
        const { isDuplicate, collectionName } = await checkUniqueCode(
          code,
          null,
          'AdjustmentNorm'
        );

        // Build update data
        const updateData = {
          code,
          type: rowType,
          norms,
        };

        if (rowType === 'CKKT' || rowType === 'CKĐL') {
          updateData.hardness = hardnessId;
          updateData.rockRatio = rockRatioId;
          updateData.mirrorRatio = null;
        } else if (rowType === 'CM') {
          updateData.mirrorRatio = mirrorRatioId;
          updateData.hardness = null;
          updateData.rockRatio = null;
        }

        // Check for existing ID from hidden row
        const existingId =
          idRow[i] && String(idRow[i]).trim().length === 24
            ? String(idRow[i]).trim()
            : null;

        if (existingId) {
          // Update by ID
          if (isDuplicate) {
            // Check if duplicate is self
            const existing = await this.model.findById(existingId).lean();
            if (existing && existing.code.toLowerCase() === code.toLowerCase()) {
              // Same record, allow update
            } else {
              invalidRows.push({
                row: rowIndex,
                error: `Mã đã tồn tại trong danh mục ${collectionName}: ${code}`,
              });
              continue;
            }
          }
          operations.push({
            updateOne: {
              filter: { _id: existingId },
              update: { $set: updateData },
            },
          });
        } else {
          // Upsert by code+type
          if (isDuplicate) {
            // Check if existing record has same code+type
            const existing = await this.model
              .findOne({ code: { $regex: `^${code}$`, $options: 'i' }, type: rowType })
              .lean();
            if (existing) {
              // Same code+type, update
              operations.push({
                updateOne: {
                  filter: { _id: existing._id },
                  update: { $set: updateData },
                },
              });
            } else {
              invalidRows.push({
                row: rowIndex,
                error: `Mã đã tồn tại trong danh mục ${collectionName}: ${code}`,
              });
              continue;
            }
          } else {
            // Insert new
            operations.push({ insertOne: { document: updateData } });
          }
        }
      } catch (err) {
        invalidRows.push({ row: rowIndex, error: err.message });
      }
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await this.model.bulkWrite(operations);
    }

    return {
      totalProcessed: dataRows.length,
      insertedCount: bulkResult?.insertedCount || 0,
      updatedCount: bulkResult?.modifiedCount || 0,
      deletedCount: bulkResult?.deletedCount || 0,
      invalidCount: invalidRows.length,
      invalidRows,
    };
  }
}

module.exports = AdjustmentNormService;
