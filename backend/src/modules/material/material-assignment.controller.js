const BaseController = require('../../shared/base/BaseController');
const MaterialAssignmentService = require('./material-assignment.service');
const {
  createWorkbook,
  formatForExport,
  readExcelFromBuffer,
  sendExcelResponse,
} = require('../../shared/utils/excelHelper');
const AssignmentCode = require('../assignment-code/assignment-code.model');
const Unit = require('../reference/unit/unit.model');

class MaterialAssignmentController extends BaseController {
  constructor() {
    super(new MaterialAssignmentService());
  }

  /**
   * GET /get - Aggregation pipeline với $lookup
   */
  get = async (req, res, next) => {
    try {
      const result = await this.service.get(req.query);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /getGroup - AssignmentCodes với child materials
   */
  getGroup = async (req, res, next) => {
    try {
      const result = await this.service.getGroup(req.query);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /getCount - Đếm materials có/không có assignmentCode
   */
  getCount = async (req, res, next) => {
    try {
      const result = await this.service.getCount();
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /importFile - Import từ Excel
   */
  import = async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res
          .status(400)
          .json({ status: 'error', message: 'Vui lòng chọn file' });
      }

      const columnMapping = {
        'Mã vật tư': 'code',
        'Tên vật tư': 'name',
        'ĐVT': 'uom',
        'Mã giao khoán': 'assignmentCode',
        'Số lượng': 'quantity',
        'Đơn giá': 'price',
        '_id': '_id',
        'id': '_id',
        'assignmentCodes': 'ignored',
        'units': 'ignored',
      };

      const { error, data } = readExcelFromBuffer(
        req.file.buffer,
        columnMapping
      );
      if (error) {
        return res.status(400).json({ status: 'error', message: error });
      }

      const dataImport = data.filter(
        (r) => r._id || r.code || r.name
      );
      if (dataImport.length === 0) {
        return res
          .status(400)
          .json({ status: 'error', message: 'Không tìm thấy dữ liệu hợp lệ' });
      }

      const result = await this.service.importData(dataImport);
      res.status(200).json({
        status: 'success',
        message: 'Import vật tư thành công',
        summary: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /exportFile - Export ra Excel
   */
  export = async (req, res, next) => {
    try {
      const data = await this.service.exportData();
      const columns = [
        { header: 'Mã vật tư', key: 'code', width: 20 },
        { header: 'Tên vật tư', key: 'name', width: 30 },
        { header: 'ĐVT', key: 'uom', width: 15 },
        { header: 'Mã giao khoán', key: 'assignmentCode', width: 20 },
        { header: 'Số lượng', key: 'quantity', width: 15 },
        { header: 'Đơn giá', key: 'price', width: 40 },
        { header: '_id', key: '_id', width: 20 },
      ];

      const { workbook, worksheet } = createWorkbook(
        columns,
        data,
        'vat_tu_tai_san_trong_khoan'
      );

      // Ẩn cột _id
      const idColIndex =
        worksheet.columns.findIndex((c) => c && c.key === '_id') + 1;
      if (idColIndex > 0) worksheet.getColumn(idColIndex).hidden = true;

      // Thêm dropdown cho các cột FK
      const assignmentCodes = await AssignmentCode.find();
      const units = await Unit.find();
      const assignmentCodeList = [
        ...new Set(
          assignmentCodes.map((p) => p.code).filter(Boolean)
        ),
      ];
      const unitList = [
        ...new Set(units.map((d) => d.name).filter(Boolean)),
      ];
      const MAX = Math.max(worksheet.rowCount + 100, 1000);

      worksheet.getColumn('X').values = [
        'assignmentCodes',
        ...assignmentCodeList,
      ];
      worksheet.getColumn('Y').values = ['units', ...unitList];
      worksheet.getColumn('X').hidden = true;
      worksheet.getColumn('Y').hidden = true;

      worksheet.dataValidations.add(`D2:D${MAX}`, {
        type: 'list',
        allowBlank: true,
        formulae: [
          `=$X$2:$X$${assignmentCodeList.length + 1}`,
        ],
      });
      worksheet.dataValidations.add(`C2:C${MAX}`, {
        type: 'list',
        allowBlank: true,
        formulae: [`=$Y$2:$Y$${unitList.length + 1}`],
      });

      const buffer = await formatForExport(workbook, worksheet);
      sendExcelResponse(res, buffer, 'vat_tu_tai_san_trong_khoan.xlsx');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = MaterialAssignmentController;
