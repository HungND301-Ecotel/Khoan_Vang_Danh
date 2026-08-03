const AssignmentNorm = require("../model/AssignmentNorm");
const PhaseGroup = require("../model/PhaseGroup");
const Phase = require("../model/Phase");
const ExcavationTech = require("../model/ExcavationTech");
const Step = require("../model/Step");
const Length = require("../model/Length");
const CrossSection = require("../model/CrossSection");
const CurbSlope = require("../model/CurbSlope");
const Hardness = require("../model/Hardness");
const Thickness = require("../model/Thickness");
const AssignmentCode = require("../model/AssignmentCode");

const { paginateQuery } = require("../utils/pagination");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { checkUniqueCode } = require("../utils/codeValidator");

exports.create = async (req, res) => {
  try {
    const {
      code,
      year,
      phaseGroup,
      phase,
      excavationTech,
      step,
      length,
      crossSection,
      type,
      curbSlope,
      hardness,
      thickness,
      startMonth,
      endMonth,
      norms,
    } = req.body;
    const { isDuplicate, collectionName } = await checkUniqueCode(
      code,
      null,
      "AssignmentNorm",
    );
    if (isDuplicate) {
      return res.status(409).json({
        status: "error",
        message: `Mã định mức '${code}' đã tồn tại trong hệ thống`,
      });
    }
    const newAssignmentNorm = new AssignmentNorm({
      code,
      year,
      phaseGroup,
      phase,
      excavationTech,
      step,
      length,
      crossSection,
      type,
      curbSlope,
      hardness,
      thickness,
      startMonth,
      endMonth,
      norms,
    });
    await newAssignmentNorm.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { code } = req.body;
    const data = await AssignmentNorm.findById(req.params.id);
    console.log(data);
    if (code) {
      const { isDuplicate, collectionName } = await checkUniqueCode(
        code,
        req.params.id,
        "AssignmentNorm",
      );
      if (isDuplicate) {
        return res.status(409).json({
          status: "error",
          message: `Mã định mức '${code}' đã tồn tại trong hệ thống`,
        });
      }
    }

    const updateData = await AssignmentNorm.findByIdAndUpdate(
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
    const { ids, codes, year, type } = req.body;

    let filter = null;
    if (Array.isArray(ids) && ids.length > 0) {
      filter = { _id: { $in: ids } };
    } else if (Array.isArray(codes) && codes.length > 0) {
      filter = { code: { $in: codes } };
      // 👇 bắt buộc kèm year + type khi xóa theo codes, tránh xóa nhầm sang năm/loại khác
      if (year) filter.year = Number(year);
      if (type) filter.type = type;
    }

    if (!filter) {
      return res
        .status(400)
        .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
    }

    const result = await AssignmentNorm.deleteMany(filter);
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

exports.cloneYear = async (req, res) => {
  try {
    const { type, sourceYear, targetYear } = req.body;
    if (!type || !sourceYear || !targetYear) {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu type/sourceYear/targetYear" });
    }
    if (Number(sourceYear) === Number(targetYear)) {
      return res.status(400).json({
        status: "error",
        message: "Năm nguồn và năm đích phải khác nhau",
      });
    }

    // Lấy bản ghi mới nhất (endMonth lớn nhất) của mỗi code trong năm nguồn
    const latestPerCode = await AssignmentNorm.aggregate([
      { $match: { type, year: Number(sourceYear) } },
      { $sort: { endMonth: -1 } },
      {
        $group: {
          _id: "$code",
          doc: { $first: "$$ROOT" },
        },
      },
    ]);

    if (latestPerCode.length === 0) {
      return res.status(200).json({
        status: "success",
        summary: { total: 0, copied: 0, skipped: 0 },
        skippedCodes: [],
      });
    }

    // Mã nào đã có sẵn ở năm đích thì bỏ qua để tránh chồng chéo thời gian
    // (bản clone luôn full năm 01->12 nên chắc chắn overlap nếu code đã tồn tại)
    const existingTargetCodes = await AssignmentNorm.distinct("code", {
      type,
      year: Number(targetYear),
    });
    const existingSet = new Set(existingTargetCodes);

    const operations = [];
    const skippedCodes = [];

    latestPerCode.forEach(({ doc }) => {
      if (existingSet.has(doc.code)) {
        skippedCodes.push(doc.code);
        return;
      }
      const {
        _id,
        __v,
        startMonth,
        endMonth,
        year,
        createdAt,
        updatedAt,
        ...rest
      } = doc;
      operations.push({
        insertOne: {
          document: {
            ...rest,
            year: Number(targetYear),
            startMonth: `${targetYear}-01`,
            endMonth: `${targetYear}-12`,
          },
        },
      });
    });

    const result =
      operations.length > 0 ? await AssignmentNorm.bulkWrite(operations) : null;

    res.status(200).json({
      status: "success",
      summary: {
        total: latestPerCode.length,
        copied: result?.insertedCount || 0,
        skipped: skippedCodes.length,
      },
      skippedCodes,
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
    if (req.query.year) {
      query.year = req.query.year;
    }
    // 👇 lọc theo tháng cụ thể (dạng "YYYY-MM"), chỉ lấy bản ghi có khoảng
    // startMonth <= month <= endMonth
    if (req.query.month) {
      query.startMonth = { $lte: req.query.month };
      query.endMonth = { $gte: req.query.month };
    }

    const modelQuery = AssignmentNorm.find(query)
      .populate("phaseGroup")
      .populate("phase")
      .populate("excavationTech")
      .populate("step")
      .populate("length")
      .populate({
        path: "crossSection",
        populate: "uom",
      })
      .populate("curbSlope")
      .populate("hardness")
      .populate("thickness")
      .populate({
        path: "norms.assignmentCode",
        populate: "uom",
      });
    const pagination = await paginateQuery(
      AssignmentNorm,
      modelQuery,
      query,
      req.query,
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getYears = async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;

    const years = await AssignmentNorm.distinct("year", query);
    const sortedYears = years.filter((y) => y != null).sort((a, b) => b - a); // mới nhất trước

    res.status(200).json({ status: "success", data: sortedYears });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
// Lấy danh sách mã (group theo code) cho bảng chính
exports.getGroupedByCode = async (req, res) => {
  try {
    const match = {};
    if (req.query.q) match.code = new RegExp(req.query.q, "i");
    if (req.query.type) match.type = new RegExp(`^${req.query.type}$`, "i");
    if (req.query.year) match.year = Number(req.query.year);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const basePipeline = [
      { $match: match },
      { $sort: { endMonth: -1 } }, // để $first lấy đúng bản ghi mới nhất trong mỗi group
      {
        $group: {
          _id: "$code",
          code: { $first: "$code" },
          type: { $first: "$type" },
          year: { $first: "$year" },
          startMonth: { $min: "$startMonth" },
          endMonth: { $max: "$endMonth" },
          recordCount: { $sum: 1 },
          latestRecordId: { $first: "$_id" },
          latestNorms: { $first: "$norms" },
        },
      },
      { $project: { latestNorms: 0 } },
      { $sort: { code: 1 } },
    ];
    const collationOpts = { locale: "en", numericOrdering: true };

    const [countResult, data] = await Promise.all([
      AssignmentNorm.aggregate([
        ...basePipeline,
        { $count: "total" },
      ]).collation(collationOpts),
      AssignmentNorm.aggregate([
        ...basePipeline,
        { $skip: skip },
        { $limit: limit },
      ]).collation(collationOpts),
    ]);

    const totalDocs = countResult[0]?.total || 0;

    res.status(200).json({
      status: "success",
      data: { data, totalDocs, page, limit },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Lấy tất cả bản ghi (khoảng tháng) của 1 mã cụ thể
exports.getByCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu mã định mức" });
    }

    const query = { code };
    if (req.query.type) query.type = req.query.type;
    if (req.query.year) query.year = Number(req.query.year);

    const data = await AssignmentNorm.find(query)
      .sort({ endMonth: -1 }) // bản ghi mới nhất luôn ở đầu -> phục vụ luôn cho nút "+"
      .populate("phaseGroup")
      .populate("phase")
      .populate("excavationTech")
      .populate("step")
      .populate("length")
      .populate({ path: "crossSection", populate: "uom" })
      .populate("curbSlope")
      .populate("hardness")
      .populate("thickness")
      .populate({ path: "norms.assignmentCode", populate: "uom" });

    res.status(200).json({ status: "success", data });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Mã định mức": "code",
  "Thời gian": "period",
  "Công đoạn": "phase",
  "Công nghệ xúc": "excavationTech",
  Chống: "step",
  "Độ cứng": "hardness",
  "Chiều dài": "length",
  "Tiết diện lò xén": "crossSection",
  "Độ dốc vỉa": "curbSlope",
  "Độ dày vỉa": "thickness",
  ID: "_id",
};
// "2026-01" (DB) -> "01/2026" (hiển thị)
const dbMonthToDisplay = (m) => {
  if (!m) return "";
  const [y, mo] = String(m).split("-");
  if (!y || !mo) return "";
  return `${mo}/${y}`;
};

// "01/2026-07/2026" -> { startMonth: "2026-01", endMonth: "2026-07" }
const parsePeriod = (str) => {
  const match = /^(\d{1,2})\/(\d{4})-(\d{1,2})\/(\d{4})$/.exec(
    String(str).trim(),
  );
  if (!match) return null;
  const [, sm, sy, em, ey] = match;
  const smNum = parseInt(sm, 10);
  const emNum = parseInt(em, 10);
  if (smNum < 1 || smNum > 12 || emNum < 1 || emNum > 12) return null;
  return {
    startMonth: `${sy}-${String(smNum).padStart(2, "0")}`,
    endMonth: `${ey}-${String(emNum).padStart(2, "0")}`,
  };
};
const getColumnName = (colIndex) => {
  let columnName = "";
  while (colIndex > 0) {
    let remainder = (colIndex - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    colIndex = Math.floor((colIndex - remainder) / 26);
  }
  return columnName;
};

exports.import = async (req, res) => {
  try {
    const type = req.query.type || "excavation";
    const importYear = req.query.year ? String(req.query.year) : null;

    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });

    if (!importYear)
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu năm để import (year)" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let rowMap = {};
    let idRow = 0;
    let lastHeaderRowIndex = -1;

    matrix.forEach((row, idx) => {
      const headerText = String(row[0] || "").trim();
      if (columnMapping[headerText] && columnMapping[headerText] !== "_id") {
        rowMap[columnMapping[headerText]] = idx;
        lastHeaderRowIndex = Math.max(lastHeaderRowIndex, idx);
      }
    });
    const assignmentCodeStartRow = lastHeaderRowIndex + 1;

    const [ps, secs, techs, sts, hards, asCodes, thics, crb, lth] =
      await Promise.all([
        Phase.find().lean(),
        CrossSection.find().lean(),
        ExcavationTech.find().lean(),
        Step.find().lean(),
        Hardness.find().lean(),
        AssignmentCode.find().lean(),
        Thickness.find().lean(),
        CurbSlope.find().lean(),
        Length.find().lean(),
      ]);

    const maps = {
      phase: new Map(ps.map((d) => [d.name.trim(), d._id])),
      crossSection: new Map(secs.map((d) => [d.name.trim(), d._id])),
      excavationTech: new Map(techs.map((d) => [d.name.trim(), d._id])),
      step: new Map(sts.map((d) => [d.name.trim(), d._id])),
      hardness: new Map(hards.map((d) => [d.name.trim(), d._id])),
      asCode: new Map(asCodes.map((d) => [d.code.trim(), d._id])),
      thickness: new Map(thics.map((d) => [d.name.trim(), d._id])),
      curbSlope: new Map(crb.map((d) => [d.name.trim(), d._id])),
      length: new Map(lth.map((d) => [d.name.trim(), d._id])),
    };

    const operations = [];
    const invalidRows = [];
    const codeEntriesMap = new Map();

    const HIDDEN_START_INDEX = 199;
    const totalColsInFile = matrix[idRow] ? matrix[idRow].length : 0;
    const safeLimit = Math.min(totalColsInFile, HIDDEN_START_INDEX);

    // Đối chiếu ID trong file với DB, tránh update vào bản ghi đã bị xóa
    const idsInFile = [];
    for (let c = 1; c < safeLimit; c++) {
      const rid = String(matrix[idRow][c] || "").trim();
      if (rid.length === 24) idsInFile.push(rid);
    }
    const existingIdsInDb = new Set(
      (
        await AssignmentNorm.find({ _id: { $in: idsInFile } })
          .select("_id")
          .lean()
      ).map((d) => d._id.toString()),
    );

    for (let c = 1; c < safeLimit; c++) {
      const recordId = String(matrix[idRow][c] || "").trim();
      const isRealExistingId =
        recordId.length === 24 && existingIdsInDb.has(recordId);

      const cleanCode = matrix[rowMap.code]
        ? String(matrix[rowMap.code][c] || "").trim()
        : "";

      if (!recordId && (!cleanCode || cleanCode === "Mã định mức")) {
        continue;
      }

      const colName = getColumnName(c + 1);

      const processedNorms = [];
      for (let r = assignmentCodeStartRow; r < matrix.length; r++) {
        if (!matrix[r]) continue;
        const acCode = String(matrix[r][0] || "").trim();
        const val = parseFloat(matrix[r][c]);
        if (acCode && !isNaN(val)) {
          const acId = maps.asCode.get(acCode);
          if (acId) processedNorms.push({ assignmentCode: acId, norm: val });
        }
      }
      if (
        !recordId &&
        processedNorms.length === 0 &&
        (!cleanCode || cleanCode === "Mã định mức")
      ) {
        continue;
      }

      // Xóa: chỉ khi ID còn thật sự tồn tại trong DB
      if (isRealExistingId && processedNorms.length === 0) {
        operations.push({ deleteOne: { filter: { _id: recordId } } });
        continue;
      }

      if (cleanCode || processedNorms.length > 0) {
        if (!cleanCode) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: "Thiếu 'Mã định mức'",
          });
          continue;
        }

        const { isDuplicate, collectionName } = await checkUniqueCode(
          cleanCode,
          isRealExistingId ? recordId : null,
          "AssignmentNorm",
        );
        if (isDuplicate) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: `Mã đã tồn tại trong danh mục ${collectionName}: ${cleanCode}`,
          });
          continue;
        }

        // 👇 thêm year vào dataObj — đây là chỗ thiếu gây lỗi
        const dataObj = {
          type,
          code: cleanCode,
          year: Number(importYear),
          norms: processedNorms,
        };
        let hasCategoryError = false;

        for (const key of Object.keys(rowMap)) {
          if (key === "code") continue;
          const val = String(matrix[rowMap[key]][c] || "").trim();
          if (!val) continue;

          if (key === "period") {
            const parsed = parsePeriod(val);
            if (!parsed) {
              invalidRows.push({
                row: `Cột ${colName}`,
                error: `Thời gian '${val}' không đúng định dạng (VD: 01/2026-07/2026)`,
              });
              hasCategoryError = true;
              break;
            }
            dataObj.startMonth = parsed.startMonth;
            dataObj.endMonth = parsed.endMonth;
            continue;
          }

          const id = maps[key]?.get(val);
          if (id) {
            dataObj[key] = id;
          } else {
            invalidRows.push({
              row: `Cột ${colName}`,
              error: `Giá trị '${val}' không tồn tại trong danh mục ${key}`,
            });
            hasCategoryError = true;
            break;
          }
        }

        if (hasCategoryError) continue;

        if (!dataObj.startMonth || !dataObj.endMonth) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: "Thiếu 'Thời gian'",
          });
          continue;
        }

        // Check năm: startMonth/endMonth phải cùng năm đang import
        const startYear = dataObj.startMonth.split("-")[0];
        const endYear = dataObj.endMonth.split("-")[0];
        if (startYear !== importYear || endYear !== importYear) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: `Thời gian '${dbMonthToDisplay(dataObj.startMonth)}-${dbMonthToDisplay(dataObj.endMonth)}' không thuộc năm ${importYear} đang import`,
          });
          continue;
        }

        // So sánh thông số chung + check chồng chéo thời gian nếu mã đã xuất hiện ở cột khác
        const sharedKeys = Object.keys(rowMap).filter(
          (k) => k !== "code" && k !== "period",
        );
        const sharedFieldsForCompare = {};
        sharedKeys.forEach((key) => {
          sharedFieldsForCompare[key] = dataObj[key]
            ? String(dataObj[key])
            : "";
        });
        const signature = JSON.stringify(sharedFieldsForCompare);

        const existingEntries = codeEntriesMap.get(cleanCode) || [];

        const mismatchEntry = existingEntries.find(
          (e) => e.signature !== signature,
        );
        if (mismatchEntry) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: `Mã '${cleanCode}' trùng với cột ${mismatchEntry.colName} nhưng thông số chung (Công đoạn/Công nghệ xúc/Chống/...) không khớp`,
          });
          continue;
        }

        const overlapEntry = existingEntries.find(
          (e) =>
            dataObj.startMonth <= e.endMonth &&
            e.startMonth <= dataObj.endMonth,
        );
        if (overlapEntry) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: `Mã '${cleanCode}' có thời gian chồng chéo với cột ${overlapEntry.colName} (${dbMonthToDisplay(overlapEntry.startMonth)}-${dbMonthToDisplay(overlapEntry.endMonth)})`,
          });
          continue;
        }

        codeEntriesMap.set(cleanCode, [
          ...existingEntries,
          {
            signature,
            colName,
            startMonth: dataObj.startMonth,
            endMonth: dataObj.endMonth,
          },
        ]);

        // 👇 chỉ 1 lần push duy nhất, dùng đúng isRealExistingId
        if (isRealExistingId) {
          operations.push({
            updateOne: { filter: { _id: recordId }, update: { $set: dataObj } },
          });
        } else {
          operations.push({ insertOne: { document: dataObj } });
        }
      }
    }

    const result =
      operations.length > 0 ? await AssignmentNorm.bulkWrite(operations) : null;

    res.status(200).json({
      status: "success",
      summary: {
        total: operations.length + invalidRows.length,
        inserted: result?.insertedCount || 0,
        updated: result?.modifiedCount || 0,
        deleted: result?.deletedCount || 0,
        failed: invalidRows.length,
      },
      invalidRows,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.export = async (req, res) => {
  try {
    const type = req.query.type || "excavation";
    const { codes, year } = req.body || {};

    const typeMapping = {
      excavation: "Đào lò",
      cutting: "Xén lò",
      coal_kb: "Khấu than KB",
      coal_zh: "Khấu than ZH",
      coal_zry: "Khấu than ZRY",
    };
    const relevantGroups = await PhaseGroup.find({
      name: new RegExp(typeMapping[type] || "Đào lò", "i"),
    }).select("_id");

    // Xây query lọc AssignmentNorm theo type + (year nếu có) + (codes nếu có)
    const normQuery = { type };
    if (year) {
      normQuery.year = Number(year);
    }
    if (Array.isArray(codes) && codes.length > 0) {
      normQuery.code = { $in: codes };
    }

    const [
      allAssignmentCodes,
      allNorms,
      pgs,
      ps,
      techs,
      sts,
      lens,
      secs,
      slos,
      hards,
      thics,
    ] = await Promise.all([
      AssignmentCode.find().sort({ code: 1 }).lean(),
      AssignmentNorm.find(normQuery)
        .populate(
          "phase excavationTech step length crossSection curbSlope hardness thickness norms.assignmentCode",
        )
        .lean(),
      PhaseGroup.find().lean(),
      Phase.find({
        phaseGroup: { $in: relevantGroups.map((g) => g._id) },
      }).lean(),
      ExcavationTech.find().lean(),
      Step.find().lean(),
      Length.find().lean(),
      CrossSection.find().lean(),
      CurbSlope.find().lean(),
      Hardness.find().lean(),
      Thickness.find().lean(),
    ]);

    // Gom các cột có cùng "code" đứng cạnh nhau: sort theo code trước khi map vào cột
    allNorms.sort((a, b) =>
      (a.code || "").localeCompare(b.code || "", "vi", {
        sensitivity: "base",
        numeric: true,
      }),
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Dinh_Muc");

    const rowConfigs = [
      {
        label: "Công đoạn",
        key: "phase",
        list: ps,
        types: ["excavation", "cutting"],
      },
      {
        label: "Công nghệ xúc",
        key: "excavationTech",
        list: techs,
        types: ["excavation"],
      },
      { label: "Chống", key: "step", list: sts, types: ["excavation"] },
      {
        label: "Độ cứng",
        key: "hardness",
        list: hards,
        types: ["cutting", "coal_kb", "coal_zh", "coal_zry"],
      },
      {
        label: "Tiết diện lò xén",
        key: "crossSection",
        list: secs,
        types: ["cutting"],
      },
      {
        label: "Độ dày vỉa",
        key: "thickness",
        list: thics,
        types: ["coal_kb", "coal_zh", "coal_zry"],
      },
      { label: "Độ dốc vỉa", key: "curbSlope", list: slos, types: ["coal_kb"] },
      {
        label: "Chiều dài",
        key: "length",
        list: lens,
        types: ["coal_zh", "coal_zry"],
      },
      { label: "Mã định mức", key: "code", isCodeRow: true },
      {
        label: "Thời gian",
        key: "period",
        isStringRow: true,
        isPeriodRow: true, // 👈 đánh dấu để xử lý riêng khi fill data
      },
    ];

    const activeRows = rowConfigs.filter(
      (r) => !r.types || r.types.includes(type),
    );
    const DATA_START_ROW = activeRows.length + 2;
    worksheet.getRow(1).hidden = true;

    activeRows.forEach((row, idx) => {
      const rowIndex = idx + 2;
      const cell = worksheet.getCell(`A${rowIndex}`);
      cell.value = row.label;
      cell.font = {
        bold: true,
        italic: row.isCodeRow,
        color: row.isCodeRow ? { argb: "FF4F81BD" } : { argb: "000000" },
      };
    });

    allAssignmentCodes.forEach((ac, idx) => {
      worksheet.getCell(`A${DATA_START_ROW + idx}`).value = ac.code;
    });

    const listMap = {};
    let hiddenColIndex = 200;

    const assignmentCodeColLetter = getColumnName(hiddenColIndex);
    const hColAC = worksheet.getColumn(hiddenColIndex);
    hColAC.values = [
      "Danh sách mã",
      ...allAssignmentCodes.map((ac) => ac.code),
    ];
    hColAC.hidden = true;
    const acRange = `$${assignmentCodeColLetter}$2:$${assignmentCodeColLetter}$${allAssignmentCodes.length + 1}`;
    hiddenColIndex++;

    // Tạo cột ẩn chứa 12 tháng của "year" để làm dropdown cho Từ tháng / Đến tháng
    let monthRange = null;
    if (year) {
      const monthColLetter = getColumnName(hiddenColIndex);
      const monthValues = Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        return `${year}-${m}`;
      });
      const hColMonth = worksheet.getColumn(hiddenColIndex);
      hColMonth.values = ["Danh sách tháng", ...monthValues];
      hColMonth.hidden = true;
      monthRange = `$${monthColLetter}$2:$${monthColLetter}$${monthValues.length + 1}`;
      hiddenColIndex++;
    }

    activeRows.forEach((row) => {
      if (row.list) {
        const colLetter = getColumnName(hiddenColIndex);
        const values = [row.label, ...row.list.map((i) => i.name || i.code)];

        const hCol = worksheet.getColumn(hiddenColIndex);
        hCol.values = values;
        hCol.hidden = true;

        listMap[row.key] = { letter: colLetter, length: row.list.length };
        hiddenColIndex++;
      }
    });

    const MAX_DATA_COLS = 150;
    const MAX_DATA_ROWS = 1000;
    for (let c = 2; c <= MAX_DATA_COLS; c++) {
      const colLetter = worksheet.getColumn(c).letter;
      activeRows.forEach((row, rIdx) => {
        const rowIndex = rIdx + 2;
        const cell = worksheet.getCell(`${colLetter}${rowIndex}`);

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
    }

    for (let r = DATA_START_ROW; r <= MAX_DATA_ROWS; r++) {
      worksheet.getCell(`A${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [acRange],
      };
    }

    allAssignmentCodes.forEach((ac, idx) => {
      worksheet.getCell(`A${DATA_START_ROW + idx}`).value = ac.code;
    });

    allNorms.forEach((doc, docIdx) => {
      const colIndex = docIdx + 2;
      const colLetter = worksheet.getColumn(colIndex).letter;
      worksheet.getCell(`${colLetter}1`).value = doc._id.toString();

      activeRows.forEach((row, rIdx) => {
        const cell = worksheet.getCell(`${colLetter}${rIdx + 2}`);
        if (row.isPeriodRow) {
          cell.value = `${dbMonthToDisplay(doc.startMonth)}-${dbMonthToDisplay(doc.endMonth)}`;
        } else if (row.isCodeRow || row.isStringRow) {
          cell.value = doc[row.key] || "";
        } else {
          cell.value = doc[row.key]?.name || doc[row.key] || "";
        }
      });

      (doc.norms || []).forEach((n) => {
        const acCode = n.assignmentCode?.code;
        const rowIndexInA = allAssignmentCodes.findIndex(
          (ac) => ac.code === acCode,
        );
        if (rowIndexInA !== -1) {
          worksheet.getCell(
            `${colLetter}${DATA_START_ROW + rowIndexInA}`,
          ).value = n.norm;
        }
      });
    });

    worksheet.getCell("A1").value = "ID";
    activeRows.forEach((row, idx) => {
      worksheet.getCell(`A${idx + 2}`).value = row.label;
    });

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(1).alignment = { horizontal: "left" };

    for (let i = 2; i <= MAX_DATA_COLS; i++) {
      const column = worksheet.getColumn(i);
      column.width = 18;
      column.alignment = { horizontal: "center", vertical: "middle" };
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
      `attachment; filename=dinh_muc_${type}${year ? `_${year}` : ""}.xlsx`,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
