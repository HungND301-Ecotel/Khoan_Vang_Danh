const ExcelJS = require('exceljs');
const xlsx = require('xlsx');

/**
 * Tạo workbook Excel từ data
 * @param {Array} columns - [{ header, key, width }]
 * @param {Array} data - Dữ liệu rows
 * @param {string} sheetName - Tên sheet
 * @returns {ExcelJS.Workbook}
 */
const createWorkbook = (columns, data, sheetName = 'Sheet1') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;
  worksheet.addRows(data);

  return { workbook, worksheet };
};

/**
 * Format workbook để export
 * @param {ExcelJS.Workbook} workbook
 * @param {ExcelJS.Worksheet} worksheet
 * @param {Object} options - { headerRowHeight, dataRowHeight }
 * @returns {Buffer}
 */
const formatForExport = async (workbook, worksheet, options = {}) => {
  const { headerRowHeight = 20 } = options;

  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = headerRowHeight;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Đọc file Excel từ buffer
 * @param {Buffer} buffer - File buffer
 * @param {Object} columnMapping - { "Tên cột": "fieldName" }
 * @returns {Object} { headers, data, mappedHeaders }
 */
const readExcelFromBuffer = (buffer, columnMapping) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  let headers = xlsx.utils.sheet_to_json(worksheet, {
    header: 1,
    range: 0,
    raw: true,
  })[0];

  headers = headers.map((h) => String(h).trim());

  // Validate headers
  const allowedHeaders = Object.keys(columnMapping);
  const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h));

  if (invalidHeaders.length > 0) {
    return {
      error: `File không hợp lệ. Các cột sau không được phép: ${invalidHeaders.join(', ')}`,
      headers,
      data: [],
      mappedHeaders: [],
    };
  }

  const mappedHeaders = headers.map((h) => columnMapping[h] || h);

  const data = xlsx.utils.sheet_to_json(worksheet, {
    header: mappedHeaders,
    range: 1,
  });

  return {
    error: null,
    headers,
    data,
    mappedHeaders,
  };
};

/**
 * Gửi file Excel response
 */
const sendExcelResponse = (res, buffer, filename) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(buffer);
};

module.exports = {
  createWorkbook,
  formatForExport,
  readExcelFromBuffer,
  sendExcelResponse,
};
