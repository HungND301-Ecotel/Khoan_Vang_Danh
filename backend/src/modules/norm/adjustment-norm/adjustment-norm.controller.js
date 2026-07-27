const BaseController = require('../../../shared/base/BaseController');
const AdjustmentNormService = require('./adjustment-norm.service');
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');

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

class AdjustmentNormController extends BaseController {
  constructor() {
    super(new AdjustmentNormService());
  }

  /**
   * Xuất dữ liệu dạng ma trận
   * POST /exportMatrix
   */
  exportMatrix = async (req, res, next) => {
    try {
      const { type } = req.query;
      const { matrix, dropdowns, assignmentCodes, norms } =
        await this.service.matrixExport(type);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Điều chỉnh định mức');

      // Write matrix data
      matrix.forEach((row, rowIndex) => {
        const excelRow = worksheet.addRow(row);
        // Row 1 (index 1) is hidden (IDs)
        if (rowIndex === 1) {
          excelRow.hidden = true;
        }
      });

      // Format header row (row 1 in Excel, index 0 in matrix)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
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

      // Format data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.font = { size: 9 };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
        }
      });

      // Add dropdown data in columns 200+ (column GR onwards)
      const dropdownColStart = 200; // Column GR

      // Column GR: Types
      const typeCol = worksheet.getColumn(dropdownColStart);
      typeCol.values = ['types', ...dropdowns.types];
      typeCol.hidden = true;

      // Column GS: Hardness
      const hardnessCol = worksheet.getColumn(dropdownColStart + 1);
      hardnessCol.values = ['hardness', ...dropdowns.hardness];
      hardnessCol.hidden = true;

      // Column GT: RockRatio
      const rockRatioCol = worksheet.getColumn(dropdownColStart + 2);
      rockRatioCol.values = ['rockRatio', ...dropdowns.rockRatio];
      rockRatioCol.hidden = true;

      // Column GU: MirrorRatio
      const mirrorRatioCol = worksheet.getColumn(dropdownColStart + 3);
      mirrorRatioCol.values = ['mirrorRatio', ...dropdowns.mirrorRatio];
      mirrorRatioCol.hidden = true;

      // Add data validations for dropdowns
      const maxDataRow = Math.max(matrix.length + 100, 1000);
      const typeColName = getColumnName(dropdownColStart);
      const hardnessColName = getColumnName(dropdownColStart + 1);
      const rockRatioColName = getColumnName(dropdownColStart + 2);
      const mirrorRatioColName = getColumnName(dropdownColStart + 3);

      // Type column (B) - all rows
      worksheet.dataValidations.add(`B3:B${maxDataRow}`, {
        type: 'list',
        allowBlank: true,
        formulae: [
          `=$${typeColName}$2:$${typeColName}$${dropdowns.types.length + 1}`,
        ],
      });

      // Hardness column (C) - for CKKT/CKĐL
      worksheet.dataValidations.add(`C3:C${maxDataRow}`, {
        type: 'list',
        allowBlank: true,
        formulae: [
          `=$${hardnessColName}$2:$${hardnessColName}$${dropdowns.hardness.length + 1}`,
        ],
      });

      // RockRatio column (D) - for CKKT/CKĐL
      worksheet.dataValidations.add(`D3:D${maxDataRow}`, {
        type: 'list',
        allowBlank: true,
        formulae: [
          `=$${rockRatioColName}$2:$${rockRatioColName}$${dropdowns.rockRatio.length + 1}`,
        ],
      });

      // MirrorRatio column (E) - for CM
      worksheet.dataValidations.add(`E3:E${maxDataRow}`, {
        type: 'list',
        allowBlank: true,
        formulae: [
          `=$${mirrorRatioColName}$2:$${mirrorRatioColName}$${dropdowns.mirrorRatio.length + 1}`,
        ],
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=dieu_chinh_dinh_muc.xlsx'
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Nhập dữ liệu từ ma trận
   * POST /importMatrix
   */
  importMatrix = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res
          .status(400)
          .json({ status: 'error', message: 'Vui lòng chọn file' });
      }

      const { type } = req.query;

      // Read Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to matrix (array of arrays)
      const matrix = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: null,
      });

      if (!matrix || matrix.length < 2) {
        return res.status(400).json({
          status: 'error',
          message: 'File không chứa dữ liệu hợp lệ',
        });
      }

      const result = await this.service.matrixImport(matrix, type);

      res.status(200).json({
        status: 'success',
        message: 'Import điều chỉnh định mức thành công',
        summary: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AdjustmentNormController;
