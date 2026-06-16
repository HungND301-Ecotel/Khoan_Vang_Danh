const Department = require("../model/Department");
const { paginateQuery } = require("../utils/pagination");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");

const columnMapping = {
  "Mã phân xưởng": "code",
  "Tên phân xưởng": "name",
  _id: "_id",
};

// POST /api/departments
exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !code.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Mã phân xưởng là bắt buộc" });
    }
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Tên phân xưởng là bắt buộc" });
    }

    const existsCode = await Department.findOne({
      code: { $regex: `^${code.trim()}$`, $options: "i" },
    });
    if (existsCode) {
      return res.status(409).json({
        status: "error",
        message: `Mã phân xưởng '${code.trim()}' đã tồn tại`,
      });
    }

    const existsName = await Department.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existsName) {
      return res.status(409).json({
        status: "error",
        message: `Phân xưởng '${name.trim()}' đã tồn tại`,
      });
    }
    const newDept = new Department({ code: code.trim(), name: name.trim() });
    await newDept.save();
    res.status(201).json({
      status: "success",
      message: "Tạo phân xưởng thành công",
      data: newDept,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// PUT /api/departments/:id
exports.update = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !code.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Mã phân xưởng là bắt buộc" });
    }
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Tên phân xưởng là bắt buộc" });
    }

    // Kiểm tra trùng mã
    const existsCode = await Department.findOne({
      _id: { $ne: req.params.id },
      code: { $regex: `^${code.trim()}$`, $options: "i" },
    });
    if (existsCode) {
      return res.status(409).json({
        status: "error",
        message: `Mã phân xưởng '${code.trim()}' đã tồn tại`,
      });
    }

    // Kiểm tra trùng tên
    const existsName = await Department.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existsName) {
      return res.status(409).json({
        status: "error",
        message: `Phân xưởng '${name.trim()}' đã tồn tại`,
      });
    }

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { code: code.trim(), name: name.trim() },
      { new: true },
    );
    if (!updated) {
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy phân xưởng" });
    }
    res.status(200).json({
      status: "success",
      message: "Cập nhật thành công",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// DELETE /api/departments/:id  (xóa 1)
exports.deleteOne = async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy phân xưởng" });
    }
    res.status(200).json({ status: "success", message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// DELETE /api/departments  (xóa nhiều - body: { ids: [...] })
exports.deleteMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
    }
    const result = await Department.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
      return res
        .status(200)
        .json({ status: "error", message: "Không tìm thấy bản ghi để xóa" });
    }
    res.status(200).json({
      status: "success",
      message: `Đã xóa ${result.deletedCount} bản ghi`,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// GET /api/departments?page=1&limit=10&q=keyword
exports.get = async (req, res) => {
  try {
    const query = {};
    if (req.query.q) {
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
      ];
    }

    const modelQuery = Department.find(query).sort({ createdAt: -1 });
    const pagination = await paginateQuery(
      Department,
      modelQuery,
      query,
      req.query,
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// EXPORT /api/departments/exportFile
exports.export = async (req, res) => {
  try {
    const data = await Department.find().lean();

    const columns = [
      { header: "Mã phân xưởng", key: "code", width: 20 },
      { header: "Tên phân xưởng", key: "name", width: 40 },
      { header: "_id", key: "_id", width: 20 },
    ];

    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      _id: String(i?._id || ""),
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("phan_xuong");

    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const editableKeys = ["code", "name"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=phan_xuong.xlsx",
    );
    res.send(buffer);
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// IMPORT /api/departments/importFile
exports.import = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn file",
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];

    headers = headers.map((h) => String(h).trim());

    const allowedHeaders = Object.keys(columnMapping);
    const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h));

    if (invalidHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File không hợp lệ. Các cột sau không được phép: ${invalidHeaders.join(
          ", ",
        )}`,
      });
    }

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter((r) => r._id || r.code || r.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    const existed = await Department.find({}, { code: 1, name: 1 }).lean();
    const codeMap = new Map(
      existed
        .filter((p) => p.code)
        .map((p) => [p.code.toLowerCase(), String(p._id)]),
    );
    const nameMap = new Map(
      existed
        .filter((p) => p.name)
        .map((p) => [p.name.toLowerCase(), String(p._id)]),
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, code, name, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      if (_id && !cleanCode && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      if (!cleanCode || !cleanName) {
        invalidRows.push({
          item,
          error: "Mã và Tên phân xưởng là bắt buộc",
        });
        continue;
      }

      const codeKey = cleanCode.toLowerCase();
      const nameKey = cleanName.toLowerCase();

      const existedCodeId = codeMap.get(codeKey);
      const existedNameId = nameMap.get(nameKey);

      if (_id) {
        if (existedCodeId && existedCodeId !== _id) {
          invalidRows.push({
            item,
            error: `Mã đã tồn tại: ${cleanCode}`,
          });
          continue;
        }
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
                code: cleanCode,
                name: cleanName,
                ...updateData,
              },
            },
          },
        });
      } else {
        if (existedCodeId) {
          invalidRows.push({
            item,
            error: `Mã đã tồn tại: ${cleanCode}`,
          });
          continue;
        }
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
              code: cleanCode,
              name: cleanName,
              ...updateData,
            },
          },
        });
      }
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await Department.bulkWrite(operations, { ordered: false });
    }

    res.status(200).json({
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
