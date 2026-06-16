const AssignmentCode = require("../model/AssignmentCode");
const DeviceCode = require("../model/DeviceCode");
const Unit = require("../model/Unit");
const {
  updatePriceAssignmentCode,
} = require("../utils/recalculateAssignmentCodePrice");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");
const { checkUniqueCode } = require("../utils/codeValidator");

exports.create = async (req, res) => {
  try {
    const { code, name, uom, price, deviceCode } = req.body;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "AssignmentCode",
    );
    if (isDuplicate) {
      return res
        .status(409)
        .json({
          status: "error",
          message: `Mã giao khoán '${code}' đã tồn tại trong hệ thống`,
        });
    }
    const newAssignmentCode = new AssignmentCode({
      code,
      name,
      uom,
      price,
      deviceCode,
    });
    await newAssignmentCode.save();
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
        "AssignmentCode",
      );
      if (isDuplicate) {
        return res
          .status(409)
          .json({
            status: "error",
            message: `Mã giao khoán '${code}' đã tồn tại trong hệ thống`,
          });
      }
    }

    const updateData = await AssignmentCode.findByIdAndUpdate(
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
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
    }

    const result = await AssignmentCode.deleteMany({ _id: { $in: ids } });
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
    let queryModel = AssignmentCode.find(query)
      .populate("uom")
      .populate("deviceCode")
      .sort({ code: 1 });
    const pagination = await paginateQuery(
      AssignmentCode,
      queryModel,
      query,
      req.query,
    );
    for (const assignment of pagination.data) {
      await updatePriceAssignmentCode(assignment._id);
    }

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Thiết bị": "deviceCode",
  "Mã giao khoán": "code",
  "Tên giao khoán": "name",
  ĐVT: "uom",
  "Đơn giá": "price",
  id: "_id",
  _id: "_id", // **Bổ sung key cho các cột ẩn chứa dropdown**
  deviceCodes: "ignored",
  units: "ignored",
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

    // ===== READ & CLEAN HEADER =====
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
        message: `File không hợp lệ. Cột không cho phép: ${invalidHeaders.join(", ")}`,
      });
    }

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    // ===== FILTER ROWS =====
    const dataImport = data.filter((r) => r._id || r.code || r.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ",
      });
    }

    // ===== LOAD EXISTING DATA =====
    const existedAssignments = await AssignmentCode.find(
      {},
      { code: 1, name: 1 },
    ).lean();

    const codeMap = new Map(
      existedAssignments.map((d) => [d.code.toLowerCase(), String(d._id)]),
    );
    const nameMap = new Map(
      existedAssignments.map((d) => [d.name.toLowerCase(), String(d._id)]),
    );

    // ===== FK MAP =====
    const uniqueDeviceCodes = [
      ...new Set(
        dataImport
          .map((d) => d.deviceCode && String(d.deviceCode).trim())
          .filter(Boolean),
      ),
    ];

    const uniqueUnits = [
      ...new Set(
        dataImport.map((d) => d.uom && String(d.uom).trim()).filter(Boolean),
      ),
    ];

    const [deviceCodes, units] = await Promise.all([
      DeviceCode.find({ code: { $in: uniqueDeviceCodes } }).lean(),
      Unit.find({ name: { $in: uniqueUnits } }).lean(),
    ]);

    const deviceCodeMap = new Map(deviceCodes.map((d) => [d.code, d._id]));
    const unitMap = new Map(units.map((u) => [u.name, u._id]));

    // ===== PROCESS =====
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      let { _id, code, name, deviceCode, uom, ...updateData } = item;

      // --- CLEAN ---
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
        operations.push({
          deleteOne: { filter: { _id } },
        });
        continue;
      }

      if (!cleanCode || !cleanName) {
        invalidRows.push({
          item,
          error: "Mã và tên là bắt buộc",
        });
        continue;
      }

      const codeKey = cleanCode.toLowerCase();
      const nameKey = cleanName.toLowerCase();

      const existedCodeId = codeMap.get(codeKey);
      const existedNameId = nameMap.get(nameKey);

      // --- FK ---
      if (deviceCode) {
        const dcId = deviceCodeMap.get(String(deviceCode).trim());
        if (!dcId) {
          invalidRows.push({
            item,
            error: `Mã thiết bị không tồn tại: ${deviceCode}`,
          });
          continue;
        }
        updateData.deviceCode = dcId;
      } else {
        updateData.deviceCode = null;
      }

      if (uom) {
        const uomId = unitMap.get(String(uom).trim());
        if (!uomId) {
          invalidRows.push({
            item,
            error: `Đơn vị tính không tồn tại: ${uom}`,
          });
          continue;
        }
        updateData.uom = uomId;
      } else {
        updateData.uom = null;
      }

      let isCodeDuplicate = false;
      let duplicateSource = null;
      if (cleanCode) {
        const checkGlobal = await checkUniqueCode(
          cleanCode,
          _id,
          "AssignmentCode",
        );
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
          invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` });
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

        codeMap.set(codeKey, _id);
        nameMap.set(nameKey, _id);
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
        invalidRows.push({ item, error: `Tên đã tồn tại: ${cleanName}` });
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

      const fakeId = new mongoose.Types.ObjectId().toString();
      codeMap.set(codeKey, fakeId);
      nameMap.set(nameKey, fakeId);
    }

    // ===== EXECUTE =====
    const bulkResult =
      operations.length > 0 ? await AssignmentCode.bulkWrite(operations) : null;

    res.status(200).json({
      status: "success",
      message: "Import mã giao khoán thành công",
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
    const data = await AssignmentCode.find()
      .populate("uom")
      .populate("deviceCode");

    const columns = [
      { header: "Thiết bị", key: "deviceCode", width: 20 },
      { header: "Mã giao khoán", key: "code", width: 20 },
      { header: "Tên giao khoán", key: "name", width: 20 },
      { header: "ĐVT", key: "uom", width: 20 },
      { header: "Đơn giá", key: "price", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formated = (data || []).map((i) => ({
      deviceCode: i?.deviceCode?.code || "",
      code: i?.code || "",
      name: i?.name || "",
      uom: i?.uom?.name || "",
      price: i?.price || "",
      _id: i?._id || "", // Thêm _id
    }));

    const deviceCodes = await DeviceCode.find();
    const units = await Unit.find();

    const deviceCodeList = [
      ...new Set(deviceCodes.map((p) => p.code).filter(Boolean)),
    ];
    const unitList = [...new Set(units.map((d) => d.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ma_giao_khoan"); // 🧩 1️⃣ Thêm dữ liệu chính TRƯỚC

    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000); // Ẩn cột id

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true; // 🧩 2️⃣ Thêm các danh sách dropdown

    worksheet.getColumn("X").values = ["deviceCodes", ...deviceCodeList];
    worksheet.getColumn("Y").values = ["units", ...unitList];
    worksheet.getColumn("X").hidden = true;
    worksheet.getColumn("Y").hidden = true; // 🎯 Áp dụng Data Validation (Dropdown) // Cột Thiết bị (A)

    worksheet.dataValidations.add(`A2:A${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$X$2:$X$${deviceCodeList.length + 1}`],
    }); // Cột ĐVT (D)
    worksheet.dataValidations.add(`D2:D${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$Y$2:$Y$${unitList.length + 1}`],
    }); // 🔑 Cột cần mở khóa chỉnh sửa

    const editableKeys = ["deviceCode", "code", "name", "uom", "price"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ma_giao_khoan.xlsx",
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
