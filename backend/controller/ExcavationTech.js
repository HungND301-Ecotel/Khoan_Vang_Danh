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
  "_id": "_id"
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
    })[0].map(h => String(h).trim());

    const allowedHeaders = Object.keys(columnMapping);
    const invalidHeaders = headers.filter(h => !allowedHeaders.includes(h));

    if (invalidHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File không hợp lệ. Cột không cho phép: ${invalidHeaders.join(", ")}`,
      });
    }

    const mappedHeaders = headers.map(h => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter(r => r._id || r.name);

    if (!dataImport.length) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ",
      });
    }

    // ===== LOAD EXISTED =====
    const existed = await ExcavationTech.find({}, { name: 1 }).lean();
    const nameMap = new Map(
      existed.map(r => [r.name.toLowerCase(), String(r._id)])
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, name, ...updateData } = item;

      // --- CLEAN ID ---
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanName = name ? String(name).trim() : null;

      // ===== DELETE =====
      if (_id && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      if (!cleanName) {
        invalidRows.push({ item, error: "Tên là bắt buộc" });
        continue;
      }

      const nameKey = cleanName.toLowerCase();
      const existedId = nameMap.get(nameKey);

      // ===== UPDATE =====
      if (_id) {
        if (existedId && existedId !== _id) {
          invalidRows.push({
            item,
            error: `Tên đã tồn tại: ${cleanName}`,
          });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: { $set: { name: cleanName, ...updateData } },
          },
        });

        nameMap.set(nameKey, _id);
        continue;
      }

      // ===== INSERT =====
      if (existedId) {
        invalidRows.push({
          item,
          error: `Tên đã tồn tại: ${cleanName}`,
        });
        continue;
      }

      operations.push({
        insertOne: {
          document: { name: cleanName, ...updateData },
        },
      });

      nameMap.set(nameKey, new mongoose.Types.ObjectId().toString());
    }

    const bulkResult =
      operations.length > 0
        ? await ExcavationTech.bulkWrite(operations)
        : null;

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
    const data = await ExcavationTech.find().lean();

    const columns = [
      { header: "Công nghệ xúc", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 },
    ];

    const formatted = (data || []).map((i) => ({
      name: i?.name || "",
      _id: i?._id
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cong_nghe_xuc");

    worksheet.columns = columns;
    worksheet.addRows(formatted);

    // Ẩn cột id (giống code mẫu)
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 50, 200);

    // Không dropdown nên validations = []
    const buffer = await configExport(workbook, worksheet, ["name"], MAX);

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
