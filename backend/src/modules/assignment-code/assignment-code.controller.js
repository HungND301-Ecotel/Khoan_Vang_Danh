const BaseController = require('../../shared/base/BaseController');
const AssignmentCodeService = require('./assignment-code.service');
const { createWorkbook, formatForExport, readExcelFromBuffer, sendExcelResponse } = require('../../shared/utils/excelHelper');
const DeviceCode = require('../reference/device-code/deviceCode.model');
const Unit = require('../reference/unit/unit.model');

class AssignmentCodeController extends BaseController {
  constructor() {
    super(new AssignmentCodeService());
  }

  import = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
      const columnMapping = {
        'Thiết bị': 'deviceCode', 'Mã giao khoán': 'code', 'Tên giao khoán': 'name',
        'ĐVT': 'uom', 'Đơn giá': 'price', '_id': '_id', 'id': '_id',
        'deviceCodes': 'ignored', 'units': 'ignored',
      };
      const { error, data } = readExcelFromBuffer(req.file.buffer, columnMapping);
      if (error) return res.status(400).json({ status: 'error', message: error });
      const dataImport = data.filter(r => r._id || r.code || r.name);
      if (dataImport.length === 0) return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ' });
      const result = await this.service.importData(dataImport);
      res.status(200).json({ status: 'success', message: 'Import mã giao khoán thành công', summary: result });
    } catch (error) { next(error); }
  };

  export = async (req, res, next) => {
    try {
      const data = await this.service.exportData();
      const columns = [
        { header: 'Thiết bị', key: 'deviceCode', width: 20 },
        { header: 'Mã giao khoán', key: 'code', width: 20 },
        { header: 'Tên giao khoán', key: 'name', width: 20 },
        { header: 'ĐVT', key: 'uom', width: 20 },
        { header: 'Đơn giá', key: 'price', width: 20 },
        { header: '_id', key: '_id', width: 20 },
      ];
      const { workbook, worksheet } = createWorkbook(columns, data, 'ma_giao_khoan');
      const idColIndex = worksheet.columns.findIndex(c => c && c.key === '_id') + 1;
      if (idColIndex > 0) worksheet.getColumn(idColIndex).hidden = true;

      // Add dropdowns
      const deviceCodes = await DeviceCode.find();
      const units = await Unit.find();
      const deviceCodeList = [...new Set(deviceCodes.map(p => p.code).filter(Boolean))];
      const unitList = [...new Set(units.map(d => d.name).filter(Boolean))];
      const MAX = Math.max(worksheet.rowCount + 100, 1000);

      worksheet.getColumn('X').values = ['deviceCodes', ...deviceCodeList];
      worksheet.getColumn('Y').values = ['units', ...unitList];
      worksheet.getColumn('X').hidden = true;
      worksheet.getColumn('Y').hidden = true;
      worksheet.dataValidations.add(`A2:A${MAX}`, { type: 'list', allowBlank: true, formulae: [`=$X$2:$X$${deviceCodeList.length + 1}`] });
      worksheet.dataValidations.add(`D2:D${MAX}`, { type: 'list', allowBlank: true, formulae: [`=$Y$2:$Y$${unitList.length + 1}`] });

      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'ma_giao_khoan.xlsx');
    } catch (error) { next(error); }
  };
}

module.exports = AssignmentCodeController;
