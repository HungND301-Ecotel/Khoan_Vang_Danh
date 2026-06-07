const { getService } = require("../services/service.factory");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");

const columnMapping = {
  "Đơn vị tính": "name",
  id: "_id",
  _id: "_id",
};

class UnitController {
  constructor() {
    this.unitService = getService("unit");
  }

  create = async (req, res) => {
    try {
      await this.unitService.create(req.body);
      res.status(201).json({ status: "success", message: "Tạo thành công" });
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json({ status: "error", message: err.message });
    }
  };

  update = async (req, res) => {
    try {
      await this.unitService.update(req.params.id, req.body);
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
      const result = await this.unitService.deleteMany(ids);
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
      const data = await this.unitService.getList(req.query);
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

      const headers = xlsx.utils
        .sheet_to_json(worksheet, { header: 1, range: 0, raw: true })[0]
        .map((h) => String(h).trim());

      const mappedHeaders = headers.map((h) => columnMapping[h] || h);

      const data = xlsx.utils.sheet_to_json(worksheet, {
        header: mappedHeaders,
        range: 1,
      });

      const dataImport = data.filter((r) => r._id || r.name);

      if (dataImport.length === 0) {
        return res
          .status(400)
          .json({ status: "error", message: "Không có dữ liệu hợp lệ" });
      }

      const { bulkResult, invalidRows } =
        await this.unitService.importBulk(dataImport);

      res.status(200).json({
        status: "success",
        message: "Import đơn vị tính hoàn tất",
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
      const data = await this.unitService.findAll();

      const columns = [
        { header: "Đơn vị tính", key: "name", width: 30 },
        { header: "_id", key: "_id", width: 20 },
      ];

      const formatted = (data || []).map((u) => ({
        name: u?.name || "",
        _id: u?._id || "",
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("unit");
      worksheet.columns = columns;
      worksheet.addRows(formatted);

      const idCol =
        worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
      if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

      const MAX = Math.max(worksheet.rowCount + 100, 1000);
      const buffer = await configExport(workbook, worksheet, ["name"], MAX);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=unit.xlsx");
      res.send(buffer);
    } catch (err) {
      res
        .status(500)
        .send({ status: "error", message: err.message, stack: err.stack });
    }
  };
}

module.exports = new UnitController();
