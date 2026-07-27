const BaseController = require('../../../shared/base/BaseController');
const AssignmentNormService = require('./assignment-norm.service');
const { sendExcelResponse } = require('../../../shared/utils/excelHelper');

class AssignmentNormController extends BaseController {
  constructor() {
    super(new AssignmentNormService());
  }

  /**
   * Import matrix Excel
   * POST /importFile
   * Body: { type: 'excavation'|'cutting'|'coal_kb'|'coal_zh'|'coal_zry' }
   * File: multer upload
   */
  import = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng chọn file',
        });
      }

      const { type } = req.body;
      if (!type) {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng chọn loại định mức',
        });
      }

      const validTypes = ['cutting', 'excavation', 'coal_kb', 'coal_zh', 'coal_zry'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          status: 'error',
          message: 'Loại định mức không hợp lệ',
        });
      }

      const result = await this.service.matrixImport(req.file.buffer, type);
      res.status(200).json({
        status: 'success',
        message: 'Import định mức giao khoán thành công',
        summary: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export matrix Excel
   * POST /exportFile
   * Body: { type: 'excavation'|'cutting'|'coal_kb'|'coal_zh'|'coal_zry' }
   */
  export = async (req, res, next) => {
    try {
      const { type } = req.body;
      if (!type) {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng chọn loại định mức',
        });
      }

      const validTypes = ['cutting', 'excavation', 'coal_kb', 'coal_zh', 'coal_zry'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          status: 'error',
          message: 'Loại định mức không hợp lệ',
        });
      }

      const buffer = await this.service.matrixExport(type);
      sendExcelResponse(res, buffer, `dinh_muc_giao_khoan_${type}.xlsx`);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AssignmentNormController;
