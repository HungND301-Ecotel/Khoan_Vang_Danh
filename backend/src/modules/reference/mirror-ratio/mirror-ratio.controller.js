const BaseController = require('../../../shared/base/BaseController');
const MirrorRatioService = require('./mirror-ratio.service');
const { createWorkbook, formatForExport, readExcelFromBuffer, sendExcelResponse } = require('../../../shared/utils/excelHelper');

class MirrorRatioController extends BaseController {
  constructor() {
    super(new MirrorRatioService());
  }

  import = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file' });
      const columnMapping = { 'Tỷ lệ than mềm': 'name', '_id': '_id', 'id': '_id' };
      const { error, data } = readExcelFromBuffer(req.file.buffer, columnMapping);
      if (error) return res.status(400).json({ status: 'error', message: error });
      const dataImport = data.filter(r => r._id || r.name);
      if (dataImport.length === 0) return res.status(400).json({ status: 'error', message: 'Không có dữ liệu hợp lệ' });
      const result = await this.service.importData(dataImport);
      res.status(200).json({ status: 'success', message: 'Import thành công', summary: result });
    } catch (error) { next(error); }
  };

  export = async (req, res, next) => {
    try {
      const data = await this.service.exportData();
      const columns = [
        { header: 'Tỷ lệ than mềm', key: 'name', width: 30 },
        { header: '_id', key: '_id', width: 20 },
      ];
      const { workbook, worksheet } = createWorkbook(columns, data, 'mirror-ratio');
      const idColIndex = worksheet.columns.findIndex(c => c && c.key === '_id') + 1;
      if (idColIndex > 0) worksheet.getColumn(idColIndex).hidden = true;
      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'mirror-ratio.xlsx');
    } catch (error) { next(error); }
  };
}

module.exports = MirrorRatioController;
