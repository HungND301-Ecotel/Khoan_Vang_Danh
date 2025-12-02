const CrossSection = require("../model/CrossSection");
const Unit = require("../model/Unit");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");

exports.create = async (req, res) => {
  try {
    const { name, uom } = req.body;
    const newCrossSection = new CrossSection({ name, uom });
    await newCrossSection.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await CrossSection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updateData) {
      return res.status(404).json({ status: "error", message: "Sửa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Sửa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleteData = await CrossSection.findByIdAndDelete(req.params.id);
    if (!deleteData) {
      return res.status(404).json({ status: "error", message: "Xóa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    let query = {};
    if (req.query.q) {
      query.name = new RegExp(req.query.q, "i");
    }
    const modelQuery = CrossSection.find(query).populate("uom");
    const pagination = await paginateQuery(
      CrossSection,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Tiết diện lò xén": "name",
  ĐVT: "uom", // map theo tên trong bảng Unit
};

exports.import = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Lấy header
    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];
    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    // Parse data
    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });
    const dataImport = data.filter((row) => row.name);
    console.log(dataImport);
    console.log("data:", data);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    // Lấy các unit từ DB
    const uniqueUnits = [
      ...new Set(dataImport.map((d) => d.uom).filter(Boolean)),
    ];
    const existingUnits = await Unit.find({
      name: { $in: uniqueUnits },
    }).lean();
    const unitMap = new Map(existingUnits.map((u) => [u.name.trim(), u._id]));

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      const { name, uom, ...rest } = item;
      const updateData = { name, ...rest };

      if (uom) {
        const unitId = unitMap.get(uom.trim());
        if (!unitId) {
          invalidRows.push({ item, error: `Đơn vị tính không hợp lệ: ${uom}` });
          continue; // vẫn bỏ qua dòng nhưng không gửi response
        } else {
          updateData.uom = unitId;
        }
      }

      operations.push({
        updateOne: {
          filter: { name },
          update: { $set: updateData },
          upsert: true,
        },
      });
    }

    console.log("updateData:", operations);

    // Cuối cùng chỉ gửi 1 response
    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await CrossSection.bulkWrite(operations);
    }

    res.status(200).json({
      status: "success",
      message: "Import dữ liệu hoàn tất.",
      summary: {
        totalProcessed: dataImport.length,
        insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
        updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
        invalidCount: invalidRows.length,
      },
      invalidRows,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
    console.log(err.stack);
  }
};

exports.export = async (req, res) => {
  try {
    const data = await CrossSection.find().populate("uom", "name");

    const columns = [
      { header: "Tiết diện lò xén", key: "name", width: 30 },
      { header: "ĐVT", key: "uom", width: 20 },
    ];

    const formatted = data.map((i) => ({
      name: i?.name || "",
      uom: i?.uom?.name || "",
    }));

    const units = await Unit.find();
    const unitList = [...new Set(units.map((u) => u.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cross_section");

    // 1️⃣ Thêm dữ liệu chính
    worksheet.columns = columns;
    worksheet.addRows(formatted);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    // 2️⃣ Thêm dropdown cho cột B
    worksheet.getColumn("X").values = ["uom", ...unitList];
    worksheet.getColumn("X").hidden = true;

    const validations = [
      {
        range: `B2:B${MAX}`,
        formula: `=$X$2:$X$${unitList.length + 1}`,
      },
    ];

    const buffer = await configExport(workbook, worksheet, validations, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cross_section.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: err.message, stack: err.stack });
  }
};
