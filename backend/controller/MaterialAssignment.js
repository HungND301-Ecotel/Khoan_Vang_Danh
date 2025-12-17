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
const {
  updatePriceAssignmentCode,
} = require("../utils/recalculateAssignmentCodePrice");

const monthToNumber = (month) => month ? Number(month.replace('-', '')) : ''

exports.create = async (req, res) => {
  try {
    const { code, name, assignmentCode, uom, quantity, priceHistory } =
      req.body;

    const exitMaterial = await MaterialAssignment.countDocuments({ code: code })
    if (exitMaterial > 0) {
      return res.status(409).json({ status: 'error', message: `Vật tư, tài sản '${name}' đã tồn tại` })
    }
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
    if (deleteData?.assignmentCode) {
      await updatePriceAssignmentCode(deleteData?.assignmentCode);
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

      const materials = await MaterialAssignment.find({
        assignmentCode: assignment._id,
      })
        .populate("assignmentCode")
        .populate("uom");

      const today = new Date();
      const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      const materialsWithPrice = materials.map((item) => {
        let currentPrice = null;

        if (Array.isArray(item.priceHistory)) {
          const matched = item.priceHistory.find((priceItem) => {
            return priceItem.month === currentYearMonth;
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

    const today = new Date()
    const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`

    const currentMonthNum = monthToNumber(currentYearMonth)

    pagination.data = pagination.data.map((item) => {
      let currentPrice = null

      if (Array.isArray(item.priceHistory)) {
        const matched = item.priceHistory.find((priceItem) => {
          const start = monthToNumber(priceItem.startMonth)
          const end = monthToNumber(priceItem.endMonth)
          return start <= currentMonthNum && currentMonthNum <= end
        })

        if (matched) currentPrice = matched.price
      }

      return {
        ...item.toObject(),
        currentPrice,
      }
    })


    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};


exports.getCount = async (req, res) => {
  try {
    const counts = await MaterialAssignment.aggregate([
      {
        $facet: {
          // 1. Đếm số lượng Material có mã giao khoán (maGiaoKhoan is NOT null/undefined)
          withAssignment: [
            {
              // Lọc các bản ghi có maGiaoKhoan khác null
              $match: { assignmentCode: { $ne: null } } // Giả sử null/undefined là "không có"
            },
            {
              // Đếm số lượng kết quả
              $count: "count"
            }
          ],

          // 2. Đếm số lượng Material KHÔNG có mã giao khoán (maGiaoKhoan IS null/undefined)
          withoutAssignment: [
            {
              // Lọc các bản ghi có maGiaoKhoan là null (hoặc không tồn tại)
              $match: { assignmentCode: null }
            },
            {
              // Đếm số lượng kết quả
              $count: "count"
            }
          ],
          totalCount: [
            {
              // Đếm tất cả các bản ghi đi vào $facet
              $count: "count"
            }
          ]
        }
      }
    ]);

    // Xử lý kết quả trả về từ $facet
    const result = {
      // Lấy giá trị count (nếu có), nếu mảng rỗng thì là 0
      countWithAssignment: counts[0].withAssignment[0]?.count || 0,
      countWithoutAssignment: counts[0].withoutAssignment[0]?.count || 0,
      totalCount: counts[0].totalCount[0]?.count || 0,
    };

    res.status(200).json({
      status: "success",
      data: result
    });

  } catch (err) {
    console.error(err.stack); // Dùng console.error thay vì console.log cho lỗi
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Mã vật tư": "code",
  "Tên vật tư": "name",
  ĐVT: "uom",
  "Mã giao khoán": "assignmentCode",
  "Số lượng": "quantity", // Bổ sung keys cho logic Update/Delete
  id: "_id",
  _id: "_id", // Bổ sung keys cho các cột ẩn (dropdown lists)
  assignmentCodes: "ignored",
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

    const uniqueAssignmentCodes = [
      ...new Set(
        dataImport.map((d) => String(d.assignmentCode).trim()).filter(Boolean)
      ),
    ];
    const uniqueUnits = [
      ...new Set(dataImport.map((d) => String(d.uom).trim()).filter(Boolean)),
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
      // Loại bỏ cột ignored
      if (item.ignored !== undefined) delete item.ignored;

      let { _id, code, name, assignmentCode, uom, quantity, ...updateData } =
        item;

      // --- CLEANUP _id ---
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      } // --- Xử lý Tham chiếu và Dữ liệu ---

      let finalUpdateData = { ...updateData };
      let isItemValid = true; // 1. Xử lý assignmentCode

      if (assignmentCode) {
        const trimmedAssignmentCode = String(assignmentCode).trim();
        const assignmentCodeId = assignmentCodeMap.get(trimmedAssignmentCode);
        if (!assignmentCodeId) {
          invalidRows.push({
            item,
            error: `Mã giao khoán không hợp lệ: ${assignmentCode}`,
          });
          isItemValid = false;
          continue;
        }
        finalUpdateData.assignmentCode = assignmentCodeId;
      } // 2. Xử lý uom

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

      // 3. Xử lý Quantity (chuyển sang dạng số, nếu cần)
      if (quantity !== undefined && quantity !== null) {
        const numericQuantity = parseFloat(quantity);
        if (!isNaN(numericQuantity)) {
          finalUpdateData.quantity = numericQuantity;
        } else {
          finalUpdateData.quantity = 0;
        }
      }

      if (!isItemValid) continue;

      // ------- CASE 1: Có _id → update hoặc delete -------
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
                ...finalUpdateData, // Bao gồm FKs và quantity
              },
            },
            upsert: true,
          },
        });
        continue;
      }

      // ------- CASE 2: Không có _id nhưng có code và name → upsert theo cặp (code, name) -------
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
                ...finalUpdateData, // Bao gồm FKs và quantity
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
    const typeIn = req.query.type === "in";

    if (typeIn) {
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
      typeIn && {
        header: "Mã giao khoán",
        key: "assignmentCode",
        width: 20,
      },
      { header: "Số lượng", key: "quantity", width: 15 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ].filter(Boolean);

    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      uom: i?.uom?.name || "",
      ...(typeIn ? { assignmentCode: i?.assignmentCode?.code || "" } : {}),
      quantity: i?.quantity || 0,
      _id: i?._id || "", // Thêm _id
    }));

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

    const MAX = Math.max(worksheet.rowCount + 100, 1000); // Ẩn cột id

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const editableKeys = ["code", "name", "uom", "quantity"];
    // --- KHỐI LOGIC DROP DOWN BẮT ĐẦU ---
    // Cột ĐVT luôn được thêm vào cột Y
    const uomColIndex = columns.findIndex((c) => c && c.key === "uom"); // Cột ĐVT
    const uomColLetter = worksheet.getColumn(uomColIndex + 1).letter;

    worksheet.getColumn("Y").values = ["units", ...unitList];
    worksheet.getColumn("Y").hidden = true;

    // Áp dụng Data Validation cho cột ĐVT (luôn luôn)
    worksheet.dataValidations.add(`${uomColLetter}2:${uomColLetter}${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$Y$2:$Y$${unitList.length + 1}`],
    });

    // Logic cho type="in" (Xử lý cột Mã giao khoán)
    if (typeIn) {
      const assignmentColIndex = columns.findIndex(
        (c) => c && c.key === "assignmentCode"
      );
      const assignmentColLetter = worksheet.getColumn(
        assignmentColIndex + 1
      ).letter;

      // Thêm cột X cho Mã giao khoán
      worksheet.getColumn("X").values = [
        "assignmentCodes",
        ...assignmentCodeList,
      ];
      worksheet.getColumn("X").hidden = true;

      // Áp dụng Data Validation cho Mã giao khoán
      worksheet.dataValidations.add(
        `${assignmentColLetter}2:${assignmentColLetter}${MAX}`,
        {
          type: "list",
          allowBlank: true,
          formulae: [`=$X$2:$X$${assignmentCodeList.length + 1}`],
        }
      );

      editableKeys.push("assignmentCode"); // Cho phép sửa cột này
    }

    // --- KHỐI LOGIC DROP DOWN KẾT THÚC ---

    const buffer = await configExport(
      workbook,
      worksheet,
      editableKeys, // Truyền đúng editableKeys
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
