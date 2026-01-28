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
  "Nhóm công đoạn": "phaseGroup",
  "Công đoạn": "phase",
  "Công nghệ xúc": "excavationTech",
  Chống: "step",
  "Độ cứng": "hardness",
  "Chiều dài": "length",
  "Cắt vỉa": "cutting",
  "Tiết diện lò xén": "crossSection",
  "Độ dốc vỉa": "curbSlope",
  "Độ dày vỉa": "thickness",
  "Định mức": "norms",
  id: "_id",
  _id: "_id",
};

exports.import = async (req, res) => {
  try {
    const type = req.query.type || "excavation";
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headers = xlsx.utils
      .sheet_to_json(worksheet, { header: 1 })[0]
      .map((h) => String(h).trim());
    const mappedHeaders = headers.map((h) => columnMapping[h] || h);
    const dataImport = xlsx.utils
      .sheet_to_json(worksheet, { header: mappedHeaders, range: 1 })
      .filter((r) => r._id || r.code);

    // 1. Chuẩn bị Map danh mục
    const getU = (f) => [
      ...new Set(
        dataImport.map((d) => d[f] && String(d[f]).trim()).filter(Boolean),
      ),
    ];
    const [
      existed,
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
      asCodes,
    ] = await Promise.all([
      AssignmentNorm.find({}, { code: 1 }).lean(),
      PhaseGroup.find({ name: { $in: getU("phaseGroup") } }).lean(),
      Phase.find({ name: { $in: getU("phase") } }).lean(),
      ExcavationTech.find({ name: { $in: getU("excavationTech") } }).lean(),
      Step.find({ name: { $in: getU("step") } }).lean(),
      Length.find({ name: { $in: getU("length") } }).lean(),
      Cutting.find({ name: { $in: getU("cutting") } }).lean(),
      CrossSection.find({ name: { $in: getU("crossSection") } }).lean(),
      CurbSlope.find({ name: { $in: getU("curbSlope") } }).lean(),
      Hardness.find({ name: { $in: getU("hardness") } }).lean(),
      Thickness.find({ name: { $in: getU("thickness") } }).lean(),
      AssignmentCode.find().lean(),
    ]);

    const codeMap = new Map(
      existed.map((n) => [n.code.toLowerCase(), String(n._id)]),
    );
    const maps = {
      phaseGroup: new Map(pgs.map((d) => [d.name, d._id])),
      phase: new Map(ps.map((d) => [d.name, d._id])),
      excavationTech: new Map(techs.map((d) => [d.name, d._id])),
      step: new Map(sts.map((d) => [d.name, d._id])),
      length: new Map(lens.map((d) => [d.name, d._id])),
      cutting: new Map(cuts.map((d) => [d.name, d._id])),
      crossSection: new Map(secs.map((d) => [d.name, d._id])),
      curbSlope: new Map(slos.map((d) => [d.name, d._id])),
      hardness: new Map(hards.map((d) => [d.name, d._id])),
      thickness: new Map(thics.map((d) => [d.name, d._id])),
      asCode: new Map(asCodes.map((d) => [d.code, d._id])),
    };

    // Lấy Nhóm công đoạn mặc định theo trang hiện tại
    const typeMapping = {
      excavation: "Đào lò",
      cutting: "Xén lò",
      coal_kb: "Khấu than KB",
      coal_zh: "Khấu than ZH",
      coal_zry: "Khấu than ZRY",
    };
    const defaultGroup = await PhaseGroup.findOne({
      name: new RegExp(typeMapping[type] || "Đào lò", "i"),
    }).lean();

    const operations = [];
    const invalidRows = [];

    for (const item of dataImport) {
      const rowIndex = dataImport.indexOf(item) + 2;

      // 1. Làm sạch ID ngay từ đầu để check
      if (item._id) {
        item._id = String(item._id).replace(/["']/g, "").trim();
      }

      const cleanCode = item.code ? String(item.code).trim() : null;

      // 2. TRƯỜNG HỢP XÓA: Có ID nhưng tuyệt đối không có Code và không có dữ liệu khác

      if (item._id && !cleanCode) {
        if (item._id.length === 24) {
          operations.push({ deleteOne: { filter: { _id: item._id } } });
          continue;
        } else {
          invalidRows.push({
            row: rowIndex,
            error: "ID không hợp lệ để thực hiện lệnh xóa",
          });
          continue;
        }
      }

      // 3. TRƯỜNG HỢP LỖI: Thiếu Code nhưng lại có dữ liệu khác (bao gồm cả có ID hoặc không)
      if (!cleanCode) {
        invalidRows.push({
          row: rowIndex,
          error:
            "Dòng dữ liệu không hợp lệ: 'Mã định mức' là bắt buộc khi thêm mới",
        });
        continue;
      }

      // 4. KIỂM TRA ID HỢP LỆ (nếu có truyền ID để Update)
      if (item._id && item._id.length !== 24) {
        invalidRows.push({
          row: rowIndex,
          error: "ID không hợp lệ (phải đủ 24 ký tự)",
        });
        continue;
      }

      // --- BẮT ĐẦU LOGIC XỬ LÝ DỮ LIỆU ---
      const updateObj = { type };

      // Map danh mục (bỏ console.warn, chỉ set nếu tìm thấy)
      Object.keys(maps).forEach((key) => {
        if (key !== "asCode" && item[key]) {
          const id = maps[key].get(String(item[key]).trim());
          if (id) updateObj[key] = id;
        }
      });

      // Logic bắt buộc Phase/PhaseGroup cho Đào và Xén
      if (!updateObj.phaseGroup && defaultGroup)
        updateObj.phaseGroup = defaultGroup._id;

      if (["excavation", "cutting"].includes(type) && !updateObj.phase) {
        invalidRows.push({
          row: rowIndex,
          error: "Tên Công đoạn không khớp với danh mục hệ thống",
        });
        continue;
      }

      // Logic xử lý Định mức (giữ nguyên khối check lỗi chi tiết của bạn)
      if (item.norms) {
        const normArray = String(item.norms)
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        const processedNorms = [];
        let hasErrorInNorm = false;

        for (const p of normArray) {
          if (!p.includes("=")) {
            invalidRows.push({
              row: rowIndex,
              error: `Định dạng sai tại cụm "${p}". Phải sử dụng dấu "=" (Ví dụ: KT10=1.5)`,
            });
            hasErrorInNorm = true;
            break;
          }
          const [c, v] = p.split("=");
          if (!c?.trim() || v === undefined || v?.trim() === "") {
            invalidRows.push({
              row: rowIndex,
              error: `Dữ liệu định mức "${p}" bị thiếu Mã hoặc Giá trị định mức`,
            });
            hasErrorInNorm = true;
            break;
          }

          const id = maps.asCode.get(c.trim());
          const val = parseFloat(v);

          if (!id) {
            invalidRows.push({
              row: rowIndex,
              error: `Mã vật tư '${c.trim()}' trong cột "Định mức" không tồn tại`,
            });
            hasErrorInNorm = true;
            break;
          }
          if (isNaN(val)) {
            invalidRows.push({
              row: rowIndex,
              error: `Giá trị "${v}" của mã "${c.trim()}" phải là một số hợp lệ`,
            });
            hasErrorInNorm = true;
            break;
          }
          processedNorms.push({ assignmentCode: id, norm: val });
        }

        if (hasErrorInNorm) continue;
        updateObj.norms = processedNorms;
      }

      // 5. PHÂN LOẠI OPERATION: UPDATE / INSERT / DUPLICATE
      // Sử dụng Optional Chaining ?. để tránh lỗi khi cleanCode là null
      const existedId = cleanCode ? codeMap.get(cleanCode.toLowerCase()) : null;

      if (item._id) {
        // Trường hợp có ID: Thực hiện UPDATE
        operations.push({
          updateOne: {
            filter: { _id: item._id },
            update: { $set: { ...updateObj, code: cleanCode } },
          },
        });
      } else if (cleanCode && !existedId) {
        // Trường hợp không có ID và Mã chưa tồn tại: Thực hiện INSERT
        operations.push({
          insertOne: { document: { ...updateObj, code: cleanCode } },
        });
      } else if (cleanCode && existedId) {
        // Trường hợp không có ID nhưng Mã đã tồn tại: Báo lỗi TRÙNG
        invalidRows.push({
          row: rowIndex,
          error: `Mã định mức "${cleanCode}" đã tồn tại trong hệ thống`,
        });
      }
    } // Kết thúc vòng lặp for

    // Thực thi BulkWrite (Đoạn này giữ nguyên như của bạn)
    const result =
      operations.length > 0 ? await AssignmentNorm.bulkWrite(operations) : null;

    // Trả về kết quả (Summary)
    res.status(200).json({
      status: "success",
      summary: {
        total: dataImport.length,
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
    let query = { type };
    if (req.query.q) query.code = new RegExp(req.query.q, "i");

    const data = await AssignmentNorm.find(query)
      .populate(
        "phaseGroup phase excavationTech step length cutting crossSection curbSlope hardness thickness",
      )
      .populate({ path: "norms.assignmentCode" });

    // 1. Định nghĩa Cột động theo Type
    let columns = [{ header: "Mã định mức", key: "code", width: 20 }];
    if (["excavation", "cutting"].includes(type)) {
      columns.push(
        { header: "Nhóm công đoạn", key: "phaseGroup", width: 0 },
        { header: "Công đoạn", key: "phase", width: 25 },
      );
    }

    if (type === "excavation") {
      columns.push(
        { header: "Công nghệ xúc", key: "excavationTech", width: 20 },
        { header: "Chống", key: "step", width: 20 },
        { header: "Độ cứng", key: "hardness", width: 15 },
      );
    } else if (type === "cutting") {
      // Đã loại bỏ Chiều dài, Cắt vỉa. Đổi tên thành Tiết diện lò xén
      columns.push(
        { header: "Tiết diện lò xén", key: "crossSection", width: 25 },
        { header: "Độ cứng", key: "hardness", width: 15 },
      );
    } else if (type === "coal_kb") {
      columns.push(
        { header: "Độ dày vỉa", key: "thickness", width: 15 },
        { header: "Độ dốc vỉa", key: "curbSlope", width: 15 },
        { header: "Độ cứng", key: "hardness", width: 15 },
      );
    } else if (type === "coal_zh") {
      columns.push(
        { header: "Độ dày vỉa", key: "thickness", width: 15 },
        { header: "Chiều dài", key: "length", width: 15 },
        { header: "Độ cứng", key: "hardness", width: 15 },
      );
    } else if (type === "coal_zry") {
      columns.push(
        { header: "Độ dày vỉa", key: "thickness", width: 15 },
        { header: "Chiều dài", key: "length", width: 15 },
        { header: "Độ cứng", key: "hardness", width: 15 },
      );
    }
    columns.push(
      { header: "Định mức", key: "norms", width: 100 },
      { header: "_id", key: "_id", width: 0 },
    );

    // 2. Format dữ liệu
    const formatNorm = (norms = []) =>
      norms.map((p) => `${p.assignmentCode?.code}=${p.norm}`).join(",");
    const formatted = (data || []).map((i) => {
      const row = {
        code: i.code || "",
        phaseGroup: i.phaseGroup?.name || "",
        phase: i.phase?.name || "",
        norms: formatNorm(i.norms || []),
        _id: i._id || "",
      };
      columns.forEach((col) => {
        if (!row[col.key] && i[col.key])
          row[col.key] = i[col.key].name || i[col.key];
      });
      return row;
    });

    // 3. Lọc Dropdown Phase theo Group
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
    const [pgs, ps, techs, sts, lens, cuts, secs, slos, hards, thics] =
      await Promise.all([
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

    worksheet.columns = columns;
    worksheet.addRows(formatted);

    // 4. Ẩn cột và tạo Dropdown
    columns.forEach((col, idx) => {
      if (["_id", "phaseGroup"].includes(col.key))
        worksheet.getColumn(idx + 1).hidden = true;
    });

    const addList = (letter, title, list, colKey) => {
      const idx = columns.findIndex((c) => c.key === colKey) + 1;
      if (idx <= 0) return;
      worksheet.getColumn(letter).values = [
        title,
        ...list.map((i) => i.name).filter(Boolean),
      ];
      worksheet.getColumn(letter).hidden = true;
      worksheet.dataValidations.add(
        `${worksheet.getColumn(idx).letter}2:${worksheet.getColumn(idx).letter}2000`,
        {
          type: "list",
          allowBlank: true,
          formulae: [`=$${letter}$2:$${letter}$${list.length + 1}`],
        },
      );
    };

    addList("BA", "pgList", pgs, "phaseGroup");
    addList("BB", "pList", ps, "phase");
    addList("BC", "tList", techs, "excavationTech");
    addList("BD", "sList", sts, "step");
    addList("BE", "lList", lens, "length");
    addList("BF", "cList", cuts, "cutting");
    addList("BG", "secList", secs, "crossSection");
    addList("BH", "sloList", slos, "curbSlope");
    addList("BI", "hList", hards, "hardness");
    addList("BJ", "thList", thics, "thickness");

    const editableKeys = columns
      .map((c) => c.key)
      .filter((k) => !["_id", "phaseGroup"].includes(k));
    const buffer = await configExport(workbook, worksheet, editableKeys, 2000);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=dinh_muc_${type}.xlsx`,
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
