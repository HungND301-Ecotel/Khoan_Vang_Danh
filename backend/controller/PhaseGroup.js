const PhaseGroup = require("../model/PhaseGroup");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    const newPhaseGroup = new PhaseGroup({ code, name });
    await newPhaseGroup.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await PhaseGroup.findByIdAndUpdate(
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
    const deleteData = await PhaseGroup.findByIdAndDelete(req.params.id);
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
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
      ];
    }
    const modelQuery = PhaseGroup.find(query);
    const pagination = await paginateQuery(
      PhaseGroup,
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
  "Mã nhóm công đoạn": "code",
  "Tên nhóm công đoạn": "name",
  id: "_id", // Bổ sung ánh xạ id
  _id: "_id", // Bổ sung ánh xạ _id
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
    const worksheet = workbook.Sheets[sheetName]; // Lấy header

    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0]; // 1. Kiểm tra Header không hợp lệ

    const allowedHeaders = Object.keys(columnMapping);
    const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h));

    if (invalidHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File không hợp lệ. Các cột sau không được phép: ${invalidHeaders.join(
          ", "
        )}`,
      });
    } // Map header → key trong DB

    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    ); // Parse dữ liệu

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    }); // Lọc bản ghi hợp lệ (có _id, code, hoặc name)

    const dataImport = data.filter((row) => row._id || row.code || row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    } // Tạo các operation bulk

    const operations = dataImport.map((item) => {
      let { _id, code, name, ...updateData } = item; // Cần destructure _id, code, name // --- CLEANUP _id ---

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      } // ------- CASE 1: Có _id → update hoặc delete -------

      if (_id) {
        // Kiểm tra xem dòng có dữ liệu thực sự hay không
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (code && String(code).trim() !== "") ||
          (name && String(name).trim() !== ""); // Nếu không có dữ liệu ⇒ delete

        if (!hasData) return { deleteOne: { filter: { _id } } }; // Nếu có dữ liệu ⇒ update/upsert

        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(code ? { code: String(code).trim() } : {}),
                ...(name ? { name: String(name).trim() } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      } // ------- CASE 2: Không có _id nhưng có code → upsert theo code -------

      if (code) {
        return {
          updateOne: {
            filter: { code: String(code).trim() },
            update: {
              $set: {
                code: String(code).trim(),
                ...(name ? { name: String(name).trim() } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      }

      // ------- CASE 3: Chỉ có name hoặc không có gì (Insert) -------
      // Do đã lọc dataImport.filter((row) => row._id || row.code || row.name);
      // và đã xử lý Case 1 và Case 2, còn lại là insert mới
      return {
        insertOne: {
          document: item,
        },
      };
    });

    await PhaseGroup.bulkWrite(operations);

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
    const data = await PhaseGroup.find();

    const columns = [
      { header: "Mã nhóm công đoạn", key: "code", width: 10 },
      { header: "Tên nhóm công đoạn", key: "name", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formated = (data || []).map((p) => ({
      code: p?.code || "",
      name: p?.name || "",
      _id: p?._id || "", // Thêm _id vào dữ liệu export
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cong_doan_san_xuat"); // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC

    worksheet.columns = columns;
    worksheet.addRows(formated); // Ẩn cột id (giống code mẫu)

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const buffer = await configExport(
      workbook,
      worksheet,
      ["code", "name"],
      MAX
    ); // Truyền keys vào configExport
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `cong_doan_san_xuat.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
