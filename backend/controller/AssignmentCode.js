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

exports.create = async (req, res) => {
  try {
    const { code, name, uom, price, deviceCode } = req.body;
    const exitAssignment = await AssignmentCode.countDocuments({ code: code })
    if (exitAssignment > 0) {
      return res.status(409).json({ status: 'error', message: `Mã giao khoán '${code}' đã tồn tại` })
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
    const updateData = await AssignmentCode.findByIdAndUpdate(
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
      .populate("deviceCode");
    const pagination = await paginateQuery(
      AssignmentCode,
      queryModel,
      query,
      req.query
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

exports.import = async (req, res) => {
  try {
    // const user = req.user;
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];
    headers = headers.map((h) => String(h).trim()); // Làm sạch header // 1. Kiểm tra Header không hợp lệ

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
      (header) => columnMapping[header] || header
    );
    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    }); // Lọc bản ghi hợp lệ: có _id HOẶC (có code VÀ có name)

    const dataImport = data.filter((row) => row._id || (row.code && row.name));

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    } // Lấy danh sách codes/units để tìm kiếm

    const uniqueDeviceCodes = [
      ...new Set(
        dataImport.map((d) => String(d.deviceCode).trim()).filter(Boolean)
      ),
    ];
    const uniqueUnits = [
      ...new Set(dataImport.map((d) => String(d.uom).trim()).filter(Boolean)),
    ];

    const [exitingDeviceCodes, exitingUnits] = await Promise.all([
      DeviceCode.find({ code: { $in: uniqueDeviceCodes } }).lean(),
      Unit.find({ name: { $in: uniqueUnits } }).lean(),
    ]);

    const deviceCodeMap = new Map(
      exitingDeviceCodes.map((d) => [d.code, d._id])
    );
    const unitMap = new Map(exitingUnits.map((d) => [d.name, d._id]));

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      // Loại bỏ cột ignored (deviceCodes, units) trước khi destructure
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, code, name, deviceCode, uom, ...updateData } = item; // --- CLEANUP _id ---

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      } // --- Xử lý Tham chiếu (Foreign Keys) ---

      let isItemValid = true;
      let finalUpdateData = { ...updateData };

      if (deviceCode) {
        const trimmedDeviceCode = String(deviceCode).trim();
        const deviceCodeId = deviceCodeMap.get(trimmedDeviceCode);
        if (!deviceCodeId) {
          invalidRows.push({
            item,
            error: `Thiết bị không hợp lệ: ${deviceCode}`,
          });
          isItemValid = false;
          continue;
        }
        finalUpdateData.deviceCode = deviceCodeId;
      } else {
        finalUpdateData.deviceCode = null;
      }

      if (uom) {
        const trimmedUom = String(uom).trim();
        const unitId = unitMap.get(trimmedUom);
        if (!unitId) {
          invalidRows.push({ item, error: `Đơn vị tính không hợp lệ: ${uom}` });
          isItemValid = false;
          continue;
        }
        finalUpdateData.uom = unitId;
      } else {
        finalUpdateData.uom = null;
      }

      if (!isItemValid) continue; // Bỏ qua nếu tham chiếu không hợp lệ // ------- CASE 1: Có _id → update hoặc delete -------

      if (_id) {
        const hasData =
          Object.values(finalUpdateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (code && String(code).trim() !== "") ||
          (name && String(name).trim() !== "");

        if (!hasData) {
          operations.push({ deleteOne: { filter: { _id } } });
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(code ? { code: String(code).trim() } : {}),
                ...(name ? { name: String(name).trim() } : {}),
                ...finalUpdateData, // Bao gồm deviceCode và uom đã map/cleanup
              },
            },
            upsert: true,
          },
        });
        continue;
      } // ------- CASE 2: Không có _id nhưng có code và name → upsert theo cặp (code, name) -------

      if (code && name) {
        operations.push({
          updateOne: {
            filter: {
              code: String(code).trim(),
              name: String(name).trim(),
            },
            update: {
              $set: {
                code: String(code).trim(),
                name: String(name).trim(),
                ...finalUpdateData,
              },
            },
            upsert: true,
          },
        });
        continue;
      }
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await AssignmentCode.bulkWrite(operations);
    }
    res.status(200).json({
      status: "success",
      message: "Import dữ liệu hoàn tất.",
      summary: {
        totalProcessed: dataImport.length,
        insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
        updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
        invalidCount: invalidRows.length,
      },
      invalidRows: invalidRows,
    });
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({
      status: "error",
      message: "Tải thất bại",
      error: error.message,
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

    const editableKeys = ["deviceCode", "code", "name", "uom"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ma_giao_khoan.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
