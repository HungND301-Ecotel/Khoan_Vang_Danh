const RockRatio = require("../model/RockRatio");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const exitRockratio = await RockRatio.countDocuments({ name: name })
    if (exitRockratio > 0) {
      return res.status(409).json({ status: 'error', message: `Tỉ lệ đá lẫn trog gương '${name}' đã tồn tại` })
    }
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
  id: "_id", // Bổ sung ánh xạ id
  _id: "_id", // Bổ sung ánh xạ _id để đọc dữ liệu từ Excel
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

    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0]; // 1. Kiểm tra Header không hợp lệ (Bổ sung logic từ code mẫu)
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
    }); // Lọc dòng có name hoặc có _id (để hỗ trợ update/delete)
    const dataImport = data.filter((row) => row.name || row._id);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    const operations = dataImport.map((item) => {
      let { _id, name, ...updateData } = item; // Cần destructure _id // --- CLEANUP _id ---

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      } // ------- CASE 1: Có _id → update hoặc delete -------

      if (_id) {
        // Kiểm tra xem dòng có dữ liệu thực sự hay không (để quyết định update hay delete)
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (name && String(name).trim() !== ""); // Nếu không có dữ liệu ⇒ delete

        if (!hasData) return { deleteOne: { filter: { _id } } }; // Nếu có dữ liệu ⇒ update/upsert

        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(name ? { name: String(name).trim() } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      } // ------- CASE 2: Không có _id nhưng có name → upsert theo name -------

      if (name) {
        return {
          updateOne: {
            filter: { name: String(name).trim() },
            update: {
              $set: {
                name: String(name).trim(),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      } // ------- CASE 3: Không có _id, không có name → insert bản gốc -------

      return {
        insertOne: { document: item },
      };
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
      { header: "Tỉ lệ đá lẫn trong gương", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id để hỗ trợ Import
    ];

    const formated = (data || []).map((u) => ({
      name: u?.name || "",
      _id: u?._id || "", // Thêm _id vào dữ liệu export
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("rock_ratio");

    worksheet.columns = columns;
    worksheet.addRows(formated); // Ẩn cột id (giống code mẫu)

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000); // Bổ sung keys để đảm bảo đúng cấu trúc của configExport

    const buffer = await configExport(workbook, worksheet, ["name"], MAX);
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
