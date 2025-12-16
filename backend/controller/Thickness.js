const Thickness = require("../model/Thickness");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const newThickness = new Thickness({ name });
    await newThickness.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Độ dày vỉa": "name",
  id: "_id",
  _id: "_id",
};

exports.import = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];

    const allowedHeaders = Object.keys(columnMapping);
    const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h));

    if (invalidHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File không hợp lệ. Các cột sau không được phép: ${invalidHeaders.join(
          ", "
        )}`,
      });
    }

    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    );

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter((row) => row.name || row._id);

    if (dataImport.length === 0)
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });

    const operations = dataImport.map((item) => {
      let { _id, name, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      }

      if (_id) {
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (name && String(name).trim() !== "");

        if (!hasData) return { deleteOne: { filter: { _id } } };

        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(name ? { name } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      }

      if (name)
        return {
          updateOne: {
            filter: { name },
            update: { $set: { name, ...updateData } },
            upsert: true,
          },
        };

      return { insertOne: { document: item } };
    });

    await Thickness.bulkWrite(operations);

    res.status(200).json({
      status: "success",
      message: `Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`,
    });
  } catch (error) {
    console.log(error.stack);
    res
      .status(500)
      .json({ status: "error", message: "Tải thất bại", error: error.message });
  }
};

exports.export = async (req, res) => {
  try {
    const data = await Thickness.find();

    const columns = [
      { header: "Độ dày vỉa", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 },
    ];

    const formated = (data || []).map((u) => ({
      name: u?.name || "",
      _id: u?._id || "",
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("unit");

    worksheet.columns = columns;
    worksheet.addRows(formated);

    // ✔ Ẩn cột id, đúng logic gốc
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const buffer = await configExport(workbook, worksheet, ["name"], MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=" + `thickness.xlsx`);

    res.send(buffer);
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await Thickness.findByIdAndUpdate(
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
    const deleteData = await Thickness.findByIdAndDelete(req.params.id);
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
    const modelQuery = Thickness.find(query);
    const pagination = await paginateQuery(
      Thickness,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
