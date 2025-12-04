const MaterialAssignment = require("../model/MaterialAssignment");
const AssignmentCode = require("../model/AssignmentCode");
const Unit = require("../model/Unit");
const dayjs = require("dayjs");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const quarterOfYear = require("dayjs/plugin/quarterOfYear");
dayjs.extend(quarterOfYear);
const { paginateQuery } = require("../utils/pagination");
const { updatePriceAssignmentCode } = require('../utils/recalculateAssignmentCodePrice')
const { request } = require("express");

exports.create = async (req, res) => {
  try {
    const { code, name, assignmentCode, uom, quantity, priceHistory } =
      req.body;
    const newMaterialAssignment = new MaterialAssignment({
      code,
      name,
      assignmentCode,
      uom,
      quantity,
      priceHistory,
    });
    await newMaterialAssignment.save();
    await updatePriceAssignmentCode(assignmentCode);
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await MaterialAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updateData) {
      return res.status(404).json({ status: "error", message: "Sửa thất bại" });
    }
    await updatePriceAssignmentCode(updateData.assignmentCode);
    res.status(200).json({ status: "success", message: "Sửa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleteData = await MaterialAssignment.findByIdAndDelete(
      req.params.id
    );
    if (!deleteData) {
      return res.status(404).json({ status: "error", message: "Xóa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    let query = {};
    if (req.query.q) {
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
      ];
    }
    const modelQuery = AssignmentCode.find(query)
      .populate("deviceCode")
      .populate({
        path: "uom",
      });
    const pagination = await paginateQuery(
      AssignmentCode,
      modelQuery,
      query,
      req.query
    );

    const result = [];

    for (const assignment of pagination.data) {
      await updatePriceAssignmentCode(assignment._id);

      const materials = await MaterialAssignment.find({
        assignmentCode: assignment._id,
      })
        .populate("assignmentCode")
        .populate("uom");

      const todayStr = new Date().toISOString().split("T")[0];

      const materialsWithPrice = materials.map((item) => {
        let currentPrice = null;

        if (Array.isArray(item.priceHistory)) {
          const matched = item.priceHistory.find((priceItem) => {
            return (
              todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
            );
          });

          if (matched) currentPrice = matched.price;
        }

        return {
          ...item.toObject(),
          currentPrice,
        };
      });

      result.push({
        _id: assignment._id,
        name: assignment.name,
        code: assignment.code,
        uom: assignment.uom?.name,
        price: assignment.price,
        device: assignment.deviceCode?.code,
        materials: materialsWithPrice,
      });
    }
    pagination.data = result;

    res.status(200).json({ status: "success", data: pagination });
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
    if (req.query.type === "in") {
      query.assignmentCode = { $ne: null, $exists: true };
    } else if (req.query.type === "out") {
      query.assignmentCode = { $exists: false };
    }
    let queryModel = MaterialAssignment.find(query)
      .populate("assignmentCode")
      .populate("uom");
    const pagination = await paginateQuery(
      MaterialAssignment,
      queryModel,
      query,
      req.query
    );
    const assignmentIds = [
      ...new Set(
        pagination.data
          .map((m) => m.assignmentCode?._id?.toString())
          .filter(Boolean)
      ),
    ];
    await Promise.all(
      assignmentIds.map((id) => updatePriceAssignmentCode(id))
    );
    const todayStr = new Date().toISOString().split("T")[0];
    pagination.data = pagination.data.map((item) => {
      let currentPrice = null;

      if (Array.isArray(item.priceHistory)) {
        const matched = item.priceHistory.find((priceItem) => {
          return (
            todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
          );
        });

        if (matched) currentPrice = matched.price;
      }

      return {
        ...item.toObject(),
        currentPrice,
      };
    });

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getFilter = async (req, res) => {
  try {
    const { month, quarter, year } = req.query;
    let startDate, endDate;

    if (month && year) {
      startDate = dayjs(`${year}-${month}-01`)
        .startOf("month")
        .format("YYYY-MM-DD");
      endDate = dayjs(startDate).endOf("month").format("YYYY-MM-DD");
    } else if (quarter && year) {
      startDate = dayjs()
        .year(year)
        .quarter(quarter)
        .startOf("quarter")
        .format("YYYY-MM-DD");
      endDate = dayjs(startDate).endOf("quarter").format("YYYY-MM-DD");
    } else {
      return res.status(400).json({
        status: "error",
        message: "Thiếu month/year hoặc quarter/year trong query.",
      });
    }
    const assignments = await AssignmentCode.find()
      .populate("deviceCode")
      .populate({
        path: "uom",
      });

    const result = [];

    for (const assignment of assignments) {
      const materials = await MaterialAssignment.find({
        assignmentCode: assignment._id,
      })
        .populate("assignmentCode")
        .populate("uom");
      let totalQty = 0;
      let totalValue = 0;
      const materialsWithPrice = materials.map((item) => {
        let currentPrice = null;

        if (Array.isArray(item.priceHistory)) {
          const matched = item.priceHistory.find((priceItem) => {
            return (
              priceItem.startDate <= endDate && priceItem.endDate >= startDate
            );
          });

          if (matched) {
            currentPrice = matched.price;
          }
        }
        const qty = item.quantity || 0;
        totalQty += qty;
        totalValue += qty * currentPrice;
        return {
          ...item.toObject(),
          currentPrice,
        };
      });

      const averagePrice =
        totalQty > 0 ? Math.round(totalValue / totalQty) : null;

      result.push({
        _id: assignment._id,
        name: assignment.name,
        code: assignment.code,
        uom: assignment.uom?.name,
        price: averagePrice,
        device: assignment.deviceCode?.code,
        materials: materialsWithPrice,
      });
    }

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Mã vật tư": "code",
  "Tên vật tư": "name",
  ĐVT: "uom",
  "Mã giao khoán": "assignmentCode",
  "Số lượng": "quantity",
};

exports.import = async (req, res) => {
  try {
    const user = req.user;
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];
    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    );
    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });
    const dataImport = data.filter((row) => row.code && row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }
    const uniqueAssignmentCodes = [
      ...new Set(dataImport.map((d) => d.assignmentCode).filter(Boolean)),
    ];
    const uniqueUnits = [
      ...new Set(dataImport.map((d) => d.uom).filter(Boolean)),
    ];

    const [existingAssignmentCodes, existingUnits] = await Promise.all([
      AssignmentCode.find({ code: { $in: uniqueAssignmentCodes } }).lean(),
      Unit.find({ name: { $in: uniqueUnits } }).lean(),
    ]);

    const assignmentCodeMap = new Map(
      existingAssignmentCodes.map((d) => [d.code, d._id])
    );
    const unitMap = new Map(existingUnits.map((d) => [d.name, d._id]));

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      const { assignmentCode, uom, ...updateData } = item;
      if (assignmentCode) {
        const assignmentCodeId = assignmentCodeMap.get(assignmentCode);
        if (!assignmentCodeId) {
          invalidRows.push({
            item,
            error: `Mã giao khoán không hợp lệ: ${assignmentCode}`,
          });
          continue;
        }
        updateData.assignmentCode = assignmentCodeId;
      }

      if (uom) {
        const unitId = unitMap.get(uom);
        if (!unitId) {
          invalidRows.push({ item, error: `Đơn vị tính không hợp lệ: ${uom}` });
          continue;
        }
        updateData.uom = unitId;
      }

      operations.push({
        updateOne: {
          filter: {
            code: item.code,
            name: item.name,
          },
          update: { $set: updateData },
          upsert: true,
        },
      });
    }

    let bulkResult = null;
    if (operations.length > 0) {
      bulkResult = await MaterialAssignment.bulkWrite(operations);
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
    let query = {};
    if (req.query.type === "in") {
      query.assignmentCode = { $ne: null, $exists: true };
    } else if (req.query.type === "out") {
      query.assignmentCode = { $exists: false };
    }
    const data = await MaterialAssignment.find(query)
      .populate("uom")
      .populate("assignmentCode");

    const columns = [
      { header: "Mã vật tư", key: "code", width: 20 },
      { header: "Tên vật tư", key: "name", width: 30 },
      { header: "ĐVT", key: "uom", width: 10 },
      req.query.type === "in" && {
        header: "Mã giao khoán",
        key: "assignmentCode",
        width: 20,
      },
      { header: "Số lượng", key: "quantity", width: 15 },
    ].filter(Boolean);

    const formated = (data || []).map((i) =>
      req.query.type === "in"
        ? {
          code: i?.code || "",
          name: i?.name || "",
          uom: i?.uom?.name || "",
          assignmentCode: i?.assignmentCode?.code || "",
          quantity: i?.quantity || 0,
        }
        : {
          code: i?.code || "",
          name: i?.name || "",
          uom: i?.uom?.name || "",
          quantity: i?.quantity || 0,
        }
    );

    const assignmentCodes = await AssignmentCode.find();
    const units = await Unit.find();

    const assignmentCodeList = [
      ...new Set(assignmentCodes.map((p) => p.code).filter(Boolean)),
    ];
    const unitList = [...new Set(units.map((d) => d.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("vat_tu_tai_san_trong_khoan");

    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    worksheet.getColumn("X").values = [
      "assignmentCodes",
      ...assignmentCodeList,
    ];
    worksheet.getColumn("Y").values = ["units", ...unitList];
    worksheet.getColumn("X").hidden = true;
    worksheet.getColumn("Y").hidden = true;

    const validations = [
      {
        range: `D2:D${MAX}`,
        formula: `=$X$2:$X$${assignmentCodeList.length + 1}`,
      },
      { range: `C2:C${MAX}`, formula: `=$Y$2:$Y$${unitList.length + 1}` },
    ];

    const buffer = await configExport(
      workbook,
      worksheet,
      req.query.type === "in" ? validations : [],
      MAX
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=vat_tu_tai_san_trong_khoan.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
