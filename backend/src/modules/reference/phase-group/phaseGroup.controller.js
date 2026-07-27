const BaseController = require('../../../shared/base/BaseController');
const PhaseGroupService = require('./phaseGroup.service');
const { createWorkbook, formatForExport, readExcelFromBuffer, sendExcelResponse } = require('../../../shared/utils/excelHelper');

class PhaseGroupController extends BaseController {
  constructor() {
    const service = new PhaseGroupService();
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
        'Mã nhóm công đoạn': 'code',
        'Tên nhóm công đoạn': 'name',
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
        { header: 'Mã nhóm công đoạn', key: 'code', width: 20 },
        { header: 'Tên nhóm công đoạn', key: 'name', width: 40 },
        { header: '_id', key: '_id', width: 20 },
      ];

      const { workbook, worksheet } = createWorkbook(columns, data, 'nhom_cong_doan');

      // Ẩn cột _id
      const idColIndex = worksheet.columns.findIndex((c) => c && c.key === '_id') + 1;
      if (idColIndex > 0) {
        worksheet.getColumn(idColIndex).hidden = true;
      }

      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'nhom_cong_doan.xlsx');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = PhaseGroupController;
