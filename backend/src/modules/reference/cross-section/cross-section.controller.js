const BaseController = require('../../../shared/base/BaseController');
const CrossSectionService = require('./cross-section.service');
const { createWorkbook, formatForExport, readExcelFromBuffer, sendExcelResponse } = require('../../../shared/utils/excelHelper');
const Unit = require('../unit/unit.model');

class CrossSectionController extends BaseController {
  constructor() {
    super(new CrossSectionService());
  }

  import = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
      const columnMapping = { 'Tiết diện lò xén': 'name', 'ĐVT': 'uom', '_id': '_id', 'id': '_id', 'uom': 'ignored' };
      const { error, data } = readExcelFromBuffer(req.file.buffer, columnMapping);
      if (error) return res.status(400).json({ status: 'error', message: error });
      const dataImport = data.filter(r => r._id || r.name);
      if (dataImport.length === 0) return res.status(400).json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ' });
      const result = await this.service.importData(dataImport);
      res.status(200).json({ status: 'success', message: 'Import thành công', summary: result });
    } catch (error) { next(error); }
  };

  export = async (req, res, next) => {
    try {
      const data = await this.service.exportData();
      const columns = [
        { header: 'Tiết diện lò xén', key: 'name', width: 30 },
        { header: 'ĐVT', key: 'uom', width: 20 },
        { header: '_id', key: '_id', width: 20 },
      ];
      const { workbook, worksheet } = createWorkbook(columns, data, 'cross_section');
      const idColIndex = worksheet.columns.findIndex(c => c && c.key === '_id') + 1;
      if (idColIndex > 0) worksheet.getColumn(idColIndex).hidden = true;

      // Add dropdown for unit column
      const units = await Unit.find();
      const unitList = [...new Set(units.map(u => u.name).filter(Boolean))];
      worksheet.getColumn('X').values = ['uom', ...unitList];
      worksheet.getColumn('X').hidden = true;
      const uomColLetter = worksheet.getColumn(2).letter;
      const MAX = Math.max(worksheet.rowCount + 100, 1000);
      worksheet.dataValidations.add(`${uomColLetter}2:${uomColLetter}${MAX}`, {
        type: 'list', allowBlank: true, formulae: [`=$X$2:$X$${unitList.length + 1}`],
      });

      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'cross_section.xlsx');
    } catch (error) { next(error); }
  };
}

module.exports = CrossSectionController;
