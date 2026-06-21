const Phase = require("../model/Phase");
const PhaseGroup = require("../model/PhaseGroup");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");
const { checkUniqueCode } = require("../utils/codeValidator");

exports.create = async (req, res) => {
  try {
    const { code, name, phaseGroup } = req.body;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "Phase",
    );
    if (isDuplicate) {
      return res
        .status(409)
        .json({
          status: "error",
          message: `Mã công đoạn '${code}' đã tồn tại trong hệ thống`,
        });
    }
    const newPhase = new Phase({ code, name, phaseGroup });
    await newPhase.save();
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
        "Phase",
      );
      if (isDuplicate) {
        return res
          .status(409)
          .json({
            status: "error",
            message: `Mã công đoạn '${code}' đã tồn tại trong hệ thống`,
          });
      }
    }

    const updateData = await Phase.findByIdAndUpdate(req.params.id, req.body, {
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

    const result = await Phase.deleteMany({ _id: { $in: ids } });
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
    if (req.query.phaseGroup) {
      query.phaseGroup = req.query.phaseGroup;
    }
    if (req.query.q) {
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
      ];
    }
    const modelQuery = Phase.find(query).populate("phaseGroup");
    const pagination = await paginateQuery(Phase, modelQuery, query, req.query);

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Mã công đoạn": "code",
  "Tên công đoạn": "name",
  "Nhóm công đoạn": "group",
  id: "_id",
  _id: "_id",
  groups: "ignored", // **Bổ sung key này để cho phép cột groups**
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

    // ===== LOAD PHASE GROUP =====
    const groups = await PhaseGroup.find({}, { name: 1 }).lean();
    const groupMap = new Map(groups.map((g) => [g.name.trim(), g._id]));

    // ===== LOAD EXISTED PHASE =====
    const existed = await Phase.find({}, { code: 1, name: 1 }).lean();

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

    // ===== PROCESS =====
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, code, name, group, ...updateData } = item;

      // --- CLEAN ID ---
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      // --- MAP GROUP ---
      if (group) {
        const gId = groupMap.get(String(group).trim());
        if (!gId) {
          invalidRows.push({
            item,
            error: `Nhóm công đoạn không tồn tại: ${group}`,
          });
          continue;
        }
        updateData.phaseGroup = gId;
      } else {
        updateData.phaseGroup = null;
      }

      // ===== DELETE =====
      if (_id && !cleanCode && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
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

      let isCodeDuplicate = false;
      let duplicateSource = null;
      if (cleanCode) {
        const checkGlobal = await checkUniqueCode(cleanCode, _id, "Phase");
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
      operations.length > 0 ? await Phase.bulkWrite(operations) : null;

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
    const data = await Phase.find().populate("phaseGroup", "name");

    const columns = [
      { header: "Mã công đoạn", key: "code", width: 20 },
      { header: "Tên công đoạn", key: "name", width: 30 },
      { header: "Nhóm công đoạn", key: "group", width: 20 },
      { header: "_id", key: "_id", width: 20 },
    ];

    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      group: i?.phaseGroup?.name || "",
      _id: i?._id || "",
    }));

    const groups = await PhaseGroup.find();
    const groupList = [...new Set(groups.map((p) => p.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cong_doan_san_xuat");

    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    // **ĐIỀU CHỈNH: Đặt header cột ẩn là null hoặc chuỗi rỗng để tránh xung đột**
    // Tuy nhiên, vì code phía dưới vẫn tham chiếu đến $X$2, chúng ta cần giữ nguyên cấu trúc
    // và chỉ cần thêm "groups" vào columnMapping (đã làm ở trên).
    // Giữ nguyên dòng này:
    worksheet.getColumn("X").values = ["groups", ...groupList];
    worksheet.getColumn("X").hidden = true;

    worksheet.dataValidations.add(`C2:C${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$X$2:$X$${groupList.length + 1}`],
    });

    const editableKeys = ["code", "name", "group"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cong_doan_san_xuat.xlsx",
    );
    res.send(buffer);
  } catch (err) {
    console.log(err.stack);
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
