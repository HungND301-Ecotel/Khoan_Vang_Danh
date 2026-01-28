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
  recalculateAssignmentCodePrice,
} = require("../utils/recalculateAssignmentCodePrice");
const { monthToNumber } = require("../utils/helpers");
const mongoose = require("mongoose");

exports.create = async (req, res) => {
  try {
    const { code, name, assignmentCode, uom, quantity, priceHistory } =
      req.body;

    const exitMaterial = await MaterialAssignment.countDocuments({
      code: code,
      assignmentCode: assignmentCode,
    });
    if (exitMaterial > 0) {
      return res.status(409).json({
        status: "error",
        message: `Mã giao khoán và mã vật tư này đã là của vật tư, tài sản '${name}' `,
      });
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
    const { id } = req.params;
    const { code, assignmentCode, name } = req.body;

    const duplicateMaterial = await MaterialAssignment.findOne({
      code: code,
      assignmentCode: assignmentCode,
      _id: { $ne: id },
    });

    if (duplicateMaterial) {
      return res.status(409).json({
        status: "error",
        message: `Mã giao khoán và mã vật tư này đã tồn tại ở vật tư/tài sản '${duplicateMaterial.name}'`,
      });
    }

    const updateData = await MaterialAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
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
      req.params.id,
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
      req.query,
    );

    const result = [];

    for (const assignment of pagination.data) {
      const materials = await MaterialAssignment.find({
        assignmentCode: assignment._id,
      })
        .populate("assignmentCode")
        .populate("uom");

      const today = new Date();
      const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const materialsWithPrice = materials.map((item) => {
        let currentPrice = null;

        if (Array.isArray(item.priceHistory)) {
          let matched = null;
          if (req.query.month) {
            matched = item.priceHistory.find((priceItem) => {
              const start = monthToNumber(priceItem.startMonth);
              const end = monthToNumber(priceItem.endMonth);
              const check = monthToNumber(req.query.month);
              return start <= check && check <= end;
            });
          } else {
            matched = item.priceHistory.find((priceItem) => {
              const start = monthToNumber(priceItem.startMonth);
              const end = monthToNumber(priceItem.endMonth);
              const month = monthToNumber(currentYearMonth);
              return start <= month && month <= end;
            });
          }

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
        price: await recalculateAssignmentCodePrice(
          assignment._id,
          null,
          null,
          req.query.month || currentYearMonth,
        ),
        device: assignment.deviceCode?.code,
        materials: materialsWithPrice,
      });
    }
    const unassignedMaterials = await MaterialAssignment.find({
      $or: [{ assignmentCode: null }, { assignmentCode: { $exists: false } }],
    }).populate("uom");
    if (unassignedMaterials.length > 0) {
      result.push({
        _id: "unassigned",
        name: "Vật tư không có định mức",
        code: "",
        uom: "",
        price: null,
        device: "",
        materials: unassignedMaterials.map((item) => {
          let currentPrice = null;

          if (Array.isArray(item.priceHistory)) {
            const today = new Date();
            const currentYearMonth =
              req.query.month ||
              `${today.getFullYear()}-${(today.getMonth() + 1)
                .toString()
                .padStart(2, "0")}`;

            const matched = item.priceHistory.find((priceItem) => {
              const start = monthToNumber(priceItem.startMonth);
              const end = monthToNumber(priceItem.endMonth);
              const month = monthToNumber(currentYearMonth);
              return start <= month && month <= end;
            });

            if (matched) currentPrice = matched.price;
          }

          return {
            ...item.toObject(),
            currentPrice,
          };
        }),
      });
    }

    pagination.data = result;

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
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
    let pipeline = [
      { $match: query },
      // 1. Lookup bảng assignmentcodes
      {
        $lookup: {
          from: "assignmentcodes",
          localField: "assignmentCode",
          foreignField: "_id",
          as: "assignmentCode",
        },
      },
      { $unwind: "$assignmentCode" },
      // 2. Lookup bảng uoms (Đơn vị tính)
      {
        $lookup: {
          from: "units",
          localField: "uom",
          foreignField: "_id",
          as: "uom",
        },
      },
      { $unwind: "$uom" },
      // 3. Sắp xếp đa tầng
      {
        $sort: {
          "assignmentCode.code": 1, // Sắp xếp theo mã giao khoán trước
        },
      },
    ];
    let queryModel = MaterialAssignment.aggregate(pipeline);
    const pagination = await paginateQuery(
      MaterialAssignment,
      queryModel,
      query,
      req.query,
    );
    console.log(pagination);

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    const currentMonthNum = monthToNumber(currentYearMonth);

    pagination.data = pagination.data.map((item) => {
      let currentPrice = null;

      if (Array.isArray(item.priceHistory)) {
        const matched = item.priceHistory.find((priceItem) => {
          const start = monthToNumber(priceItem.startMonth);
          const end = monthToNumber(priceItem.endMonth);
          return start <= currentMonthNum && currentMonthNum <= end;
        });

        if (matched) currentPrice = matched.price;
      }

      return {
        ...item,
        currentPrice,
      };
    });

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
              $match: { assignmentCode: { $ne: null } }, // Giả sử null/undefined là "không có"
            },
            {
              // Đếm số lượng kết quả
              $count: "count",
            },
          ],

          // 2. Đếm số lượng Material KHÔNG có mã giao khoán (maGiaoKhoan IS null/undefined)
          withoutAssignment: [
            {
              // Lọc các bản ghi có maGiaoKhoan là null (hoặc không tồn tại)
              $match: { assignmentCode: null },
            },
            {
              // Đếm số lượng kết quả
              $count: "count",
            },
          ],
          totalCount: [
            {
              // Đếm tất cả các bản ghi đi vào $facet
              $count: "count",
            },
          ],
        },
      },
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
      data: result,
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
  "Đơn giá": "price", // Bổ sung keys cho logic Update/Delete
  id: "_id",
  _id: "_id", // Bổ sung keys cho các cột ẩn (dropdown lists)
  assignmentCodes: "ignored",
  units: "ignored",
};

const parsePriceRanges = (value) => {
  if (!value || typeof value !== "string") return [];

  const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

  const parsed = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((item) => {
      const [range, price] = item.split("=");
      if (!range || price === undefined) return null;

      const [startMonth, endMonth] = range.split("~");
      const numericPrice = Number(price);

      // ❌ format sai
      if (
        !MONTH_REGEX.test(startMonth) ||
        !MONTH_REGEX.test(endMonth) ||
        isNaN(numericPrice)
      )
        return null;

      // ❌ start > end
      if (startMonth > endMonth) return null;

      return {
        startMonth,
        endMonth,
        price: numericPrice,
        _start: monthToNumber(startMonth),
        _end: monthToNumber(endMonth),
      };
    })
    .filter(Boolean);

  if (parsed.length === 0) return [];

  // sort theo tháng bắt đầu
  parsed.sort((a, b) => a._start - b._start);

  // ❌ Loại bỏ khoảng bị trùng / đè / bọc
  const result = [];
  for (const item of parsed) {
    const last = result[result.length - 1];

    if (!last) {
      result.push(item);
      continue;
    }

    // Nếu overlap → bỏ item hiện tại
    if (item._start <= last._end) {
      continue;
    }

    result.push(item);
  }

  // cleanup field tạm
  return result.map(({ _start, _end, ...rest }) => rest);
};

exports.import = async (req, res) => {
  try {
    // ===== 1. CHECK FILE & READ EXCEL (Giữ nguyên) =====
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // ===== 3. HEADER & MAPPING =====
    let headers =
      xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: true })[0] || [];
    headers = headers.map((h) => String(h).trim());

    const mappedHeaders = headers.map((h) => columnMapping[h] || h);

    // ===== 4. DATA =====
    const dataImport = xlsx.utils
      .sheet_to_json(worksheet, { header: mappedHeaders, range: 1 })
      .filter((r) => r._id || r.code || r.name);

    if (dataImport.length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Không tìm thấy dữ liệu hợp lệ" });
    }

    // ===== 5. LOAD DATA & FK (Giữ nguyên phần query của bạn) =====
    const [existedMaterials, assignmentCodes, units] = await Promise.all([
      MaterialAssignment.find(
        {},
        { code: 1, assignmentCode: 1, name: 1 },
      ).lean(),
      AssignmentCode.find({}).lean(), // Lấy hết để map cho nhanh
      Unit.find({}).lean(),
    ]);

    const compositeMap = new Map(
      existedMaterials.map((m) => {
        // Đảm bảo assignmentCode luôn là chuỗi, nếu null thì thành chuỗi "null"
        const s_acId = m.assignmentCode ? String(m.assignmentCode) : "null";
        const key = `${String(m.code).toLowerCase().trim()}|${s_acId}`;

        return [key, { id: String(m._id), name: m.name }];
      }),
    );

    const assignmentCodeMap = new Map(
      assignmentCodes.map((a) => [a.code, a._id]),
    );
    const unitMap = new Map(units.map((u) => [u.name, u._id]));

    // ===== 7. PROCESS =====
    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      const rowIndex = dataImport.indexOf(item) + 2;

      let {
        _id,
        code,
        name,
        assignmentCode,
        uom,
        quantity,
        price,
        ...updateData
      } = item;

      // ----- CLEAN ID TRIỆT ĐỂ (Sửa ở đây) -----
      let cleanId = null;
      if (_id) {
        cleanId = String(_id).replace(/[^a-fA-F0-9]/g, "");
      }

      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      // ----- LOGIC XÓA -----
      // Nếu có ID mà không có Code và Name -> Ưu tiên xóa
      if (cleanId && !cleanCode && !cleanName) {
        if (cleanId.length === 24) {
          operations.push({ deleteOne: { filter: { _id: cleanId } } });
          continue;
        } else {
          invalidRows.push({ row: rowIndex, error: "ID để xóa không hợp lệ" });
          continue;
        }
      }

      // ----- VALIDATE BẮT BUỘC -----
      if (!cleanCode || !cleanName) {
        invalidRows.push({
          row: rowIndex,
          error: "Mã và Tên vật tư là bắt buộc",
        });
        continue;
      }

      // Xử lý FK AssignmentCode
      let acId = null;
      if (assignmentCode) {
        const foundAcId = assignmentCodeMap.get(String(assignmentCode).trim());
        if (foundAcId) {
          acId = String(foundAcId);
        } else {
          invalidRows.push({
            row: rowIndex,
            error: `Mã giao khoán '${assignmentCode}' không tồn tại`,
          });
          continue;
        }
      }

      // CHECK TRÙNG KẾT HỢP
      const compositeKey = `${cleanCode.toLowerCase()}|${acId}`;
      const existedRecord = compositeMap.get(compositeKey);

      if (existedRecord) {
        if (cleanId && String(existedRecord.id) !== cleanId) {
          invalidRows.push({
            row: rowIndex,
            error: `Cặp Mã giao khoán và Mã vật tư này đã tồn tại ở vật tư khác: '${existedRecord.name}'`,
          });
          continue;
        }

        if (!cleanId) {
          invalidRows.push({
            row: rowIndex,
            error: `Cặp Mã giao khoán và Mã vật tư này đã tồn tại trong hệ thống (Tên: '${existedRecord.name}')`,
          });
          continue;
        }
      }

      console.log("--- Row Check ---");
      console.log("Composite Key từ File:", compositeKey);
      console.log("Clean ID từ File:", cleanId);
      console.log("Record tìm thấy trong Map:", existedRecord);
      if (existedRecord) {
        console.log("So sánh ID:", String(existedRecord.id), " vs ", cleanId);
        console.log(
          "Kết quả so sánh (!==):",
          String(existedRecord.id) !== cleanId,
        );
      }

      // Parse Price History (Nếu bạn có hàm parsePriceRanges)
      if (price)
        updateData.priceHistory =
          typeof parsePriceRanges === "function" ? parsePriceRanges(price) : [];

      // Map Unit
      if (uom) {
        const uomId = unitMap.get(String(uom).trim());
        if (uomId) updateData.uom = uomId;
      }

      if (quantity !== undefined && quantity !== null) {
        const q = Number(quantity);
        updateData.quantity = isNaN(q) ? 0 : q;
      }

      // ----- PHÂN LOẠI UPDATE / INSERT (Dùng cleanId) -----
      if (cleanId && cleanId.length === 24) {
        operations.push({
          updateOne: {
            filter: { _id: cleanId },
            update: {
              $set: {
                code: cleanCode,
                name: cleanName,
                assignmentCode: acId,
                ...updateData,
              },
            },
          },
        });
      } else {
        operations.push({
          insertOne: {
            document: {
              code: cleanCode,
              name: cleanName,
              assignmentCode: acId,
              ...updateData,
            },
          },
        });
      }

      // Cập nhật map tạm để tránh trùng trong cùng 1 file
      compositeMap.set(compositeKey, {
        id: cleanId || "temp",
        name: cleanName,
      });
    }

    // ===== 8. EXECUTE & SUMMARY =====
    const bulkResult =
      operations.length > 0
        ? await MaterialAssignment.bulkWrite(operations)
        : null;

    // Trả về cấu trúc summary y hệt file 5 loại định mức để Frontend dùng chung Dialog
    return res.status(200).json({
      status: "success",
      summary: {
        total: dataImport.length,
        inserted: bulkResult?.insertedCount || 0,
        updated: bulkResult?.modifiedCount || 0,
        deleted: bulkResult?.deletedCount || 0, // Đã bao gồm deletedCount từ bulkWrite
        failed: invalidRows.length,
      },
      invalidRows, // Bây giờ mỗi row đã có { row: rowIndex, error: "..." }
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
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
      { header: "Đơn giá", key: "price", width: 100 },
      { header: "_id", key: "_id", width: 0 },
    ].filter(Boolean);

    const formatPriceRanges = (prices = []) =>
      prices.map((p) => `${p.startMonth}~${p.endMonth}=${p.price}`).join(",");

    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      uom: i?.uom?.name || "",
      ...(typeIn ? { assignmentCode: i?.assignmentCode?.code || "" } : {}),
      quantity: i?.quantity || 0,
      price: formatPriceRanges(i?.priceHistory || []),
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

    const editableKeys = ["code", "name", "uom", "quantity", "price"];
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
        (c) => c && c.key === "assignmentCode",
      );
      const assignmentColLetter = worksheet.getColumn(
        assignmentColIndex + 1,
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
        },
      );

      editableKeys.push("assignmentCode"); // Cho phép sửa cột này
    }

    // --- KHỐI LOGIC DROP DOWN KẾT THÚC ---

    const buffer = await configExport(
      workbook,
      worksheet,
      editableKeys, // Truyền đúng editableKeys
      MAX,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=vat_tu_tai_san_trong_khoan.xlsx",
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
