const Hardness = require("../model/Hardness");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const newHardness = new Hardness({ name });
    await newHardness.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  Tên: "name",
  Name: "name",
  id: "_id",
  _id: "_id",
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

    const dataImport = data.filter((row) => row.name || row._id);
    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    const operations = dataImport.map((item) => {
      let { _id, name, ...updateData } = item;

      // Clean invalid ObjectId formats
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim(); // bỏ dấu "
        if (_id.length !== 24) _id = null; // nếu sai 24 ký tự -> bỏ luôn
      }

      if (_id) {
        // update hoặc delete
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (name && String(name).trim() !== "");

        if (!hasData) {
          return { deleteOne: { filter: { _id } } };
        }

        return {
          updateOne: {
            filter: { _id },
            update: { $set: { ...(name ? { name } : {}), ...updateData } },
            upsert: true,
          },
        };
      }

      // No _id → upsert theo name
      if (name) {
        return {
          updateOne: {
            filter: { name },
            update: { $set: { name } },
            upsert: true,
          },
        };
      }

      return { insertOne: { document: item } };
    });

    await Hardness.bulkWrite(operations);
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
    const data = await Hardness.find();

    const columns = [
      { header: "Tên", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 },
    ];

    const formated = (data || []).map((d) => ({
      name: d?.name || "",
      _id: d?._id || "",
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("hardness");
    worksheet.columns = columns;
    worksheet.addRows(formated);

    // hide id column
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000);
    const buffer = await configExport(workbook, worksheet, ["name"], MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `hardness.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await Hardness.findByIdAndUpdate(
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
    const deleteData = await Hardness.findByIdAndDelete(req.params.id);
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
    const modelQuery = Hardness.find(query);
    const pagination = await paginateQuery(
      Hardness,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
