const Phase = require("../model/Phase");
const PhaseGroup = require("../model/PhaseGroup");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { code, name, phaseGroup } = req.body;
    const newPhase = new Phase({ code, name, phaseGroup });
    await newPhase.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await Phase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
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
    const deleteData = await Phase.findByIdAndDelete(req.params.id);
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
    if (req.query.phaseGroup) {
      query.phaseGroup = req.query.phaseGroup;
    }
    if (req.query.q) {
      query.$or = [
        { code: new RegExp(req.query.q, "i") },
        { name: new RegExp(req.query.q, "i") },
      ];
    }
    const modelQuery = Phase.find(query).populate("phaseGroup");
    const pagination = await paginateQuery(Phase, modelQuery, query, req.query);

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Mã công đoạn": "code",
  "Tên công đoạn": "name",
  "Nhóm công đoạn": "group",
};

exports.import = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "Vui lòng chọn file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Lấy header từ row đầu tiên
    const headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];

    // Map header → key trong DB
    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    );

    // Parse dữ liệu
    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    });

    // Lọc bản ghi hợp lệ
    const dataImport = data.filter((row) => row.code || row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    }

    // Lấy danh sách group trước để map
    const groups = await PhaseGroup.find().lean();
    const groupMap = {};
    groups.forEach((g) => {
      if (g.name) groupMap[g.name.trim()] = g._id;
    });

    const operations = dataImport.map((item) => {
      const { code, group, ...updateData } = item;

      // Map tên group -> ObjectId
      if (group && groupMap[group.trim()]) {
        updateData.phaseGroup = groupMap[group.trim()];
      } else {
        updateData.phaseGroup = null; // hoặc bỏ nếu muốn giữ nguyên
      }

      if (code) {
        return {
          updateOne: {
            filter: { code: code },
            update: { $set: updateData },
            upsert: true,
          },
        };
      }

      return {
        insertOne: {
          document: updateData,
        },
      };
    });

    await Phase.bulkWrite(operations);

    res.status(200).json({
      status: "success",
      message: `Import thành công. Đã xử lý ${dataImport.length} bản ghi.`,
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
    const data = await Phase.find().populate("phaseGroup", "name");

    const columns = [
      { header: "Mã công đoạn", key: "code", width: 20 },
      { header: "Tên công đoạn", key: "name", width: 30 },
      { header: "Nhóm công đoạn", key: "group", width: 20 }, // dropdown
    ];

    // Format để gán vào file Excel (group là tên)
    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      group: i?.phaseGroup?.name || "", // tên để show
    }));

    // Lấy danh sách nhóm công đoạn
    const groups = await PhaseGroup.find();

    const groupList = [...new Set(groups.map((p) => p.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cong_doan_san_xuat");

    // 1. Thêm dữ liệu chính
    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    // 2. Danh sách dropdown
    // - Nhét vào cột X
    worksheet.getColumn("X").values = ["groups", ...groupList];
    worksheet.getColumn("X").hidden = true;

    // 3. Ràng buộc dropdown cho cột "Nhóm công đoạn"
    // => cột C (vì C là cột thứ 3)
    const validations = [
      {
        range: `C2:C${MAX}`, // cột Nhóm công đoạn
        formula: `=$X$2:$X$${groupList.length + 1}`, // dropdown từ X2 → X(n)
      },
    ];

    const buffer = await configExport(workbook, worksheet, validations, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cong_doan_san_xuat.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
