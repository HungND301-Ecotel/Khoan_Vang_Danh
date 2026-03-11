const AssignmentNorm = require("../model/AssignmentNorm");
const PhaseGroup = require("../model/PhaseGroup");
const Phase = require("../model/Phase");
const ExcavationTech = require("../model/ExcavationTech");
const Step = require("../model/Step");
const Length = require("../model/Length");
const Cutting = require("../model/CuttingNorm");
const CrossSection = require("../model/CrossSection");
const CurbSlope = require("../model/CurbSlope");
const Hardness = require("../model/Hardness");
const Thickness = require("../model/Thickness");
const AssignmentCode = require("../model/AssignmentCode");

const { paginateQuery } = require("../utils/pagination");
const { configExport } = require("../utils/config_export");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");

exports.create = async (req, res) => {
  try {
    const {
      code,
      phaseGroup,
      phase,
      excavationTech,
      step,
      length,
      cutting,
      crossSection,
      type,
      curbSlope,
      hardness,
      thickness,
      norms,
    } = req.body;
    const exitData = await AssignmentNorm.countDocuments({ code: code });
    if (exitData > 0) {
      return res
        .status(409)
        .json({ status: "error", message: `Mã định mức '${code}' đã tồn tại` });
    }
    const newAssignmentNorm = new AssignmentNorm({
      code,
      phaseGroup,
      phase,
      excavationTech,
      step,
      length,
      cutting,
      crossSection,
      type,
      curbSlope,
      hardness,
      thickness,
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
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
    }

    const result = await AssignmentNorm.deleteMany({ _id: { $in: ids } });
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
    const modelQuery = AssignmentNorm.find(query)
      .populate("phaseGroup")
      .populate("phase")
      .populate("excavationTech")
      .populate("step")
      .populate("length")
      .populate("cutting")
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

const columnMapping = {
  "Mã định mức": "code",
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
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let rowMap = {};
    let idRow = 0; // Dòng 1 ẩn chứa ID
    let assignmentCodeStartRow = -1;

    matrix.forEach((row, idx) => {
      const headerText = String(row[0] || "").trim();
      // Chỉ map các key hợp lệ cho danh mục, bỏ qua ID vì nó là kỹ thuật
      if (columnMapping[headerText] && columnMapping[headerText] !== "_id") {
        rowMap[columnMapping[headerText]] = idx;
      }
      if (headerText === "Mã định mức") assignmentCodeStartRow = idx + 1;
    });

    const [ps, techs, sts, hards, asCodes] = await Promise.all([
      Phase.find().lean(),
      ExcavationTech.find().lean(),
      Step.find().lean(),
      Hardness.find().lean(),
      AssignmentCode.find().lean(),
    ]);

    const maps = {
      phase: new Map(ps.map((d) => [d.name.trim(), d._id])),
      excavationTech: new Map(techs.map((d) => [d.name.trim(), d._id])),
      step: new Map(sts.map((d) => [d.name.trim(), d._id])),
      hardness: new Map(hards.map((d) => [d.name.trim(), d._id])),
      asCode: new Map(asCodes.map((d) => [d.code.trim(), d._id])),
    };

    const operations = [];
    const invalidRows = [];

    // Tìm số lượng cột thực tế dựa trên hàng có dữ liệu dài nhất (thường là hàng ID hoặc Mã định mức)
    const HIDDEN_START_INDEX = 199;
    const totalColsInFile = matrix[idRow] ? matrix[idRow].length : 0;

    // Giới hạn cột quét: không bao giờ vượt quá cột thứ 199
    const safeLimit = Math.min(totalColsInFile, HIDDEN_START_INDEX);

    for (let c = 1; c < safeLimit; c++) {
      const recordId = String(matrix[idRow][c] || "").trim();
      const cleanCode = matrix[rowMap.code]
        ? String(matrix[rowMap.code][c] || "").trim()
        : "";

      // --- LOGIC QUAN TRỌNG ĐỂ BỎ QUA CỘT DANH MỤC ---
      // 1. Nếu cột không có ID và cũng không có Mã định mức thì ĐÂY LÀ CỘT DANH MỤC (BA, BB, BC...)
      // 2. Hoặc nếu cleanCode trùng với các Label danh mục thì bỏ qua
      if (!recordId && (!cleanCode || cleanCode === "Mã định mức")) {
        continue;
      }

      // Nếu là cột dữ liệu, xác định tên cột để báo lỗi nếu cần
      const colName = getColumnName(c + 1);

      // Thu thập định mức
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

      // Logic XÓA: Có ID cũ nhưng trắng định mức
      if (recordId && recordId.length === 24 && processedNorms.length === 0) {
        operations.push({ deleteOne: { filter: { _id: recordId } } });
        continue;
      }

      // Logic THÊM / SỬA
      if (cleanCode || processedNorms.length > 0) {
        if (!cleanCode) {
          invalidRows.push({
            row: `Cột ${colName}`,
            error: "Thiếu 'Mã định mức'",
          });
          continue;
        }

        const dataObj = { type, code: cleanCode, norms: processedNorms };
        let hasCategoryError = false;

        for (const key of Object.keys(rowMap)) {
          if (key === "code") continue;
          const val = String(matrix[rowMap[key]][c] || "").trim();
          if (val) {
            const id = maps[key]?.get(val);
            if (id) {
              dataObj[key] = id;
            } else {
              // Kiểm tra nếu giá trị này nằm trong dòng "Mã định mức" nhưng lại là rác
              invalidRows.push({
                row: `Cột ${colName}`,
                error: `Giá trị '${val}' không tồn tại trong danh mục ${key}`,
              });
              hasCategoryError = true;
              break;
            }
          }
        }

        if (hasCategoryError) continue;

        if (recordId && recordId.length === 24) {
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

    // 1. Lấy dữ liệu danh mục & dữ liệu hiện có

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
    const [
      allAssignmentCodes,
      allNorms,
      pgs,
      ps,
      techs,
      sts,
      lens,
      cuts,
      secs,
      slos,
      hards,
      thics,
    ] = await Promise.all([
      AssignmentCode.find().sort({ code: 1 }).lean(),
      AssignmentNorm.find({ type })
        .populate(
          "phase excavationTech step length cutting crossSection curbSlope hardness thickness norms.assignmentCode",
        )
        .lean(),
      PhaseGroup.find().lean(),
      Phase.find({
        phaseGroup: { $in: relevantGroups.map((g) => g._id) },
      }).lean(),
      ExcavationTech.find().lean(),
      Step.find().lean(),
      Length.find().lean(),
      Cutting.find().lean(),
      CrossSection.find().lean(),
      CurbSlope.find().lean(),
      Hardness.find().lean(),
      Thickness.find().lean(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Dinh_Muc");

    // 2. Định nghĩa cấu trúc hàng theo Type (Dựa trên logic của bạn)
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
    ];

    // Lọc các hàng sẽ hiển thị
    const activeRows = rowConfigs.filter(
      (r) => !r.types || r.types.includes(type),
    );
    const DATA_START_ROW = activeRows.length + 2; // Dòng bắt đầu danh sách Mã giao khoán (ví dụ dòng 10)
    worksheet.getRow(1).hidden = true;
    // 3. Khởi tạo Header cho Cột A
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

    // Điền mã giao khoán vào cột A từ dòng DATA_START_ROW
    allAssignmentCodes.forEach((ac, idx) => {
      worksheet.getCell(`A${DATA_START_ROW + idx}`).value = ac.code;
    });

    // 4. Tạo các cột ẩn chứa danh mục để làm Dropdown (Dùng cột từ BA trở đi)
    const listMap = {};
    let hiddenColIndex = 200; // Đẩy ra thật xa để không bị trùng với data

    // --- MỚI: Thêm list Mã Giao Khoán vào cột ẩn ---
    const assignmentCodeColLetter = getColumnName(hiddenColIndex);
    const hColAC = worksheet.getColumn(hiddenColIndex);
    hColAC.values = [
      "Danh sách mã",
      ...allAssignmentCodes.map((ac) => ac.code),
    ];
    hColAC.hidden = true;
    const acRange = `$${assignmentCodeColLetter}$2:$${assignmentCodeColLetter}$${allAssignmentCodes.length + 1}`;
    hiddenColIndex++;

    activeRows.forEach((row) => {
      if (row.list) {
        // Hàm chuyển số index thành chữ (200 -> GR)
        const colLetter = getColumnName(hiddenColIndex);
        const values = [row.label, ...row.list.map((i) => i.name || i.code)];

        const hCol = worksheet.getColumn(hiddenColIndex);
        hCol.values = values;
        hCol.hidden = true;

        listMap[row.key] = { letter: colLetter, length: row.list.length };
        hiddenColIndex++;
      }
    });

    // 5. Điền dữ liệu và thiết lập Dropdown cho các cột từ B trở đi
    const MAX_DATA_COLS = 150;
    const MAX_DATA_ROWS = 1000;
    for (let c = 2; c <= MAX_DATA_COLS; c++) {
      const colLetter = worksheet.getColumn(c).letter;
      activeRows.forEach((row, rIdx) => {
        const rowIndex = rIdx + 2; // Khớp với dòng của Header
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

    // --- MỚI: Áp dụng Dropdown cho Cột A từ DATA_START_ROW trở xuống ---
    for (let r = DATA_START_ROW; r <= MAX_DATA_ROWS; r++) {
      worksheet.getCell(`A${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [acRange],
      };
    }

    // 6. Điền dữ liệu hiện có
    allAssignmentCodes.forEach((ac, idx) => {
      worksheet.getCell(`A${DATA_START_ROW + idx}`).value = ac.code;
    });

    // 6. Map dữ liệu database vào đúng tọa độ
    allNorms.forEach((doc, docIdx) => {
      const colIndex = docIdx + 2;
      const colLetter = worksheet.getColumn(colIndex).letter;
      // Lưu ID vào dòng 1
      worksheet.getCell(`${colLetter}1`).value = doc._id.toString();

      // 2. Điền các thông tin header (Dịch xuống từ dòng 2)
      activeRows.forEach((row, rIdx) => {
        const cell = worksheet.getCell(`${colLetter}${rIdx + 2}`);
        if (row.isCodeRow) {
          cell.value = doc.code;
        } else {
          cell.value = doc[row.key]?.name || doc[row.key] || "";
        }
      });

      // 3. Điền giá trị norm vào vùng dữ liệu
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

    // 7. Định dạng thẩm mỹ
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(1).alignment = { horizontal: "left" };

    for (let i = 2; i <= MAX_DATA_COLS; i++) {
      const column = worksheet.getColumn(i);
      column.width = 18; // Độ rộng cho các cột B, C, D...
      column.alignment = { horizontal: "center", vertical: "middle" };
    }

    // Đóng băng cột A và các hàng tiêu đề
    worksheet.views = [
      { state: "frozen", xSplit: 1, ySplit: DATA_START_ROW - 1 },
    ];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=dinh_muc_${type}.xlsx`,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
