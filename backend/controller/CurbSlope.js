const CurbSlope = require("../model/CurbSlope");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const exitData = await CurbSlope.countDocuments({ name: name })
    if (exitData > 0) {
      return res.status(409).json({ status: 'error', message: `Độ dốc vỉa '${name}' đã tồn tại` })
    }
    const newCurbSlope = new CurbSlope({ name });
    await newCurbSlope.save();
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
    const curbslopes = await CurbSlope.find({}, { name: 1 }).lean();
    const nameMap = new Map(
      curbslopes.map(u => [u.name.toLowerCase(), String(u._id)])
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
            error: `Độ dốc vỉa đã tồn tại: ${cleanName}`,
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
            error: `Độ dốc vỉa đã tồn tại: ${cleanName}`,
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
      bulkResult = await CurbSlope.bulkWrite(operations);
    }

    res.status(200).json({
      status: "success",
      message: "Import Độ dốc vỉa hoàn tất",
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
    const data = await CurbSlope.find();
    const columns = [
      { header: "Tên", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 },
    ];
    const formated = (data || []).map((d) => ({
      name: d?.name || "",
      _id: d?._id || "",
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("curb_slope");
    worksheet.columns = columns;
    worksheet.addRows(formated);
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
      "attachment; filename=" + `curb_slope.xlsx`
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
    const updateData = await CurbSlope.findByIdAndUpdate(
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
    const deleteData = await CurbSlope.findByIdAndDelete(req.params.id);
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
    const modelQuery = CurbSlope.find(query);
    const pagination = await paginateQuery(
      CurbSlope,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
