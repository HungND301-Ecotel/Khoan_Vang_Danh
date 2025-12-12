const DeviceCode = require("../model/DeviceCode");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { code } = req.body;
    const newDeviceCode = new DeviceCode({ code });
    await newDeviceCode.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await DeviceCode.findByIdAndUpdate(
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
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
  }

  const result = await DeviceCode.deleteMany({ _id: { $in: ids } });
  if (result.deletedCount === 0) {
    return res
      .status(200)
      .send({ status: "error", message: "Không tìm thấy bản ghi để xóa" });
  }

  res.status(200).json({
    status: "success",
    message: `Đã xóa ${result.deletedCount} bản ghi`,
  });
};

exports.get = async (req, res) => {
  try {
    let query = {};
    if (req.query.q) {
      query.code = new RegExp(req.query.q, "i");
    }
    let modelQuery = DeviceCode.find(query);

    const pagination = await paginateQuery(
      DeviceCode,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Thiết bị": "code",
  id: "_id", // Bổ sung ánh xạ id
  _id: "_id", // Bổ sung ánh xạ _id
};
exports.import = async (req, res) => {
  try {
    // const user = req.user; // Giữ lại nếu bạn sử dụng
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

    // Làm sạch header
    headers = headers.map((h) => String(h).trim());

    // 1. Kiểm tra Header không hợp lệ
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

    // Lọc bản ghi hợp lệ (có _id hoặc code)
    const dataImport = data.filter((row) => row._id || row.code);

    if (dataImport.length === 0) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Không tìm thấy dữ liệu hợp lệ trong file.",
        });
    }

    const operations = dataImport.map((item) => {
      let { _id, code, ...updateData } = item;

      // --- CLEANUP _id ---
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      }

      // ------- CASE 1: Có _id → update hoặc delete -------
      if (_id) {
        // Kiểm tra xem dòng có dữ liệu thực sự hay không (code hoặc các trường khác)
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (code && String(code).trim() !== "");

        // Nếu không có dữ liệu ⇒ delete
        if (!hasData) return { deleteOne: { filter: { _id } } };

        // Nếu có dữ liệu ⇒ update/upsert
        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(code ? { code: String(code).trim() } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      }

      // ------- CASE 2: Không có _id nhưng có code → upsert theo code -------
      if (code) {
        return {
          updateOne: {
            filter: { code: String(code).trim() },
            update: {
              $set: {
                code: String(code).trim(),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      }

      // ------- CASE 3: Insert mới (Không có _id, không có code) -------
      return {
        insertOne: {
          document: item,
        },
      };
    });

    await DeviceCode.bulkWrite(operations);
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
    const data = await DeviceCode.find();

    const columns = [
      { header: "Thiết bị", key: "code", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formated = (data || []).map((devicecode) => ({
      code: devicecode?.code || "",
      _id: devicecode?._id || "", // Thêm _id
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ma_thiet_bi"); // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC

    worksheet.columns = columns;
    worksheet.addRows(formated);

    // Ẩn cột id (giống code mẫu)
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    // Truyền key của cột muốn cho phép sửa
    const editableKeys = ["code"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `ma_thiet_bi.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
