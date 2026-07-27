const BaseController = require('../../../shared/base/BaseController');
const MiningTechService = require('./miningTech.service');
const { createWorkbook, formatForExport, readExcelFromBuffer, sendExcelResponse } = require('../../../shared/utils/excelHelper');

class MiningTechController extends BaseController {
  constructor() {
    const service = new MiningTechService();
    super(service);
  }

  /**
   * Import từ Excel
   * POST /importFile
   */
  import = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng chọn file',
        });
      }

      const columnMapping = {
        'Mã công nghệ': 'code',
        'Tên công nghệ': 'name',
        '_id': '_id',
      };

      const { error, data } = readExcelFromBuffer(req.file.buffer, columnMapping);

      if (error) {
        return res.status(400).json({ status: 'error', message: error });
      }

      const dataImport = data.filter((r) => r._id || r.code || r.name);

      if (dataImport.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Không tìm thấy dữ liệu hợp lệ trong file.',
        });
      }

      const result = await this.service.importData(dataImport);

      res.status(200).json({
        status: 'success',
        message: 'Import thành công',
        summary: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export ra Excel
   * POST /exportFile
   */
  export = async (req, res, next) => {
    try {
      const data = await this.service.exportData();

      const columns = [
        { header: 'Mã công nghệ', key: 'code', width: 20 },
        { header: 'Tên công nghệ', key: 'name', width: 40 },
        { header: '_id', key: '_id', width: 20 },
      ];

      const { workbook, worksheet } = createWorkbook(columns, data, 'cong_nghe_khai_thac');

      // Ẩn cột _id
      const idColIndex = worksheet.columns.findIndex((c) => c && c.key === '_id') + 1;
      if (idColIndex > 0) {
        worksheet.getColumn(idColIndex).hidden = true;
      }

      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'cong_nghe_khai_thac.xlsx');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = MiningTechController;
