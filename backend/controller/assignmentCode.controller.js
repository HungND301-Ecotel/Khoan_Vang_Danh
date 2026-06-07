const { getService } = require("../services/service.factory");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");

const columnMapping = {
  "Thiết bị": "deviceCode",
  "Mã giao khoán": "code",
  "Tên giao khoán": "name",
  ĐVT: "uom",
  "Đơn giá": "price",
  id: "_id",
  _id: "_id",
  deviceCodes: "ignored",
  units: "ignored",
};

class AssignmentCodeController {
  constructor() {
    this.service = getService("assignmentCode");
  }

  create = async (req, res) => {
    try {
      await this.service.create(req.body);
      res.status(201).json({ status: "success", message: "Tạo thành công" });
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json({ status: "error", message: err.message });
    }
  };

  update = async (req, res) => {
    try {
      await this.service.update(req.params.id, req.body);
      res.status(200).json({ status: "success", message: "Sửa thành công" });
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json({ status: "error", message: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { ids } = req.body;
      const result = await this.service.deleteMany(ids);
      res.status(200).json({
        status: "success",
        message: `Đã xóa ${result.deletedCount} bản ghi`,
      });
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json({ status: "error", message: err.message });
    }
  };

  get = async (req, res) => {
    try {
      const data = await this.service.getList(req.query);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  };

  import = async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ status: "error", message: "Vui lòng chọn file" });
      }

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      let headers = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
        raw: true,
      })[0];
      headers = headers.map((h) => String(h).trim());

      const allowedHeaders = Object.keys(columnMapping);
      const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h));
      if (invalidHeaders.length > 0) {
        return res.status(400).json({
          status: "error",
          message: `File không hợp lệ. Cột không cho phép: ${invalidHeaders.join(", ")}`,
        });
      }

      const mappedHeaders = headers.map((h) => columnMapping[h] || h);
      const data = xlsx.utils.sheet_to_json(worksheet, {
        header: mappedHeaders,
        range: 1,
      });

      const dataImport = data.filter((r) => r._id || r.code || r.name);
      if (dataImport.length === 0) {
        return res
          .status(400)
          .json({ status: "error", message: "Không tìm thấy dữ liệu hợp lệ" });
      }

      const { bulkResult, invalidRows } =
        await this.service.importBulk(dataImport);

      res.status(200).json({
        status: "success",
        message: "Import mã giao khoán thành công",
        summary: {
          totalProcessed: dataImport.length,
          insertedCount: bulkResult?.insertedCount || 0,
          updatedCount: bulkResult?.modifiedCount || 0,
          deletedCount: bulkResult?.deletedCount || 0,
          invalidCount: invalidRows.length,
        },
        invalidRows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", message: err.message });
    }
  };

  export = async (req, res) => {
    try {
      const [data, { deviceCodeList, unitList }] = await Promise.all([
        this.service.findAll(),
        this.service.getDropdownLists(),
      ]);

      const columns = [
        { header: "Thiết bị", key: "deviceCode", width: 20 },
        { header: "Mã giao khoán", key: "code", width: 20 },
        { header: "Tên giao khoán", key: "name", width: 20 },
        { header: "ĐVT", key: "uom", width: 20 },
        { header: "Đơn giá", key: "price", width: 20 },
        { header: "_id", key: "_id", width: 20 },
      ];

      const formatted = (data || []).map((i) => ({
        deviceCode: i?.deviceCode?.code || "",
        code: i?.code || "",
        name: i?.name || "",
        uom: i?.uom?.name || "",
        price: i?.price || "",
        _id: i?._id || "",
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("ma_giao_khoan");
      worksheet.columns = columns;
      worksheet.addRows(formatted);

      const MAX = Math.max(worksheet.rowCount + 100, 1000);

      // Ẩn cột _id
      const idCol =
        worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
      if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

      // Danh sách dropdown ẩn
      worksheet.getColumn("X").values = ["deviceCodes", ...deviceCodeList];
      worksheet.getColumn("Y").values = ["units", ...unitList];
      worksheet.getColumn("X").hidden = true;
      worksheet.getColumn("Y").hidden = true;

      // Data validation dropdown
      worksheet.dataValidations.add(`A2:A${MAX}`, {
        type: "list",
        allowBlank: true,
        formulae: [`=$X$2:$X$${deviceCodeList.length + 1}`],
      });
      worksheet.dataValidations.add(`D2:D${MAX}`, {
        type: "list",
        allowBlank: true,
        formulae: [`=$Y$2:$Y$${unitList.length + 1}`],
      });

      const editableKeys = ["deviceCode", "code", "name", "uom", "price"];
      const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=ma_giao_khoan.xlsx",
      );
      res.send(buffer);
    } catch (err) {
      res
        .status(500)
        .send({ status: "error", message: err.message, stack: err.stack });
    }
  };
}

module.exports = new AssignmentCodeController();
