const AdjustmentNorm = require("../model/AdjustmentNorm");
const AssignmentCode = require("../model/AssignmentCode");
const Hardness = require("../model/Hardness");
const MirrorRatio = require("../model/MirrorRatio");
const { AdjustmentType } = require("../config/constant");
const RockRatio = require("../model/RockRatio");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { checkUniqueCode } = require("../utils/codeValidator");

const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { code, mirrorRatio, hardness, rockRatio, type, norms } = req.body;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "AdjustmentNorm",
    );
    if (isDuplicate) {
      return res.status(409).json({
        status: "error",
        message: `Mã hệ số điều chỉnh định mức '${code}' đã tồn tại trong hệ thống`,
      });
    }
    const newAdjustmentNorm = new AdjustmentNorm({
      code,
      hardness,
      mirrorRatio,
      rockRatio,
      type,
      norms,
    });
    await newAdjustmentNorm.save();
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
        "AdjustmentNorm",
      );
      if (isDuplicate) {
        return res.status(409).json({
          status: "error",
          message: `Mã hệ số điều chỉnh định mức '${code}' đã tồn tại trong hệ thống`,
        });
      }
    }

    const updateData = await AdjustmentNorm.findByIdAndUpdate(
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

    const result = await AdjustmentNorm.deleteMany({ _id: { $in: ids } });
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
      query.code = new RegExp(req.query.q, "i");
    }
    if (req.query.type) {
      query.type = new RegExp(req.query.type, "i");
    }
    const modelQuery = AdjustmentNorm.find(query)
      .populate("mirrorRatio")
      .populate("rockRatio")
      .populate("hardness")
      .populate({
        path: "norms.assignmentCode",
        populate: "uom",
      });
    const pagination = await paginateQuery(
      AdjustmentNorm,
      modelQuery,
      query,
      req.query,
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Mã định mức": "code",
  "Độ cứng f": "hardness",
  "Tỷ lệ đá lẫn trong gương": "rockRatio",
  "Tỷ lệ gương than mềm": "mirrorRatio",
  "Định mức": "norms",
  id: "_id",
  _id: "_id", // Bổ sung keys cho các cột ẩn (dropdown lists)
  hardness: "ignored",
  rockRatios: "ignored",
  mirrorRatios: "ignored",
};

const parseNorms = (normsString, assignmentCodeMap) => {
  if (!normsString || typeof normsString !== "string") return [];

  return normsString
    .split(",")
    .map((pair) => {
      const [code, value] = pair.split("=");
      const trimmedCode = code?.trim();
      const normValue = parseFloat(value);

      const assignmentId = assignmentCodeMap.get(trimmedCode);

      if (assignmentId && !isNaN(normValue)) {
        return {
          assignmentCode: assignmentId,
          norm: normValue,
        };
      }
      return null;
    })
    .filter(Boolean); // Loại bỏ các cặp không hợp lệ hoặc không tìm thấy code
};

const mongoose = require("mongoose");
exports.import = async (req, res) => {
  try {
    const type = req.query.type; // "CKKT", "CKĐL", hoặc "CM"
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });

    // Đọc file theo dạng Matrix (header: 1 trả về mảng 2 chiều [hàng][cột])
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (!matrix || matrix.length === 0) {
      return res.status(400).json({ status: "error", message: "File rỗng" });
    }

    let rowMap = {};
    let idRow = 0; // Dòng 1 chứa ID (hidden)
    let assignmentCodeStartRow = -1;

    // 1. Tự động ánh xạ dòng dựa trên cột A
    // Ánh xạ các nhãn tiếng Việt sang key trong DB
    const headerMapping = {
      "Độ cứng f": "hardness",
      "Tỷ lệ đá lẫn trong gương": "rockRatio",
      "Tỷ lệ gương than mềm": "mirrorRatio",
      "Mã định mức": "code",
    };

    matrix.forEach((row, idx) => {
      const headerText = String(row[0] || "").trim();
      if (headerMapping[headerText]) {
        rowMap[headerMapping[headerText]] = idx;
      }
      if (headerText === "Mã định mức") assignmentCodeStartRow = idx + 1;
    });

    if (assignmentCodeStartRow === -1) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dòng 'Mã định mức' để bắt đầu đọc dữ liệu",
      });
    }

    // 2. Load Danh mục (FK) để map Name -> ObjectId
    const [rockRatios, mirrorRatios, hardnessList, asCodes] = await Promise.all(
      [
        RockRatio.find().lean(),
        MirrorRatio.find().lean(),
        Hardness.find().lean(),
        AssignmentCode.find().lean(),
      ],
    );

    const maps = {
      rockRatio: new Map(
        rockRatios.map((d) => [d.name.toString().trim(), d._id]),
      ),
      mirrorRatio: new Map(
        mirrorRatios.map((d) => [d.name.toString().trim(), d._id]),
      ),
      hardness: new Map(
        hardnessList.map((d) => [d.name.toString().trim(), d._id]),
      ),
      asCode: new Map(asCodes.map((d) => [d.code.toString().trim(), d._id])),
    };

    const operations = [];
    const invalidRows = []; // Dùng để báo lỗi theo cột

    // Xác định giới hạn cột (bỏ qua phần dropdown ẩn từ cột 200)
    const HIDDEN_START_INDEX = 199;
    const totalColsInFile = matrix[idRow] ? matrix[idRow].length : 0;
    const safeLimit = Math.min(totalColsInFile, HIDDEN_START_INDEX);

    // 3. Duyệt theo CỘT (Bắt đầu từ cột B - index 1)
    for (let c = 1; c < safeLimit; c++) {
      const recordId = String(matrix[idRow][c] || "").trim();
      const cleanCode =
        rowMap.code !== undefined && matrix[rowMap.code]
          ? String(matrix[rowMap.code][c] || "").trim()
          : "";

      // Bỏ qua cột trống (Cột danh mục hoặc cột chưa nhập liệu)
      if (!recordId && !cleanCode) continue;

      const colName = getColumnName(c + 1);

      // Thu thập trị số định mức (Norms) cho cột này
      const processedNorms = [];
      for (let r = assignmentCodeStartRow; r < matrix.length; r++) {
        if (!matrix[r]) continue;
        const acCode = String(matrix[r][0] || "").trim();
        const val = parseFloat(matrix[r][c]);

        if (acCode && !isNaN(val)) {
          const acId = maps.asCode.get(acCode);
          if (acId) {
            processedNorms.push({ assignmentCode: acId, norm: val });
          }
        }
      }

      // Logic XÓA: Có ID nhưng không còn mã định mức hoặc không còn số liệu
      if (
        recordId &&
        recordId.length === 24 &&
        !cleanCode &&
        processedNorms.length === 0
      ) {
        operations.push({ deleteOne: { filter: { _id: recordId } } });
        continue;
      }

      // Logic THÊM / SỬA
      if (cleanCode) {
        const { isDuplicate, collectionName } = await checkUniqueCode(
          cleanCode,
          recordId?.length === 24 ? recordId : null,
          "AdjustmentNorm",
        );
        if (isDuplicate) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: `Mã đã tồn tại trong danh mục ${collectionName}: ${cleanCode}`,
          });
          continue;
        }

        const dataObj = { type, code: cleanCode, norms: processedNorms };
        let hasCategoryError = false;

        // Map các FK (Hardness, RockRatio, MirrorRatio)
        for (const key of Object.keys(rowMap)) {
          if (key === "code") continue; // Đã xử lý riêng cleanCode
          const val = String(matrix[rowMap[key]][c] || "").trim();

          if (val) {
            const id = maps[key]?.get(val);
            if (id) {
              dataObj[key] = id;
            } else {
              invalidRows.push({
                row: `Cột ${colName}`,
                error: `Giá trị '${val}' không tồn tại trong danh mục của hàng '${Object.keys(headerMapping).find((k) => headerMapping[k] === key)}'`,
              });
              hasCategoryError = true;
              break;
            }
          } else {
            dataObj[key] = null; // Reset nếu để trống
          }
        }

        if (hasCategoryError) continue;

        if (recordId && recordId.length === 24) {
          operations.push({
            updateOne: { filter: { _id: recordId }, update: { $set: dataObj } },
          });
        } else {
          // Nếu không có ID, thực hiện upsert theo Code + Type để tránh trùng
          operations.push({
            updateOne: {
              filter: { code: cleanCode, type: type },
              update: { $set: dataObj },
              upsert: true,
            },
          });
        }
      }
    }

    // 4. Thực thi BulkWrite
    const result =
      operations.length > 0 ? await AdjustmentNorm.bulkWrite(operations) : null;

    res.status(200).json({
      status: "success",
      message: "Import dữ liệu ma trận thành công",
      summary: {
        totalProcessed: operations.length + invalidRows.length,
        inserted: (result?.upsertedCount || 0) + (result?.insertedCount || 0),
        updated: result?.modifiedCount || 0,
        deleted: result?.deletedCount || 0,
        failed: invalidRows.length,
      },
      invalidRows, // Trả về chi tiết lỗi theo cột
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};
exports.export = async (req, res) => {
  try {
    const type = req.query.type;
    const [
      allAssignmentCodes,
      allNorms,
      hardnessList,
      rockRatioList,
      mirrorRatioList,
    ] = await Promise.all([
      AssignmentCode.find().sort({ code: 1 }).lean(),
      AdjustmentNorm.find({ type: new RegExp(type, "i") })
        .populate("mirrorRatio rockRatio hardness norms.assignmentCode")
        .lean(),
      Hardness.find().lean(),
      RockRatio.find().lean(),
      MirrorRatio.find().lean(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Matrix");

    const rowConfigs = [
      {
        label: "Độ cứng f",
        key: "hardness",
        list: hardnessList,
        types: ["CKKT", "CKĐL"],
      },
      {
        label: "Tỷ lệ đá lẫn trong gương",
        key: "rockRatio",
        list: rockRatioList,
        types: ["CKKT", "CKĐL"],
      },
      {
        label: "Tỷ lệ gương than mềm",
        key: "mirrorRatio",
        list: mirrorRatioList,
        types: ["CM"],
      },
      { label: "Mã định mức", key: "code", isCodeRow: true },
    ];

    const activeRows = rowConfigs.filter(
      (r) => !r.types || r.types.includes(type),
    );
    const DATA_START_ROW = activeRows.length + 2;
    worksheet.getRow(1).hidden = true;

    // --- BẢN ĐỒ DÒNG (Row Map) ---
    // Lấy tất cả mã duy nhất xuất hiện trong data HOẶC trong danh mục mã giao khoán
    const usedCodeSet = new Set();
    allNorms.forEach((doc) => {
      (doc.norms || []).forEach((n) => {
        if (n.assignmentCode?.code) usedCodeSet.add(n.assignmentCode.code);
      });
    });

    // Sắp xếp mã để hiển thị đẹp mắt
    const sortedCodes = Array.from(usedCodeSet).sort();
    const codeToRowMap = {};
    sortedCodes.forEach((code, idx) => {
      const rowIndex = DATA_START_ROW + idx;
      codeToRowMap[code] = rowIndex;
      worksheet.getCell(`A${rowIndex}`).value = code;
    });

    // --- HEADERS CỘT A ---
    activeRows.forEach((row, idx) => {
      const cell = worksheet.getCell(`A${idx + 2}`);
      cell.value = row.label;
      cell.font = { bold: true };
    });

    // --- TẠO CỘT ẨN CHO DROPDOWN (TỪ CỘT 200) ---
    let hiddenColIndex = 200;
    const listMap = {};

    activeRows.forEach((row) => {
      if (row.list) {
        const colLetter = getColumnName(hiddenColIndex);
        const hCol = worksheet.getColumn(hiddenColIndex);
        hCol.values = [row.label, ...row.list.map((i) => i.name)];
        hCol.hidden = true;
        listMap[row.key] = { letter: colLetter, length: row.list.length };
        hiddenColIndex++;
      }
    });

    // Dropdown cho Mã giao khoán (Cột A)
    const acColLetter = getColumnName(hiddenColIndex);
    const hColAC = worksheet.getColumn(hiddenColIndex);
    hColAC.values = ["DS Mã", ...allAssignmentCodes.map((ac) => ac.code)];
    hColAC.hidden = true;
    const acRange = `$${acColLetter}$2:$${acColLetter}$${allAssignmentCodes.length + 1}`;

    // --- ĐIỀN DỮ LIỆU ĐỊNH MỨC THEO CỘT ---
    allNorms.forEach((doc, docIdx) => {
      const colNumber = docIdx + 2;
      const colLetter = getColumnName(colNumber);

      // Lưu ID vào dòng 1 để phục vụ việc Import sau này
      worksheet.getCell(`${colLetter}1`).value = doc._id.toString();

      // Điền thuộc tính (Dòng 2 -> DATA_START_ROW - 1)
      activeRows.forEach((row, rIdx) => {
        const rowIndex = rIdx + 2;
        const cell = worksheet.getCell(`${colLetter}${rowIndex}`);

        cell.value = row.isCodeRow ? doc.code : doc[row.key]?.name || "";

        if (listMap[row.key]) {
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [
              `$${listMap[row.key].letter}$2:$${listMap[row.key].letter}$${listMap[row.key].length + 1}`,
            ],
          };
        }
      });

      // Điền giá trị định mức (Norms)
      (doc.norms || []).forEach((n) => {
        const acCode = n.assignmentCode?.code;
        const targetRow = codeToRowMap[acCode];
        if (targetRow) {
          worksheet.getCell(`${colLetter}${targetRow}`).value = n.norm;
        }
      });
    });

    // --- VALIDATION CHO CỘT A (ĐỂ USER THÊM DÒNG) ---
    for (
      let r = DATA_START_ROW;
      r <= DATA_START_ROW + sortedCodes.length + 50;
      r++
    ) {
      worksheet.getCell(`A${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [acRange],
      };
    }

    // --- FORMATTING ---
    worksheet.getColumn(1).width = 25;
    const lastColUsed = allNorms.length + 1;
    for (let i = 2; i <= lastColUsed; i++) {
      const col = worksheet.getColumn(i);
      col.width = 15;
      col.alignment = { horizontal: "center", vertical: "middle" };
    }

    worksheet.views = [
      { state: "frozen", xSplit: 1, ySplit: DATA_START_ROW - 1 },
    ];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=he_so_dieu_chinh_dinh_muc.xlsx`,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * Hàm chuyển đổi số cột thành chữ (1 -> A, 2 -> B, 27 -> AA)
 * Đúng chuẩn Excel
 */
function getColumnName(n) {
  let s = "";
  while (n > 0) {
    let m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}
