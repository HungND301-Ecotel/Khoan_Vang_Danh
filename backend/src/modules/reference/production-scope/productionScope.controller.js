const BaseController = require('../../../shared/base/BaseController');
const ProductionScopeService = require('./productionScope.service');
const { createWorkbook, formatForExport, readExcelFromBuffer, sendExcelResponse } = require('../../../shared/utils/excelHelper');

class ProductionScopeController extends BaseController {
  constructor() {
    const service = new ProductionScopeService();
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
        'Mã phạm vi': 'code',
        'Tên phạm vi': 'name',
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
        { header: 'Mã phạm vi', key: 'code', width: 20 },
        { header: 'Tên phạm vi', key: 'name', width: 40 },
        { header: '_id', key: '_id', width: 20 },
      ];

      const { workbook, worksheet } = createWorkbook(columns, data, 'pham_vi_san_xuat');

      // Ẩn cột _id
      const idColIndex = worksheet.columns.findIndex((c) => c && c.key === '_id') + 1;
      if (idColIndex > 0) {
        worksheet.getColumn(idColIndex).hidden = true;
      }

      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'pham_vi_san_xuat.xlsx');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProductionScopeController;
