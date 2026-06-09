const CrossSection = require("../model/CrossSection");
const Unit = require("../model/Unit");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");

exports.create = async (req, res) => {
  try {
    const { name, uom } = req.body;
    const exitData = await CrossSection.countDocuments({ name: name })
    if (exitData > 0) {
      return res.status(409).json({ status: 'error', message: `Công nghệ xúc '${name}' đã tồn tại` })
    }
    const newCrossSection = new CrossSection({ name, uom });
    await newCrossSection.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await CrossSection.findByIdAndUpdate(
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
   const { ids } = req.body;
   if (!ids || !Array.isArray(ids) || ids.length === 0) {
     return res
       .status(400)
       .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
   }

   const result = await CrossSection.deleteMany({ _id: { $in: ids } });
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
    const modelQuery = CrossSection.find(query).populate("uom");
    const pagination = await paginateQuery(
      CrossSection,
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
  "Tiết diện lò xén": "name",
  ĐVT: "uom",
  id: "_id",
  _id: "_id",
  uom: "ignored", // Thêm key cột ẩn cho dropdown
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
          ", "
        )}`,
      });
    }

    const mappedHeaders = headers.map(
      (h) => columnMapping[h] || h
    );

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    const dataImport = data.filter((r) => r._id || r.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    // ===== LOAD PHASE GROUP =====
    const units = await Unit.find({}, { name: 1 }).lean();
    const unitMap = new Map(
      units.map((g) => [g.name.trim(), g._id])
    );

    // ===== LOAD EXISTED PHASE =====
    const existed = await CrossSection.find({}, { name: 1 }).lean();

    const nameMap = new Map(
      existed
        .filter((p) => p.name)
        .map((p) => [p.name.toLowerCase(), String(p._id)])
    );

    // ===== PROCESS =====
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, name, uom, ...updateData } = item;

      // --- CLEAN ID ---
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) {
          invalidRows.push({ item, error: "ID không hợp lệ" });
          continue;
        }
      }

      const cleanName = name ? String(name).trim() : null;

      // --- MAP GROUP ---
      if (uom) {
        const gId = unitMap.get(String(uom).trim());
        if (!gId) {
          invalidRows.push({
            item,
            error: `Đơn vị tính không tồn tại: ${uom}`,
          });
          continue;
        }
        updateData.uom = gId;
      } else {
        updateData.uom = null;
      }

      // ===== DELETE =====
      if (_id && !cleanName) {
        operations.push({ deleteOne: { filter: { _id } } });
        continue;
      }

      if (!cleanName) {
        invalidRows.push({
          item,
          error: "Tiết diện là bắt buộc",
        });
        continue;
      }

      const nameKey = cleanName?.toLowerCase();

      const existedNameId = nameKey ? nameMap.get(nameKey) : null;

      // ===== UPDATE =====
      if (_id) {
        if (existedNameId && existedNameId !== _id) {
          invalidRows.push({
            item,
            error: `Tiết diện đã tồn tại: ${cleanName}`,
          });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(cleanName ? { name: cleanName } : {}),
                ...updateData,
              },
            },
          },
        });

        if (cleanName) nameMap.set(nameKey, _id);
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
            ...(cleanName ? { name: cleanName } : {}),
            ...updateData,
          },
        },
      });

      const fakeId = new mongoose.Types.ObjectId().toString();
      if (cleanName) nameMap.set(nameKey, fakeId);
    }

    // ===== EXECUTE =====
    const bulkResult =
      operations.length > 0
        ? await CrossSection.bulkWrite(operations)
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
    const data = await CrossSection.find().populate("uom", "name");

    const columns = [
      { header: "Tiết diện lò xén", key: "name", width: 30 },
      { header: "ĐVT", key: "uom", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formatted = data.map((i) => ({
      name: i?.name || "",
      uom: i?.uom?.name || "",
      _id: i?._id || "", // Thêm _id
    }));

    const units = await Unit.find();
    const unitList = [...new Set(units.map((u) => u.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cross_section");

    worksheet.columns = columns;
    worksheet.addRows(formatted); // Ẩn cột id
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000); // Cột ẩn cho dropdown

    worksheet.getColumn("X").values = ["uom", ...unitList];
    worksheet.getColumn("X").hidden = true; // Áp dụng data validation cho cột ĐVT (cột B)

    const uomColLetter = worksheet.getColumn(2).letter; // Cột B là cột thứ 2
    worksheet.dataValidations.add(`${uomColLetter}2:${uomColLetter}${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$X$2:$X$${unitList.length + 1}`],
    }); // Cột cần mở khóa chỉnh sửa

    const editableKeys = ["name", "uom"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cross_section.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
      error: err.stack,
    });
  }
};
