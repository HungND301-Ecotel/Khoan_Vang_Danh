const ProductionScope = require("../model/ProductionScope");
const Phase = require('../model/Phase')
const { paginateQuery } = require("../utils/pagination");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");

exports.create = async (req, res) => {
  try {
    const { code, name, phases } = req.body;
    const exitData = await ProductionScope.countDocuments({ code: code })
    if (exitData > 0) {
      return res.status(409).json({ status: 'error', message: `Mã diện sản xuất '${code}' đã tồn tại` })
    }
    const newProductionScope = new ProductionScope({ code, name, phases });
    await newProductionScope.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  Mã: "code",
  Code: "code",
  Tên: "name",
  Name: "name",
  "Công đoạn": "phase",
  Phase: "phase",
  id: "_id",
  _id: "_id",
};

exports.import = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });
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
    const dataImport = data.filter((row) => row.code || row.name || row._id);
    if (dataImport.length === 0)
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });

    const phases = await Phase.find().lean();
    const phaseMap = {};
    phases.forEach((g) => {
      if (g.code) phaseMap[g.code.trim()] = g._id;
    });

    const operations = dataImport.map((item) => {
      let { _id, code, name, phase, ...updateData } = item;
      let phaseIds = [];
      if (phase) {
        try {
          // Nếu phase là chuỗi dạng '["XLT","DLD"]', parse nó thành mảng
          let phaseCodes = [];
          if (typeof phase === 'string' && phase.startsWith('[')) {
            phaseCodes = JSON.parse(phase.replace(/'/g, '"')); // Đảm bảo đúng định dạng JSON
          } else if (Array.isArray(phase)) {
            phaseCodes = phase;
          } else {
            phaseCodes = [String(phase).trim()];
          }
          // Chuyển đổi mã code thành _id từ phaseMap
          phaseIds = phaseCodes
            .map(p => phaseMap[String(p).trim()])
            .filter(id => id); // Loại bỏ các giá trị null/undefined nếu không tìm thấy mã
        } catch (e) {
          console.error("Lỗi parse phase:", phase, e.message);
          phaseIds = [];
        }
      }

      // CLEANUP _id
      if (_id) {
        _id = String(_id).replace(/"/g, "").trim(); // xoá dấu "
        if (_id.length !== 24) _id = null; // nếu không đúng ObjectId thì bỏ
      }

      if (_id) {
        const hasData =
          Object.values(updateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (code && String(code).trim() !== "") ||
          (name && String(name).trim() !== "");

        if (!hasData) return { deleteOne: { filter: { _id } } };
        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...(code ? { code } : {}),
                ...(name ? { name } : {}),
                ...(phaseIds.length > 0 ? { phases: phaseIds.map(i => ({ phase: i })) } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      }
      if (code)
        return {
          updateOne: {
            filter: { code },
            update: {
              $set: { ...(name ? { name } : {}), ...(code ? { code } : {}), ...(phaseIds.length > 0 ? { phases: phaseIds.map(i => ({ phase: i })) } : {}) },
            },
            upsert: true,
          },
        };
      if (name)
        return {
          updateOne: {
            filter: { name },
            update: { $set: { name, ...(phaseIds.length > 0 ? { phases: phaseIds.map(i => ({ phase: i })) } : {}) } },
            upsert: true,
          },
        };
      const updateFields = {
        ...(code ? { code: String(code).trim() } : {}),
        ...(name ? { name: String(name).trim() } : {}),
        ...(phaseIds.length > 0 ? { phases: phaseIds.map(i => ({ phase: i })) } : {}), // Thêm mảng ID công đoạn vào đây
        ...updateData,
      };
      return { insertOne: { document: updateFields } };
    });

    await ProductionScope.bulkWrite(operations);
    res.status(200).json({
      status: "success",
      message: `Import file thành công. Đã xử lý ${dataImport.length} bản ghi.`,
    });
  } catch (error) {
    console.log(error.stack);
    res
      .status(500)
      .json({ status: "error", message: "Tải thất bại", error: error.message });
  }
};

exports.export = async (req, res) => {
  try {
    const data = await ProductionScope.find().populate('phases.phase', 'code');
    const columns = [
      { header: "Mã", key: "code", width: 20 },
      { header: "Tên", key: "name", width: 30 },
      { header: "Công đoạn", key: "phase", width: 30 },
      { header: "_id", key: "_id", width: 20 },
    ];
    const formated = (data || []).map((d) => ({
      code: d?.code || "",
      name: d?.name || "",
      phase: d?.phases.map(i => i.phase?.code) || "",
      _id: d?._id || "",
    }));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("production_scope");
    worksheet.columns = columns;
    worksheet.addRows(formated);
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;
    const MAX = Math.max(worksheet.rowCount + 100, 1000);
    const buffer = await configExport(
      workbook,
      worksheet,
      ["code", "name", 'phase'],
      MAX
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `production_scope.xlsx`
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await ProductionScope.findByIdAndUpdate(
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
    const deleteData = await ProductionScope.findByIdAndDelete(req.params.id);
    if (!deleteData) {
      return res.status(404).json({ status: "error", message: "Xóa thất bại" });
    }
    res.status(200).json({ status: "success", message: "Xóa thành công" });
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
    const modelQuery = ProductionScope.find(query).populate({
      path: "phases.phase",
      populate: 'phaseGroup',
    });
    const pagination = await paginateQuery(
      ProductionScope,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};
