const BaseService = require('../../../shared/base/BaseService');
const AssignmentNorm = require('./assignment-norm.model');
const AssignmentCode = require('../../assignment-code/assignment-code.model');
const Phase = require('../../reference/phase/phase.model');
const ExcavationTech = require('../../reference/excavation-tech/excavation-tech.model');
const Step = require('../../reference/step/step.model');
const Hardness = require('../../reference/hardness/hardness.model');
const CrossSection = require('../../reference/cross-section/cross-section.model');
const Thickness = require('../../reference/thickness/thickness.model');
const CurbSlope = require('../../reference/curb-slope/curb-slope.model');
const Length = require('../../reference/length/length.model');
const PhaseGroup = require('../../reference/phase-group/phaseGroup.model');
const { checkUniqueCode } = require('../../../shared/utils/codeValidator');
const ConflictError = require('../../../shared/exceptions/ConflictError');
const NotFoundError = require('../../../shared/exceptions/NotFoundError');
const ValidationError = require('../../../shared/exceptions/ValidationError');
const mongoose = require('mongoose');

/**
 * Chuyển đổi chỉ số cột (1-based) sang ký hiệu cột Excel (A, B, ..., Z, AA, AB, ...)
 * @param {number} colIndex - Chỉ số cột (1-based)
 * @returns {string} Ký hiệu cột Excel
 */
const getColumnName = (colIndex) => {
  let name = '';
  let index = colIndex;
  while (index > 0) {
    const remainder = (index - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    index = Math.floor((index - 1) / 26);
  }
  return name;
};

/**
 * Cấu hình các dòng thuộc tính theo từng loại norm
 * Mỗi dòng bao gồm: header (tên hiển thị), field (trường trong model),
 * model (model Mongoose), displayField (trường hiển thị trong model)
 */
const getRowConfigs = (type) => {
  const commonConfigs = {
    phaseGroup: { header: 'Nhóm công đoạn', field: 'phaseGroup', model: PhaseGroup, displayField: 'name' },
    phase: { header: 'Công đoạn', field: 'phase', model: Phase, displayField: 'name' },
    excavationTech: { header: 'Công nghệ xúc', field: 'excavationTech', model: ExcavationTech, displayField: 'name' },
    step: { header: 'Bước chống giữ', field: 'step', model: Step, displayField: 'name' },
    hardness: { header: 'Độ cứng đá', field: 'hardness', model: Hardness, displayField: 'name' },
    crossSection: { header: 'Tiết diện', field: 'crossSection', model: CrossSection, displayField: 'name' },
    thickness: { header: 'Độ dày vỉa', field: 'thickness', model: Thickness, displayField: 'name' },
    curbSlope: { header: 'Độ dốc vỉa', field: 'curbSlope', model: CurbSlope, displayField: 'name' },
    length: { header: 'Chiều dài', field: 'length', model: Length, displayField: 'name' },
  };

  switch (type) {
    case 'excavation':
      return [
        commonConfigs.phaseGroup,
        commonConfigs.phase,
        commonConfigs.excavationTech,
        commonConfigs.step,
      ];
    case 'cutting':
      return [
        commonConfigs.phaseGroup,
        commonConfigs.phase,
        commonConfigs.hardness,
        commonConfigs.crossSection,
      ];
    case 'coal_kb':
    case 'coal_zh':
    case 'coal_zry':
      return [
        commonConfigs.hardness,
        commonConfigs.thickness,
        commonConfigs.curbSlope,
        commonConfigs.length,
      ];
    default:
      return [];
  }
};

class AssignmentNormService extends BaseService {
  constructor() {
    super(AssignmentNorm);
  }

  async create(data) {
    const { code } = data;
    const { isDuplicate } = await checkUniqueCode(code, null, 'AssignmentNorm');
    if (isDuplicate) throw new ConflictError(`Mã định mức giao khoán '${code}' đã tồn tại trong hệ thống`);
    return await this.model.create(data);
  }

  async update(id, data) {
    const { code } = data;
    if (code) {
      const { isDuplicate } = await checkUniqueCode(code, id, 'AssignmentNorm');
      if (isDuplicate) throw new ConflictError(`Mã định mức giao khoán '${code}' đã tồn tại trong hệ thống`);
    }
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true });
    if (!doc) throw new NotFoundError('Không tìm thấy định mức giao khoán');
    return doc;
  }

  async getPaginated(query) {
    const { type, ...restQuery } = query;
    const filter = {};
    if (type) filter.type = type;

    const result = await super.getPaginated({ ...restQuery, ...filter }, {
      searchFields: ['code'],
      populate: [
        'phaseGroup', 'phase', 'excavationTech', 'step',
        'hardness', 'crossSection', 'thickness', 'curbSlope', 'length',
        'norms.assignmentCode',
      ],
      sort: { code: 1 },
    });

    return result;
  }

  /**
   * Import matrix Excel: mỗi cột là 1 bản ghi, mỗi dòng là 1 thuộc tính
   * Dòng đầu ẩn (row 1) chứa ID của các bản ghi hiện có
   * Các dòng tiếp theo là thuộc tính (Phase, ExcavationTech, ...)
   * Các dòng cuối là định mức (norms) theo từng AssignmentCode
   *
   * @param {Buffer} buffer - File Excel buffer
   * @param {string} type - Loại norm (excavation, cutting, coal_kb, coal_zh, coal_zry)
   * @returns {Object} Kết quả import
   */
  async matrixImport(buffer, type) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new ValidationError('Không tìm thấy sheet dữ liệu');

    const rowConfigs = getRowConfigs(type);
    if (rowConfigs.length === 0) throw new ValidationError('Loại định mức không hợp lệ');

    // Lấy danh sách AssignmentCode để map norms
    const assignmentCodes = await AssignmentCode.find().sort({ code: 1 }).lean();
    const assignmentCodeMap = new Map(assignmentCodes.map(ac => [ac._id.toString(), ac]));

    // Đọc hidden row 1 - chứa ID của các bản ghi
    const idRow = worksheet.getRow(1);
    const ids = [];
    let colIndex = 2; // Cột A là header, bắt đầu từ cột B
    while (true) {
      const cellValue = idRow.getCell(colIndex).value;
      if (cellValue === null || cellValue === undefined || cellValue === '') break;
      ids.push(String(cellValue).trim());
      colIndex++;
    }
    const totalColumns = colIndex - 1; // Số cột dữ liệu (không tính header)

    // Lấy tên hiển thị cho FK từ dropdown lists ở hidden columns (từ cột 200+)
    // Các dropdown list được đặt ở cột xa bên phải để không ảnh hưởng dữ liệu
    // Row 1 là hidden ID row, row 2+ là thuộc tính, nên dropdown header bắt đầu từ row 2
    const dropdownData = {};
    const hiddenColStart = 200;
    for (let ri = 0; ri < rowConfigs.length; ri++) {
      const config = rowConfigs[ri];
      const rowNum = ri + 2; // Row 1 là hidden ID, row 2 bắt đầu thuộc tính
      const headerCell = worksheet.getCell(rowNum, hiddenColStart);
      const headerValue = String(headerCell.value || '').trim();
      if (headerValue === config.header) {
        dropdownData[config.field] = [];
        let dr = rowNum + 1;
        while (true) {
          const cellVal = worksheet.getCell(dr, hiddenColStart).value;
          if (cellVal === null || cellVal === undefined || cellVal === '') break;
          // Hidden col 201 chứa ID tương ứng
          const idVal = worksheet.getCell(dr, hiddenColStart + 1).value;
          dropdownData[config.field].push({
            name: String(cellVal).trim(),
            id: idVal ? String(idVal).trim() : null,
          });
          dr++;
        }
      }
    }

    // Xây dựng dữ liệu từ matrix
    const operations = [];
    const invalidRows = [];

    // Duyệt từng cột dữ liệu (từ cột 2)
    for (let c = 2; c <= totalColumns + 1; c++) {
      try {
        const recordId = ids[c - 2] || null;
        const recordData = { type };

        // Đọc thuộc tính từ các dòng (row 1 là hidden ID, row 2 bắt đầu thuộc tính)
        let isEmptyRecord = true;
        for (let r = 0; r < rowConfigs.length; r++) {
          const config = rowConfigs[r];
          const rowNum = r + 2; // Row 1 là hidden ID, row 2 bắt đầu thuộc tính
          const cellValue = worksheet.getCell(rowNum, c).value;
          const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';

          if (cellStr) isEmptyRecord = false;

          // Lookup ID từ dropdown data
          if (cellStr && dropdownData[config.field]) {
            const found = dropdownData[config.field].find(d => d.name === cellStr);
            if (found && found.id) {
              recordData[config.field] = found.id;
            } else if (cellStr) {
              // Tìm trực tiếp trong DB
              const modelDoc = await config.model.findOne({ name: cellStr }).lean();
              if (modelDoc) {
                recordData[config.field] = modelDoc._id.toString();
              }
            }
          }
        }

        // Đọc norms từ các dòng AssignmentCode (bắt đầu sau các dòng thuộc tính)
        // Row 1: hidden ID, row 2..(rowConfigs.length+1): thuộc tính, row (rowConfigs.length+2)+: norms
        const normsStartRow = rowConfigs.length + 2;
        recordData.norms = [];
        for (let ar = 0; ar < assignmentCodes.length; ar++) {
          const rowNum = normsStartRow + ar;
          const cellValue = worksheet.getCell(rowNum, c).value;
          const normValue = cellValue !== null && cellValue !== undefined && cellValue !== ''
            ? Number(cellValue)
            : null;
          if (normValue !== null && !isNaN(normValue)) {
            isEmptyRecord = false;
            recordData.norms.push({
              assignmentCode: assignmentCodes[ar]._id,
              norm: normValue,
            });
          }
        }

        // Bỏ qua cột trống hoàn toàn
        if (isEmptyRecord && !recordId) continue;

        // Nếu có ID và cột trống -> xóa bản ghi
        if (recordId && isEmptyRecord) {
          if (recordId.length === 24) {
            operations.push({ deleteOne: { filter: { _id: recordId } } });
          }
          continue;
        }

        // Validate code
        if (!recordData.code) {
          // Tự sinh code nếu không có
          recordData.code = `ANK-${Date.now()}-${c}`;
        }

        if (recordId && recordId.length === 24) {
          // Update
          operations.push({
            updateOne: {
              filter: { _id: recordId },
              update: { $set: recordData },
            },
          });
        } else {
          // Insert
          const { isDuplicate } = await checkUniqueCode(recordData.code, null, 'AssignmentNorm');
          if (isDuplicate) {
            invalidRows.push({ column: c, error: `Mã '${recordData.code}' đã tồn tại` });
            continue;
          }
          operations.push({ insertOne: { document: recordData } });
        }
      } catch (err) {
        invalidRows.push({ column: c, error: err.message });
      }
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await this.model.bulkWrite(operations);
    }

    return {
      totalProcessed: totalColumns,
      insertedCount: bulkResult?.insertedCount || 0,
      updatedCount: bulkResult?.modifiedCount || 0,
      deletedCount: bulkResult?.deletedCount || 0,
      invalidCount: invalidRows.length,
      invalidRows,
    };
  }

  /**
   * Export matrix Excel: mỗi cột là 1 bản ghi, mỗi dòng là 1 thuộc tính
   * Row 1 (ẩn) chứa ID
   * Các dòng tiếp theo là thuộc tính
   * Các dòng cuối là norms
   * Hidden columns (từ col 200+) chứa dropdown lists
   *
   * @param {string} type - Loại norm
   * @returns {Buffer} File Excel buffer
   */
  async matrixExport(type) {
    const ExcelJS = require('exceljs');
    const rowConfigs = getRowConfigs(type);
    if (rowConfigs.length === 0) throw new ValidationError('Loại định mức không hợp lệ');

    // Lấy danh sách AssignmentCode
    const assignmentCodes = await AssignmentCode.find().sort({ code: 1 }).lean();

    // Lấy dữ liệu theo type
    const data = await this.model.find({ type })
      .populate('phaseGroup', 'name')
      .populate('phase', 'name')
      .populate('excavationTech', 'name')
      .populate('step', 'name')
      .populate('hardness', 'name')
      .populate('crossSection', 'name')
      .populate('thickness', 'name')
      .populate('curbSlope', 'name')
      .populate('length', 'name')
      .populate('norms.assignmentCode', 'code name')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DinhMucGiaoKhoan');

    const totalRows = rowConfigs.length + assignmentCodes.length;

    // Row 1: Header labels (cột A)
    // Hidden row 1: IDs
    const idRow = worksheet.getRow(1);
    idRow.hidden = true;

    // Ghi header cho từng dòng thuộc tính
    for (let r = 0; r < rowConfigs.length; r++) {
      const rowNum = r + 2; // Bắt đầu từ dòng 2
      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = rowConfigs[r].header;
      row.getCell(1).font = { bold: true };
    }

    // Ghi header cho các dòng norms
    for (let ar = 0; ar < assignmentCodes.length; ar++) {
      const rowNum = rowConfigs.length + 2 + ar;
      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = assignmentCodes[ar].name || assignmentCodes[ar].code;
      row.getCell(1).font = { bold: true };
    }

    // Ghi dữ liệu cho từng bản ghi (mỗi bản ghi = 1 cột)
    for (let i = 0; i < data.length; i++) {
      const colIndex = i + 2; // Cột B bắt đầu từ index 2
      const record = data[i];

      // Hidden row 1: ID
      idRow.getCell(colIndex).value = record._id.toString();

      // Các dòng thuộc tính
      for (let r = 0; r < rowConfigs.length; r++) {
        const config = rowConfigs[r];
        const rowNum = r + 2;
        const cell = worksheet.getRow(rowNum).getCell(colIndex);

        const fkValue = record[config.field];
        if (fkValue && typeof fkValue === 'object' && fkValue[config.displayField]) {
          cell.value = fkValue[config.displayField];
        } else if (fkValue) {
          cell.value = String(fkValue);
        }
      }

      // Các dòng norms
      const normsMap = new Map();
      if (record.norms && Array.isArray(record.norms)) {
        for (const n of record.norms) {
          const acId = n.assignmentCode?._id?.toString() || n.assignmentCode?.toString();
          if (acId) normsMap.set(acId, n.norm);
        }
      }

      for (let ar = 0; ar < assignmentCodes.length; ar++) {
        const rowNum = rowConfigs.length + 2 + ar;
        const cell = worksheet.getRow(rowNum).getCell(colIndex);
        const acId = assignmentCodes[ar]._id.toString();
        const normValue = normsMap.get(acId);
        if (normValue !== undefined && normValue !== null) {
          cell.value = normValue;
        }
      }
    }

    // Thêm dropdown lists vào hidden columns (từ cột 200+)
    const hiddenColStart = 200;
    for (let ri = 0; ri < rowConfigs.length; ri++) {
      const config = rowConfigs[ri];
      const headerRow = ri + 1;

      // Lấy toàn bộ dữ liệu FK từ DB
      const allDocs = await config.model.find().sort({ name: 1 }).lean();

      // Header ở hidden column
      worksheet.getCell(headerRow, hiddenColStart).value = config.header;

      // Dữ liệu dropdown
      for (let di = 0; di < allDocs.length; di++) {
        const rowNum = headerRow + 1 + di;
        worksheet.getCell(rowNum, hiddenColStart).value = allDocs[di][config.displayField] || allDocs[di].name;
        worksheet.getCell(rowNum, hiddenColStart + 1).value = allDocs[di]._id.toString();
      }

      // Ẩn cột dropdown
      worksheet.getColumn(hiddenColStart).hidden = true;
      worksheet.getColumn(hiddenColStart + 1).hidden = true;
    }

    // Thêm dropdown list cho AssignmentCode ở hidden column
    const acHeaderRow = 1;
    const acHiddenCol = hiddenColStart + 10;
    worksheet.getCell(acHeaderRow, acHiddenCol).value = 'Mã giao khoán';
    for (let ai = 0; ai < assignmentCodes.length; ai++) {
      worksheet.getCell(acHeaderRow + 1 + ai, acHiddenCol).value = assignmentCodes[ai].name || assignmentCodes[ai].code;
      worksheet.getCell(acHeaderRow + 1 + ai, acHiddenCol + 1).value = assignmentCodes[ai]._id.toString();
    }
    worksheet.getColumn(acHiddenCol).hidden = true;
    worksheet.getColumn(acHiddenCol + 1).hidden = true;

    // Format header column (cột A)
    const headerCol = worksheet.getColumn(1);
    headerCol.width = 20;
    headerCol.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Format data cells
    for (let c = 2; c <= data.length + 1; c++) {
      const col = worksheet.getColumn(c);
      col.width = 15;
    }

    // Format tất cả cells với border
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (!cell.font || !cell.font.bold) {
          cell.font = { size: 9 };
        }
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Thêm data validation cho các ô dữ liệu (dropdown từ hidden columns)
    const lastDataRow = rowConfigs.length + 1;
    const lastDataCol = data.length + 1;
    for (let ri = 0; ri < rowConfigs.length; ri++) {
      const rowNum = ri + 2;
      const allDocs = await rowConfigs[ri].model.find().sort({ name: 1 }).lean();
      if (allDocs.length > 0) {
        const startColLetter = getColumnName(hiddenColStart);
        const endColLetter = getColumnName(hiddenColStart);
        const startRow = ri + 2;
        const endRow = ri + 1 + allDocs.length;
        const formula = `=${startColLetter}${startRow}:${endColLetter}${endRow}`;

        for (let c = 2; c <= lastDataCol; c++) {
          try {
            worksheet.getRow(rowNum).getCell(c).dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [formula],
              showErrorMessage: true,
              errorTitle: 'Lỗi',
              error: 'Vui lòng chọn từ danh sách',
            };
          } catch (e) {
            // Bỏ qua lỗi data validation
          }
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = AssignmentNormService;
