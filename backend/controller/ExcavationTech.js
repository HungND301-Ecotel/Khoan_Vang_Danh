const ExcavationTech = require("../model/ExcavationTech");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const exitData = await ExcavationTech.countDocuments({ name: name })
    if (exitData > 0) {
      return res.status(409).json({ status: 'error', message: `Công nghệ xúc '${name}' đã tồn tại` })
    }
    const newExcavationTech = new ExcavationTech({ name });
    await newExcavationTech.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await ExcavationTech.findByIdAndUpdate(
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
    const deleteData = await ExcavationTech.findByIdAndDelete(req.params.id);
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
    const modelQuery = ExcavationTech.find(query);
    const pagination = await paginateQuery(
      ExcavationTech,
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
  "Công nghệ xúc": "name",
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

    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    );

    // Parse dữ liệu
    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    // Lọc bản ghi hợp lệ (có name)
    const dataImport = data.filter((row) => row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    // Bulk write (upsert theo name)
    const operations = dataImport.map((item) => ({
      updateOne: {
        filter: { name: item.name.trim() },
        update: { $set: { name: item.name.trim() } },
        upsert: true,
      },
    }));

    await ExcavationTech.bulkWrite(operations);

    res.status(200).json({
      status: "success",
      message: `Import thành công. Đã xử lý ${dataImport.length} bản ghi.`,
    });
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({
      status: "error",
      message: "Import thất bại",
      error: error.message,
    });
  }
};

exports.export = async (req, res) => {
  try {
    const data = await ExcavationTech.find().lean();

    const columns = [{ header: "Công nghệ xúc", key: "name", width: 30 }];

    const formatted = (data || []).map((i) => ({
      name: i?.name || "",
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cong_nghe_xuc");

    worksheet.columns = columns;
    worksheet.addRows(formatted);

    const MAX = Math.max(worksheet.rowCount + 50, 200);

    // Không dropdown nên validations = []
    const buffer = await configExport(workbook, worksheet, [], MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cong_nghe_xuc.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
};
