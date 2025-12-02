const RockRatio = require("../model/RockRatio");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const newRockRatio = new RockRatio({ name });
    await newRockRatio.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await RockRatio.findByIdAndUpdate(
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
    const deleteData = await RockRatio.findByIdAndDelete(req.params.id);
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
    let queryModel = RockRatio.find(query);
    const pagination = await paginateQuery(
      RockRatio,
      queryModel,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Tỉ lệ đá lẫn trong gương": "name",
};
exports.import = async (req, res) => {
  try {
    const user = req.user;
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];
    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    );
    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });
    const dataImport = data.filter((row) => row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    const operations = dataImport.map((item) => {
      const { name, ...updateData } = item;

      if (name) {
        // Kiểm tra nếu có trường 'name'
        return {
          updateOne: {
            filter: { name: name }, // Sửa từ 'cleanedId' thành 'name'
            update: { $set: updateData }, // Sử dụng $set để cập nhật dữ liệu
            upsert: true,
          },
        };
      } else {
        return {
          insertOne: {
            document: item,
          },
        };
      }
    });

    await RockRatio.bulkWrite(operations);
    res.status(200).json({
      status: "success",
      message: `Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`,
    });
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({
      status: "error",
      message: "Tải thất bại",
      error: error.message,
    });
  }
};

exports.export = async (req, res) => {
  try {
    const data = await RockRatio.find();

    const columns = [
      { header: "Tỉ lệ đá lẫn trong gương", key: "name", width: 20 },
    ];

    const formated = (data || []).map((rockratio) => ({
      name: rockratio?.name || "",
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ti_le_da_lan_trong_guong");

    // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC
    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const buffer = await configExport(workbook, worksheet, [], MAX);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `ti_le_da_lan_trong_guong.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
