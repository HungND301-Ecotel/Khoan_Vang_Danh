const MirrorRatio = require("../model/MirrorRatio");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const exitmirrorRatio = await MirrorRatio.countDocuments({ name: name })
    if (exitmirrorRatio > 0) {
      return res.status(409).json({ status: 'error', message: `Tỉ lệ gương than mềm '${name}' đã tồn tại` })
    }
    const newMirrorRatio = new MirrorRatio({ name });
    await newMirrorRatio.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await MirrorRatio.findByIdAndUpdate(
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
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
  }

  const result = await MirrorRatio.deleteMany({ _id: { $in: ids } });
  if (result.deletedCount === 0) {
    return res
      .status(200)
      .send({ status: "error", message: "Không tìm thấy bản ghi để xóa" });
  }

  res.status(200).json({
    status: "success",
    message: `Đã xóa ${result.deletedCount} bản ghi`,
  });
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
    const modelQuery = MirrorRatio.find(query);
    const pagination = await paginateQuery(
      MirrorRatio,
      modelQuery,
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
  "Tỉ lệ gương than mềm": "name",
  id: "_id", // Bổ sung ánh xạ id
  _id: "_id", // Bổ sung ánh xạ _id
};

exports.import = async (req, res) => {
  try {
    // const user = req.user;
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

    headers = headers.map((h) => String(h).trim()); // Làm sạch header // 1. Kiểm tra Header không hợp lệ

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
    }); // Lọc bản ghi hợp lệ: có _id HOẶC có name

    const dataImport = data.filter((row) => row._id || row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    const operations = dataImport.map((item) => {
      let { _id, name, ...updateData } = item; // --- CLEANUP _id ---

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      }

      let finalName = name ? String(name).trim() : null; // ------- CASE 1: Có _id → update hoặc delete -------

      if (_id) {
        // Kiểm tra xem dòng có dữ liệu thực sự hay không
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (finalName && finalName !== ""); // Nếu không có dữ liệu ⇒ delete

        if (!hasData) return { deleteOne: { filter: { _id } } }; // Nếu có dữ liệu ⇒ update/upsert

        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(finalName ? { name: finalName } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      } // ------- CASE 2: Không có _id nhưng có name → upsert theo name -------

      if (finalName) {
        return {
          updateOne: {
            filter: { name: finalName },
            update: {
              $set: {
                name: finalName,
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      }

      // ------- CASE 3: Insert mới (Không có _id, không có name) -------
      return {
        insertOne: {
          document: item,
        },
      };
    });

    await MirrorRatio.bulkWrite(operations);
    res.status(200).json({
      status: "success",
      message: `Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`,
    });
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({
      status: "error",
      message: error.message,
      error: error.stack,
    });
  }
};

exports.export = async (req, res) => {
  try {
    const data = await MirrorRatio.find();

    const columns = [
      { header: "Tỉ lệ gương than mềm", key: "name", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formated = (data || []).map((mirrorratio) => ({
      name: mirrorratio?.name || "",
      _id: mirrorratio?._id || "", // Thêm _id
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ti_le_guong_than_mem"); // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC

    worksheet.columns = columns;
    worksheet.addRows(formated); // Ẩn cột id

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000); // 🔑 Cột cần mở khóa chỉnh sửa

    const editableKeys = ["name"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `ti_le_guong_than_mem.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
