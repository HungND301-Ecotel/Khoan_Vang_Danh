const { getService } = require("../services/service.factory");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");

const columnMapping = {
  "Mã vật tư": "code",
  "Tên vật tư": "name",
  ĐVT: "uom",
  "Mã giao khoán": "assignmentCode",
  "Số lượng": "quantity",
  "Đơn giá": "price",
  id: "_id",
  _id: "_id",
  assignmentCodes: "ignored",
  units: "ignored",
};

class MaterialAssignmentController {
  constructor() {
    this.service = getService("materialAssignment");
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
      await this.service.deleteOne(req.params.id);
      res.status(200).json({ status: "success", message: "Xóa thành công" });
    } catch (err) {
      res
        .status(err.statusCode || 500)
        .json({ status: "error", message: err.message });
    }
  };

  getGroup = async (req, res) => {
    try {
      const data = await this.service.getGroupList(req.query);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      console.log(err.stack);
      res.status(500).json({ status: "error", message: err.message });
    }
  };

  get = async (req, res) => {
    try {
      const data = await this.service.getList(req.query);
      res.status(200).json({ status: "success", data });
    } catch (err) {
      console.log(err.stack);
      res.status(500).json({ status: "error", message: err.message });
    }
  };

  getCount = async (req, res) => {
    try {
      const data = await this.service.getCounts();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      console.error(err.stack);
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
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      let headers =
        xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: true })[0] || [];
      headers = headers.map((h) => String(h).trim());

      const mappedHeaders = headers.map((h) => columnMapping[h] || h);

      const dataImport = xlsx.utils
        .sheet_to_json(worksheet, { header: mappedHeaders, range: 1 })
        .filter((r) => r._id || r.code || r.name);

      if (dataImport.length === 0) {
        return res
          .status(400)
          .json({ status: "error", message: "Không tìm thấy dữ liệu hợp lệ" });
      }

      const { bulkResult, invalidRows } = await this.service.importBulk(
        dataImport,
      );

      res.status(200).json({
        status: "success",
        summary: {
          totalProcessed: dataImport.length,
          insertedCount:
            bulkResult?.insertedCount || bulkResult?.nInserted || 0,
          updatedCount:
            bulkResult?.modifiedCount ||
            bulkResult?.nModified ||
            bulkResult?.nMatched ||
            0,
          deletedCount: bulkResult?.deletedCount || bulkResult?.nRemoved || 0,
        },
        invalidRows: invalidRows || [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", message: err.message });
    }
  };

  export = async (req, res) => {
    try {
      const typeIn = req.query.type === "in";
      const [data, { assignmentCodeList, unitList }] = await Promise.all([
        this.service.findAllForExport(req.query.type),
        this.service.getDropdownLists(),
      ]);

      const columns = [
        { header: "Mã vật tư", key: "code", width: 20 },
        { header: "Tên vật tư", key: "name", width: 30 },
        { header: "ĐVT", key: "uom", width: 10 },
        typeIn && {
          header: "Mã giao khoán",
          key: "assignmentCode",
          width: 20,
        },
        typeIn && { header: "Số lượng", key: "quantity", width: 15 },
        { header: "Đơn giá", key: "price", width: 100 },
        { header: "_id", key: "_id", width: 0 },
      ].filter(Boolean);

      const formatPriceRanges = (prices = []) =>
        prices
          .map((p) => `${p.startMonth}~${p.endMonth}=${p.price}`)
          .join(",");

      const formatted = (data || []).map((i) => ({
        code: i?.code || "",
        name: i?.name || "",
        uom: i?.uom?.name || "",
        ...(typeIn ? { assignmentCode: i?.assignmentCode?.code || "" } : {}),
        ...(typeIn ? { quantity: i?.quantity || 0 } : {}),
        price: formatPriceRanges(i?.priceHistory || []),
        _id: i?._id || "",
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("vat_tu_tai_san_trong_khoan");

      worksheet.columns = columns;
      worksheet.addRows(formatted);

      const MAX = Math.max(worksheet.rowCount + 100, 1000);

      const idCol =
        worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
      if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

      const editableKeys = ["code", "name", "uom", "quantity", "price"];

      // Dropdown logic cho ĐVT
      const uomColIndex = columns.findIndex((c) => c && c.key === "uom");
      const uomColLetter = worksheet.getColumn(uomColIndex + 1).letter;

      worksheet.getColumn("Y").values = ["units", ...unitList];
      worksheet.getColumn("Y").hidden = true;

      worksheet.dataValidations.add(`${uomColLetter}2:${uomColLetter}${MAX}`, {
        type: "list",
        allowBlank: true,
        formulae: [`=$Y$2:$Y$${unitList.length + 1}`],
      });

      // Dropdown logic cho Mã giao khoán
      if (typeIn) {
        const assignmentColIndex = columns.findIndex(
          (c) => c && c.key === "assignmentCode",
        );
        const assignmentColLetter = worksheet.getColumn(
          assignmentColIndex + 1,
        ).letter;

        worksheet.getColumn("X").values = [
          "assignmentCodes",
          ...assignmentCodeList,
        ];
        worksheet.getColumn("X").hidden = true;

        worksheet.dataValidations.add(
          `${assignmentColLetter}2:${assignmentColLetter}${MAX}`,
          {
            type: "list",
            allowBlank: true,
            formulae: [`=$X$2:$X$${assignmentCodeList.length + 1}`],
          },
        );

        editableKeys.push("assignmentCode");
      }

      const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=vat_tu_tai_san_trong_khoan.xlsx",
      );
      res.send(buffer);
    } catch (err) {
      res
        .status(500)
        .send({ status: "error", message: err.message, stack: err.stack });
    }
  };
}

module.exports = new MaterialAssignmentController();
