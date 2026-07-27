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
const { monthToNumber, dateToNumber } = require("../utils/helpers");
const mongoose = require("mongoose");
const { checkUniqueCode } = require("../utils/codeValidator");

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

    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "MaterialAssignment",
    );
    if (isDuplicate) {
      return res.status(409).json({
        status: "error",
        message: `Mã '${code.trim()}' đã tồn tại trong hệ thống`,
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

    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      id,
      "MaterialAssignment",
    );
    if (isDuplicate) {
      return res.status(409).json({
        status: "error",
        message: `Mã '${code.trim()}' đã tồn tại trong hệ thống`,
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
      })
      .sort({ code: 1 });
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
        .populate("uom")
        .sort({ code: 1 });

      const today = new Date();
      const todayStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
      const checkDate = req.query.date || todayStr;
      const checkDateNum = dateToNumber(checkDate);

      const materialsWithPrice = materials.map((item) => {
        let executionPrice = null;
        let plannedPrice = null;

        if (Array.isArray(item.priceHistory)) {
          let matched = null;
          matched = item.priceHistory.find((priceItem) => {
            const start = dateToNumber(priceItem.startDate);
            const end = dateToNumber(priceItem.endDate);
            return start <= checkDateNum && checkDateNum <= end;
          });

          if (matched) {
            executionPrice = matched.executionPrice ?? null;
            plannedPrice = matched.plannedPrice ?? null;
          }
        }

        return {
          ...item.toObject(),
          executionPrice,
          plannedPrice,
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
      const assignments = await AssignmentCode.find({ code: req.query.q });
      const assignmentId = assignments.map((i) => i._id);
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
        { assignmentCode: assignmentId },
      ];
    }
    if (req.query.type === "in") {
      // Tìm các bản ghi mà assignmentCode không phải null
      query.assignmentCode = { $ne: null };
    } else if (req.query.type === "out") {
      // Tìm các bản ghi mà assignmentCode là null (Dữ liệu bạn vừa import sẽ rơi vào đây)
      query.assignmentCode = null;
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
      {
        $unwind: { path: "$assignmentCode", preserveNullAndEmptyArrays: true },
      },
      // 2. Lookup bảng uoms (Đơn vị tính)
      {
        $lookup: {
          from: "units",
          localField: "uom",
          foreignField: "_id",
          as: "uom",
        },
      },
      { $unwind: { path: "$uom", preserveNullAndEmptyArrays: true } },
      // 3. Sắp xếp đa tầng
      {
        $sort: {
          "assignmentCode.code": 1,
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

    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
    const checkDate = req.query.date || todayStr;
    const checkDateNum = dateToNumber(checkDate);

    pagination.data = pagination.data.map((item) => {
      let executionPrice = null;
      let plannedPrice = null;

      if (Array.isArray(item.priceHistory)) {
        const matched = item.priceHistory.find((priceItem) => {
          const start = dateToNumber(priceItem.startDate);
          const end = dateToNumber(priceItem.endDate);
          return start <= checkDateNum && checkDateNum <= end;
        });

        if (matched) {
          executionPrice = matched.executionPrice ?? null;
          plannedPrice = matched.plannedPrice ?? null;
        }
      }

      return {
        ...item,
        executionPrice,
        plannedPrice,
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
    console.error(err.stack);
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
  // Format: "dd/MM/yyyy~dd/MM/yyyy=plannedPrice&executionPrice"
  // Ví dụ: "01/04/2026~01/05/2026=10000&5000"
  //         ngày bắt đầu~kết thúc = đơn giá kế hoạch&đơn giá thực hiện
  const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((item) => {
      const [range, priceStr] = item.split("=");
      if (!range || priceStr === undefined) return null;

      const [startDate, endDate] = range.split("~");

      // Parse prices: "10000&5000" → plannedPrice=10000, executionPrice=5000
      // Thứ tự: kế hoạch trước, thực hiện sau
      let executionPrice, plannedPrice;
      if (priceStr.includes("&")) {
        const [plan, exec] = priceStr.split("&");
        plannedPrice = Number(plan);
        executionPrice = Number(exec);
      } else {
        // Backward compatible: nếu chỉ có 1 giá, dùng cho cả executionPrice
        executionPrice = Number(priceStr);
        plannedPrice = null;
      }

      if (
        !DATE_REGEX.test(startDate) ||
        !DATE_REGEX.test(endDate) ||
        isNaN(executionPrice)
      ) {
        return null;
      }

      return {
        startDate,
        endDate,
        executionPrice,
        plannedPrice: isNaN(plannedPrice) ? null : plannedPrice,
        _start: dateToNumber(startDate),
        _end: dateToNumber(endDate),
      };
    })
    .filter(Boolean);
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

    // ===== 5. LOAD DATA & FK  =====
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

      // 1. Làm sạch dữ liệu đầu vào
      let cleanId = _id ? String(_id).replace(/[^a-fA-F0-9]/g, "") : null;
      const cleanCode = code ? String(code).trim() : null;
      const cleanName = name ? String(name).trim() : null;

      // 2. LOGIC XÓA (Giữ từ bản cũ của bạn)
      if (cleanId && !cleanCode && !cleanName) {
        if (cleanId.length === 24) {
          operations.push({ deleteOne: { filter: { _id: cleanId } } });
          continue;
        } else {
          invalidRows.push({ row: rowIndex, error: "ID để xóa không hợp lệ" });
          continue;
        }
      }

      // 3. VALIDATE BẮT BUỘC
      if (!cleanCode || !cleanName) {
        invalidRows.push({
          row: rowIndex,
          error: "Mã và Tên vật tư là bắt buộc",
        });
        continue;
      }

      // 4. Xử lý FK AssignmentCode
      let acId = null;
      if (assignmentCode) {
        const foundAcId = assignmentCodeMap.get(String(assignmentCode).trim());
        if (foundAcId) acId = String(foundAcId);
        else {
          invalidRows.push({
            row: rowIndex,
            error: `Không tìm thấy Mã giao khoán '${assignmentCode}'`,
          });
          continue;
        }
      }

      // 5. Xử lý ĐVT và Lịch sử giá
      const uomName = uom ? String(uom).trim() : null;
      updateData.uom = uomName ? unitMap.get(uomName) : null;

      const cleanPriceStr = price ? String(price).trim() : "";
      let history = [];
      if (cleanPriceStr && typeof parsePriceRanges === "function") {
        history = parsePriceRanges(cleanPriceStr);
      }
      console.log(history);

      // --- LOGIC KIỂM TRA THỜI GIAN (BẮT ĐẦU) ---
      if (history.length > 0) {
        let hasTimeError = false;

        // Tạm thời chuẩn hóa để so sánh số (YYYYMMDD)
        const normalized = history.map((h) => ({
          ...h,
          _start: dateToNumber(h.startDate),
          _end: dateToNumber(h.endDate),
        }));

        // 1️⃣ Check start <= end
        for (const h of normalized) {
          if (h._start > h._end) {
            invalidRows.push({
              row: rowIndex,
              error: `Khoảng thời gian không hợp lệ: ${h.startDate} > ${h.endDate}`,
            });
            hasTimeError = true;
            break;
          }
        }
        if (hasTimeError) continue; // Bỏ qua dòng này, sang dòng tiếp theo trong file Excel

        // 2️⃣ Sort theo thời gian bắt đầu
        normalized.sort((a, b) => a._start - b._start);

        // 3️⃣ Check overlap (Chồng chéo)
        for (let i = 0; i < normalized.length - 1; i++) {
          if (normalized[i + 1]._start <= normalized[i]._end) {
            invalidRows.push({
              row: rowIndex,
              error: `Thời gian bị chồng chéo: ${normalized[i].startDate}->${normalized[i].endDate} và ${normalized[i + 1].startDate}->${normalized[i + 1].endDate}`,
            });
            hasTimeError = true;
            break;
          }
        }
        if (hasTimeError) continue; // Bỏ qua dòng này

        // Nếu mọi thứ ok, gán lại history đã sort cho sạch sẽ
        updateData.priceHistory = normalized.map(
          ({ _start, _end, ...rest }) => rest,
        );
      } else {
        updateData.priceHistory = [];
      }

      // 6. Xử lý Số lượng (Chỉ cho phép nếu có Mã GK)
      if (acId && quantity !== undefined && quantity !== null) {
        const q = Number(quantity);
        updateData.quantity = isNaN(q) ? 0 : q;
      } else {
        delete updateData.quantity; // Loại bỏ quantity nếu là vật tư "out"
      }

      // 7. Check trùng để quyết định Update hay Insert
      const s_acId = acId ? String(acId) : "null";
      const compositeKey = `${cleanCode.toLowerCase()}|${s_acId}`;
      const existedRecord = compositeMap.get(compositeKey);

      let filter = null;
      if (cleanId && cleanId.length === 24) {
        filter = { _id: cleanId }; // Ưu tiên ID từ file
      } else if (existedRecord) {
        filter = { _id: existedRecord.id }; // Nếu trùng cặp Mã VT|GK thì lấy ID cũ
      }

      // Kiểm tra mã trùng toàn cục
      const checkGlobalId = filter ? filter._id : null;
      const checkGlobal = await checkUniqueCode(
        cleanCode,
        checkGlobalId,
        "MaterialAssignment",
      );
      if (checkGlobal.isDuplicate) {
        invalidRows.push({
          row: rowIndex,
          error: `Mã đã tồn tại trong danh mục ${checkGlobal.collectionName}: ${cleanCode}`,
        });
        continue;
      }

      const finalDoc = {
        code: cleanCode,
        name: cleanName,
        assignmentCode: acId,
        uom: updateData.uom,
        priceHistory: updateData.priceHistory,
        ...updateData,
      };

      if (filter) {
        operations.push({ updateOne: { filter, update: { $set: finalDoc } } });
      } else {
        operations.push({ insertOne: { document: finalDoc } });
      }

      // Cập nhật map tạm
      compositeMap.set(compositeKey, {
        id: filter?._id || "temp",
        name: cleanName,
      });
    }

    // ===== 8. EXECUTE & SUMMARY =====
    const bulkResult =
      operations.length > 0
        ? await MaterialAssignment.bulkWrite(operations)
        : null;

    return res.status(200).json({
      status: "success",
      summary: {
        totalProcessed: dataImport.length,
        insertedCount: bulkResult?.insertedCount || bulkResult?.nInserted || 0,
        updatedCount:
          bulkResult?.modifiedCount ||
          bulkResult?.nModified ||
          bulkResult?.nMatched ||
          0,
        deletedCount: bulkResult?.deletedCount || bulkResult?.nRemoved || 0,
      },
      invalidRows: invalidRows || [],
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
      query.assignmentCode = { $ne: null };
    } else if (req.query.type === "out") {
      query.assignmentCode = null;
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
      typeIn && { header: "Số lượng", key: "quantity", width: 15 },
      { header: "Đơn giá", key: "price", width: 100 },
      { header: "_id", key: "_id", width: 0 },
    ].filter(Boolean);

    const formatPriceRanges = (prices = []) =>
      prices
        .map((p) => {
          const planPrice = p.plannedPrice || 0;
          const execPrice = p.executionPrice || 0;
          // Format: dd/MM/yyyy~dd/MM/yyyy=plannedPrice&executionPrice
          // Thứ tự: kế hoạch trước, thực hiện sau
          return `${p.startDate}~${p.endDate}=${planPrice}&${execPrice}`;
        })
        .join(",");

    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      uom: i?.uom?.name || "",
      ...(typeIn ? { assignmentCode: i?.assignmentCode?.code || "" } : {}),
      ...(typeIn ? { quantity: i?.quantity || 0 } : {}),
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
