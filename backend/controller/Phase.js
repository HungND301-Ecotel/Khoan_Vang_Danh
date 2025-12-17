const Phase = require("../model/Phase");
const PhaseGroup = require("../model/PhaseGroup");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const { configExport } = require("../utils/config_export");
const { paginateQuery } = require("../utils/pagination");

exports.create = async (req, res) => {
  try {
    const { code, name, phaseGroup } = req.body;
    const exitPhase = await Phase.countDocuments({ code: code })
    if (exitPhase > 0) {
      return res.status(409).json({ status: 'error', message: `Mã công đoạn '${code}' đã tồn tại` })
    }
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
  id: "_id",
  _id: "_id",
  groups: "ignored", // **Bổ sung key này để cho phép cột groups**
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
    const worksheet = workbook.Sheets[sheetName]; // Lấy header từ row đầu tiên

    let headers = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 0,
      raw: true,
    })[0];

    headers = headers.map((h) => String(h).trim()); // 1. Kiểm tra Header không hợp lệ

    const allowedHeaders = Object.keys(columnMapping);
    const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h));

    if (invalidHeaders.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File không hợp lệ. Các cột sau không được phép: ${invalidHeaders.join(
          ", "
        )}`,
      });
    } // Map header → key trong DB

    const mappedHeaders = headers.map(
      (header) => columnMapping[header] || header
    ); // Parse dữ liệu

    const data = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    }); // Lọc bản ghi hợp lệ

    const dataImport = data.filter((row) => row._id || row.code || row.name);

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    } // Lấy danh sách group trước để map

    const groups = await PhaseGroup.find().lean();
    const groupMap = {};
    groups.forEach((g) => {
      if (g.name) groupMap[g.name.trim()] = g._id;
    });

    const operations = dataImport.map((item) => {
      // Loại bỏ key 'ignored' khỏi item nếu có
      if (item.ignored !== undefined) delete item.ignored;
      let { _id, code, name, group, ...updateData } = item; // --- CLEANUP _id ---

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      } // Map tên group -> ObjectId và thêm vào updateData

      if (group && groupMap[String(group).trim()]) {
        updateData.phaseGroup = groupMap[String(group).trim()];
      } else if (group === null || String(group).trim() === "") {
        updateData.phaseGroup = null;
      } // ------- CASE 1: Có _id → update hoặc delete -------

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
                ...(code ? { code: String(code).trim() } : {}),
                ...(name ? { name: String(name).trim() } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      } // ------- CASE 2: Không có _id nhưng có code → upsert theo code -------

      if (code) {
        return {
          updateOne: {
            filter: { code: String(code).trim() },
            update: {
              $set: {
                code: String(code).trim(),
                ...(name ? { name: String(name).trim() } : {}),
                ...updateData,
              },
            },
            upsert: true,
          },
        };
      } // ------- CASE 3: Insert mới (Không có _id, không có code) -------

      return {
        insertOne: {
          document: {
            ...item,
            ...updateData,
          },
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
      { header: "Nhóm công đoạn", key: "group", width: 20 },
      { header: "_id", key: "_id", width: 20 },
    ];

    const formated = (data || []).map((i) => ({
      code: i?.code || "",
      name: i?.name || "",
      group: i?.phaseGroup?.name || "",
      _id: i?._id || "",
    }));

    const groups = await PhaseGroup.find();
    const groupList = [...new Set(groups.map((p) => p.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cong_doan_san_xuat");

    worksheet.columns = columns;
    worksheet.addRows(formated);

    const MAX = Math.max(worksheet.rowCount + 100, 1000);

    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    // **ĐIỀU CHỈNH: Đặt header cột ẩn là null hoặc chuỗi rỗng để tránh xung đột**
    // Tuy nhiên, vì code phía dưới vẫn tham chiếu đến $X$2, chúng ta cần giữ nguyên cấu trúc
    // và chỉ cần thêm "groups" vào columnMapping (đã làm ở trên).
    // Giữ nguyên dòng này:
    worksheet.getColumn("X").values = ["groups", ...groupList];
    worksheet.getColumn("X").hidden = true;

    worksheet.dataValidations.add(`C2:C${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$X$2:$X$${groupList.length + 1}`],
    });

    const editableKeys = ["code", "name", "group"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

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
    console.log(err.stack);
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
};
