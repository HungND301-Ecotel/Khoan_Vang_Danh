const PhaseGroup = require("../model/PhaseGroup");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    const exitPhaseGroup = await PhaseGroup.countDocuments({ code: code })
    if (exitPhaseGroup > 0) {
      return res.status(409).json({ status: 'error', message: `Mã nhóm công đoạn '${code}' đã tồn tại` })
    }
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
    const invalidHeaders = headers.filter(
      (h) => !allowedHeaders.includes(h)
    );

    if (invalidHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File không hợp lệ. Cột không cho phép: ${invalidHeaders.join(
          ", "
        )}`,
      });
    }

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    // PhaseGroup cần _id HOẶC code HOẶC name
    const dataImport = data.filter((r) => r._id || r.code || r.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ",
      });
    }

    // ===== LOAD EXISTED CODE + NAME =====
    const existed = await PhaseGroup.find(
      {},
      { code: 1, name: 1 }
    ).lean();

    const codeMap = new Map(
      existed
        .filter((r) => r.code)
        .map((r) => [r.code.toLowerCase(), String(r._id)])
    );

    const nameMap = new Map(
      existed
        .filter((r) => r.name)
        .map((r) => [r.name.toLowerCase(), String(r._id)])
    );

    // ===== PROCESS =====
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, name, ...updateData } = item;

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

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

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

      const codeKey = cleanCode?.toLowerCase();
      const nameKey = cleanName?.toLowerCase();

      const existedCodeId = codeKey ? codeMap.get(codeKey) : null;
      const existedNameId = nameKey ? nameMap.get(nameKey) : null;

      // ===== UPDATE =====
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

      // ===== INSERT =====
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

    // ===== EXECUTE =====
    const bulkResult =
      operations.length > 0
        ? await PhaseGroup.bulkWrite(operations)
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
