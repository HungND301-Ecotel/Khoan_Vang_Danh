const MiningTech = require("../model/MiningTech");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");
const { checkUniqueCode } = require("../utils/codeValidator");

exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "MiningTech",
    );
    if (isDuplicate) {
      return res
        .status(409)
        .json({
          status: "error",
          message: `Mã công nghệ khai thác '${code}' đã tồn tại trong hệ thống`,
        });
    }
    const newMiningTech = new MiningTech({ code, name });
    await newMiningTech.save();
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

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const headers = xlsx.utils
      .sheet_to_json(worksheet, {
        header: 1,
        range: 0,
        raw: true,
      })[0]
      .map((h) => String(h).trim());

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter((r) => r._id || r.name || r.code);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không có dữ liệu hợp lệ",
      });
    }

    // 🔹 Lấy danh sách Unit hiện có
    const miningtechs = await MiningTech.find({}, { code: 1, name: 1 }).lean();
    const nameMap = new Map(
      miningtechs.map((u) => [u.name.toLowerCase(), String(u._id)]),
    );
    const codeMap = new Map(
      miningtechs.map((u) => [u.code.toLowerCase(), String(u._id)]),
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, name, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanName = name ? String(name).trim() : null;
      const cleanCode = code ? String(code).trim() : null;

      // ===== DELETE =====
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

      const nameKey = cleanName?.toLowerCase();
      const codeKey = cleanCode?.toLowerCase();

      const existedCodeId = codeKey ? codeMap.get(codeKey) : null;
      const existedNameId = nameKey ? nameMap.get(nameKey) : null;

      let isCodeDuplicate = false;
      let duplicateSource = null;
      if (cleanCode) {
        const checkGlobal = await checkUniqueCode(cleanCode, _id, "MiningTech");
        if (checkGlobal.isDuplicate) {
          isCodeDuplicate = true;
          duplicateSource = checkGlobal.collectionName;
        }
      }

      // ===== UPDATE =====
      if (_id) {
        if (isCodeDuplicate) {
          invalidRows.push({
            item,
            error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}`,
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

      // ===== INSERT =====
      if (isCodeDuplicate) {
        invalidRows.push({
          item,
          error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}`,
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

    // ===== EXECUTE =====
    const bulkResult =
      operations.length > 0 ? await MiningTech.bulkWrite(operations) : null;

    res.status(200).json({
      status: "success",
      message: "Import công nghệ khai thác hoàn tất",
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
    const data = await MiningTech.find();
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
    const worksheet = workbook.addWorksheet("mining_tech");
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
      "attachment; filename=" + `miningtechs.xlsx`,
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
    const { code } = req.body;
    if (code) {
      const { isDuplicate, collectionName } = await checkUniqueCode(
        code,
        req.params.id,
        "MiningTech",
      );
      if (isDuplicate) {
        return res
          .status(409)
          .json({
            status: "error",
            message: `Mã công nghệ khai thác '${code}' đã tồn tại trong hệ thống`,
          });
      }
    }

    const updateData = await MiningTech.findByIdAndUpdate(
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
    const deleteData = await MiningTech.findByIdAndDelete(req.params.id);
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

    const result = await MiningTech.deleteMany({ _id: { $in: ids } });
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
        { name: new RegExp(req.query.q, "i") },
        { code: new RegExp(req.query.q, "i") },
      ];
    }
    const modelQuery = MiningTech.find(query);
    const pagination = await paginateQuery(
      MiningTech,
      modelQuery,
      query,
      req.query,
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
