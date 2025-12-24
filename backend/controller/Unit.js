const Unit = require("../model/Unit");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const exitUnit = await Unit.countDocuments({ name: name })
    if (exitUnit > 0) {
      return res.status(409).json({ status: 'error', message: `Đơn vị tính '${name}' đã tồn tại` })
    }

    const newUnit = new Unit({ name });
    await newUnit.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await Unit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
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

    const result = await Unit.deleteMany({ _id: { $in: ids } });
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
    let modelQuery = Unit.find(query);

    const pagination = await paginateQuery(Unit, modelQuery, query, req.query);

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Đơn vị tính": "name",
  id: "_id", // Bổ sung _id để xử lý trong hàm import, giống như code gốc
  _id: "_id",
};

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

    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0].map(h => String(h).trim());

    const mappedHeaders = headers.map(h => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter(r => r._id || r.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không có dữ liệu hợp lệ",
      });
    }

    // 🔹 Lấy danh sách Unit hiện có
    const units = await Unit.find({}, { name: 1 }).lean();
    const nameMap = new Map(
      units.map(u => [u.name.toLowerCase(), String(u._id)])
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, name, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanName = name ? String(name).trim() : null;
      const nameKey = cleanName?.toLowerCase();
      const existedId = nameKey ? nameMap.get(nameKey) : null;

      // ===== CASE 1: Có _id nhưng không có name → DELETE
      if (_id && !cleanName) {
        operations.push({
          deleteOne: { filter: { _id } },
        });
        continue;
      }

      // ===== CASE 2: Có _id + có name → UPDATE
      if (_id && cleanName) {
        if (existedId && existedId !== _id) {
          invalidRows.push({
            item,
            error: `Đơn vị tính đã tồn tại: ${cleanName}`,
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
        continue;
      }

      // ===== CASE 3: Không có _id + có name → INSERT
      if (!_id && cleanName) {
        if (existedId) {
          invalidRows.push({
            item,
            error: `Đơn vị tính đã tồn tại: ${cleanName}`,
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
        continue;
      }

      // ===== CASE INVALID
      invalidRows.push({
        item,
        error: "Dòng không hợp lệ",
      });
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await Unit.bulkWrite(operations);
    }

    res.status(200).json({
      status: "success",
      message: "Import đơn vị tính hoàn tất",
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
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


exports.export = async (req, res) => {
  try {
    const data = await Unit.find();

    const columns = [
      { header: "Đơn vị tính", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 }, // Giữ cột _id để có thể Import
    ];

    const formated = (data || []).map((u) => ({
      name: u?.name || "",
      _id: u?._id || "",
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("unit");

    worksheet.columns = columns;
    worksheet.addRows(formated); // Ẩn cột id để người dùng không cần quan tâm khi chỉnh sửa

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const buffer = await configExport(workbook, worksheet, ["name"], MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=" + `unit.xlsx`);

    res.send(buffer);
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
};
