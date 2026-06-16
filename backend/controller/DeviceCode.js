const DeviceCode = require("../model/DeviceCode");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { paginateQuery } = require("../utils/pagination");
const { checkUniqueCode } = require("../utils/codeValidator");

exports.create = async (req, res) => {
  try {
    const { code } = req.body;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "DeviceCode",
    );
    if (isDuplicate) {
      return res
        .status(409)
        .json({
          status: "error",
          message: `Mã thiết bị '${code}' đã tồn tại trong hệ thống`,
        });
    }
    const newDeviceCode = new DeviceCode({ code });
    await newDeviceCode.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { code } = req.body;
    if (code) {
      const { isDuplicate, collectionName } = await checkUniqueCode(
        code,
        req.params.id,
        "DeviceCode",
      );
      if (isDuplicate) {
        return res
          .status(409)
          .json({
            status: "error",
            message: `Mã thiết bị '${code}' đã tồn tại trong hệ thống`,
          });
      }
    }

    const updateData = await DeviceCode.findByIdAndUpdate(
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
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
  }

  const result = await DeviceCode.deleteMany({ _id: { $in: ids } });
  if (result.deletedCount === 0) {
    return res
      .status(200)
      .send({ status: "error", message: "Không tìm thấy bản ghi để xóa" });
  }

  res.status(200).json({
    status: "success",
    message: `Đã xóa ${result.deletedCount} bản ghi`,
  });
};

exports.get = async (req, res) => {
  try {
    let query = {};
    if (req.query.q) {
      query.code = new RegExp(req.query.q, "i");
    }
    let modelQuery = DeviceCode.find(query);

    const pagination = await paginateQuery(
      DeviceCode,
      modelQuery,
      query,
      req.query,
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Thiết bị": "code",
  id: "_id", // Bổ sung ánh xạ id
  _id: "_id", // Bổ sung ánh xạ _id
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

    const dataImport = data.filter((r) => r._id || r.code);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không có dữ liệu hợp lệ",
      });
    }

    // 🔹 Lấy danh sách Unit hiện có
    const devices = await DeviceCode.find({}, { code: 1 }).lean();
    const codeMap = new Map(
      devices.map((u) => [u.code.toLowerCase(), String(u._id)]),
    );

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, ...updateData } = item;

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const codeKey = cleanCode?.toLowerCase();
      const existedId = codeKey ? codeMap.get(codeKey) : null;

      // ===== CASE 1: Có _id nhưng không có name → DELETE
      if (_id && !cleanCode) {
        operations.push({
          deleteOne: { filter: { _id } },
        });
        continue;
      }

      let isCodeDuplicate = false;
      let duplicateSource = null;

      if (cleanCode) {
        const checkGlobal = await checkUniqueCode(cleanCode, _id, "DeviceCode");
        if (checkGlobal.isDuplicate) {
          isCodeDuplicate = true;
          duplicateSource = checkGlobal.collectionName;
        }
      }

      // ===== CASE 2: Có _id + có name → UPDATE
      if (_id && cleanCode) {
        if (isCodeDuplicate) {
          invalidRows.push({
            item,
            error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}`,
          });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                name: cleanCode,
                ...updateData,
              },
            },
          },
        });
        continue;
      }

      // ===== CASE 3: Không có _id + có name → INSERT
      if (!_id && cleanCode) {
        if (isCodeDuplicate) {
          invalidRows.push({
            item,
            error: `Mã đã tồn tại trong danh mục ${duplicateSource}: ${cleanCode}`,
          });
          continue;
        }

        operations.push({
          insertOne: {
            document: {
              name: cleanCode,
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
      bulkResult = await DeviceCode.bulkWrite(operations);
    }

    res.status(200).json({
      status: "success",
      message: "Import mã thiết bị hoàn tất",
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
    const data = await DeviceCode.find();

    const columns = [
      { header: "Thiết bị", key: "code", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formated = (data || []).map((devicecode) => ({
      code: devicecode?.code || "",
      _id: devicecode?._id || "", // Thêm _id
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ma_thiet_bi"); // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC

    worksheet.columns = columns;
    worksheet.addRows(formated);

    // Ẩn cột id (giống code mẫu)
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    // Truyền key của cột muốn cho phép sửa
    const editableKeys = ["code"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `ma_thiet_bi.xlsx`,
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
