const RockRatio = require("../model/RockRatio");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const exitRockratio = await RockRatio.countDocuments({ name: name });
    if (exitRockratio > 0) {
      return res
        .status(409)
        .json({
          status: "error",
          message: `Tỉ lệ đá lẫn trog gương '${name}' đã tồn tại`,
        });
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
      { new: true },
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

    const result = await RockRatio.deleteMany({ _id: { $in: ids } });
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
    let queryModel = RockRatio.find(query);
    const pagination = await paginateQuery(
      RockRatio,
      queryModel,
      query,
      req.query,
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
const mongoose = require("mongoose");
exports.import = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn file",
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // ===== HEADER =====
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
        message: `File không hợp lệ. Cột không cho phép: ${invalidHeaders.join(
          ", ",
        )}`,
      });
    }

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter((r) => r._id || r.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ",
      });
    }

    // ===== LOAD EXISTED NAME =====
    const existed = await RockRatio.find({}, { name: 1 }).lean();

    const nameMap = new Map(
      existed.map((r) => [r.name.toLowerCase(), String(r._id)]),
    );

    // ===== PROCESS =====
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, name, ...updateData } = item;

      // --- CLEAN ID ---
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({
            item,
            error: "ID không hợp lệ",
          });
          continue;
        }
      }

      const cleanName = name ? String(name).trim() : null;

      // ===== DELETE =====
      if (_id && !cleanName) {
        operations.push({
          deleteOne: { filter: { _id } },
        });
        continue;
      }

      if (!cleanName) {
        invalidRows.push({
          item,
          error: "Tên là bắt buộc",
        });
        continue;
      }

      const nameKey = cleanName.toLowerCase();
      const existedNameId = nameMap.get(nameKey);

      // ===== UPDATE =====
      if (_id) {
        if (existedNameId && existedNameId !== _id) {
          invalidRows.push({
            item,
            error: `Tên đã tồn tại: ${cleanName}`,
          });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                name: cleanName,
                ...updateData,
              },
            },
          },
        });

        nameMap.set(nameKey, _id);
        continue;
      }

      // ===== INSERT =====
      if (existedNameId) {
        invalidRows.push({
          item,
          error: `Tên đã tồn tại: ${cleanName}`,
        });
        continue;
      }

      operations.push({
        insertOne: {
          document: {
            name: cleanName,
            ...updateData,
          },
        },
      });

      const fakeId = new mongoose.Types.ObjectId().toString();
      nameMap.set(nameKey, fakeId);
    }

    // ===== EXECUTE =====
    const bulkResult =
      operations.length > 0 ? await RockRatio.bulkWrite(operations) : null;

    return res.status(200).json({
      status: "success",
      message: "Import thành công",
      summary: {
        totalProcessed: dataImport.length,
        insertedCount: bulkResult?.insertedCount || 0,
        updatedCount: bulkResult?.modifiedCount || 0,
        deletedCount: bulkResult?.deletedCount || 0,
        invalidCount: invalidRows.length,
      },
      invalidRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: error.message,
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `ti_le_da_lan_trong_guong.xlsx`,
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
