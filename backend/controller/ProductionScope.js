const ProductionScope = require("../model/ProductionScope");
const { paginateQuery } = require("../utils/pagination");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");

exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    const exitData = await ProductionScope.countDocuments({ code: code });
    if (exitData > 0) {
      return res
        .status(409)
        .json({
          status: "error",
          message: `Mã diện sản xuất '${code}' đã tồn tại`,
        });
    }
    const newProductionScope = new ProductionScope({ code, name });
    await newProductionScope.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  Mã: "code",
  Code: "code",
  Tên: "name",
  Name: "name",
  id: "_id",
  _id: "_id",
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

    /** ===== READ FILE ===== */
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    /** ===== HEADER ===== */
    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    const rows = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = rows.filter((r) => r._id || r.code || r.name);

    if (!dataImport.length) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file",
      });
    }

    /** ===== LOAD EXISTED PRODUCTION SCOPE ===== */
    const existed = await ProductionScope.find({}, { code: 1, name: 1 }).lean();

    const codeMap = new Map(
      existed
        .filter((i) => i.code)
        .map((i) => [i.code.toLowerCase(), String(i._id)]),
    );

    const nameMap = new Map(
      existed
        .filter((i) => i.name)
        .map((i) => [i.name.toLowerCase(), String(i._id)]),
    );

    /** ===== PROCESS ===== */
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, name, ...updateData } = item;

      /** CLEAN STRING */
      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      /** CLEAN ID */
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      /** DELETE */
      if (_id && !cleanCode && !cleanName) {
        operations.push({
          deleteOne: { filter: { _id } },
        });
        continue;
      }

      if (!cleanCode && !cleanName) {
        invalidRows.push({
          item,
          error: "Mã hoặc tên là bắt buộc",
        });
        continue;
      }

      const codeKey = cleanCode?.toLowerCase();
      const nameKey = cleanName?.toLowerCase();

      const existedCodeId = codeKey ? codeMap.get(codeKey) : null;
      const existedNameId = nameKey ? nameMap.get(nameKey) : null;

      /** UPDATE */
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
                ...(cleanCode ? { code: cleanCode } : {}),
                ...(cleanName ? { name: cleanName } : {}),
                ...updateData,
              },
            },
          },
        });

        if (cleanCode) codeMap.set(codeKey, _id);
        if (cleanName) nameMap.set(nameKey, _id);
        continue;
      }

      /** INSERT */
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
            ...(cleanCode ? { code: cleanCode } : {}),
            ...(cleanName ? { name: cleanName } : {}),
            ...updateData,
          },
        },
      });

      const fakeId = new mongoose.Types.ObjectId().toString();
      if (cleanCode) codeMap.set(codeKey, fakeId);
      if (cleanName) nameMap.set(nameKey, fakeId);
    }

    /** ===== EXECUTE ===== */
    const bulkResult =
      operations.length > 0
        ? await ProductionScope.bulkWrite(operations)
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
    const data = await ProductionScope.find();
    const columns = [
      { header: "Mã", key: "code", width: 20 },
      { header: "Tên", key: "name", width: 30 },
      { header: "_id", key: "_id", width: 20 },
    ];
    const formated = (data || []).map((d) => ({
      code: d?.code || "",
      name: d?.name || "",
      _id: d?._id || "",
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("production_scope");
    worksheet.columns = columns;
    worksheet.addRows(formated);
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;
    const MAX = Math.max(worksheet.rowCount + 100, 1000);
    const buffer = await configExport(
      workbook,
      worksheet,
      ["code", "name"],
      MAX,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `production_scope.xlsx`,
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
    const updateData = await ProductionScope.findByIdAndUpdate(
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
    const deleteData = await ProductionScope.findByIdAndDelete(req.params.id);
    if (!deleteData) {
      return res.status(404).json({ status: "error", message: "Xóa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.deleteMany = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
    }

    const result = await ProductionScope.deleteMany({ _id: { $in: ids } });
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
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
      ];
    }
    const modelQuery = ProductionScope.find(query);
    const pagination = await paginateQuery(
      ProductionScope,
      modelQuery,
      query,
      req.query,
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};
