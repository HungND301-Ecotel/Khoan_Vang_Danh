const CrossSection = require("../model/CrossSection");
const Unit = require("../model/Unit");
const { paginateQuery } = require("../utils/pagination");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { configExport } = require("../utils/config_export");

exports.create = async (req, res) => {
  try {
    const { name, uom } = req.body;
    const exitData = await CrossSection.countDocuments({ name: name })
    if (exitData > 0) {
      return res.status(409).json({ status: 'error', message: `Công nghệ xúc '${name}' đã tồn tại` })
    }
    const newCrossSection = new CrossSection({ name, uom });
    await newCrossSection.save();
    res.status(201).json({ status: "success", message: "Tạo thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updateData = await CrossSection.findByIdAndUpdate(
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
    const deleteData = await CrossSection.findByIdAndDelete(req.params.id);
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
      query.name = new RegExp(req.query.q, "i");
    }
    const modelQuery = CrossSection.find(query).populate("uom");
    const pagination = await paginateQuery(
      CrossSection,
      modelQuery,
      query,
      req.query
    );

    res.status(200).json({ status: "success", data: pagination });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const columnMapping = {
  "Tiết diện lò xén": "name",
  ĐVT: "uom",
  id: "_id",
  _id: "_id",
  uom: "ignored", // Thêm key cột ẩn cho dropdown
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
    const worksheet = workbook.Sheets[sheetName]; // Lấy header

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
    const mappedHeaders = headers.map((h) => columnMapping[h] || h); // Parse data

    const rawData = xlsx.utils.sheet_to_json(worksheet, {
      header: mappedHeaders,
      range: 1,
    }); // Lặp qua rawData để "fill down" giá trị name

    let lastName = null;
    const dataImport = rawData
      .map((row) => {
        // Loại bỏ cột ignored
        if (row.ignored !== undefined) delete row.ignored;

        const hasName = row.name && String(row.name).trim() !== ""; // Chuẩn hóa name và uom (trim)
        if (row.name) row.name = String(row.name).trim();
        if (row.uom) row.uom = String(row.uom).trim();

        if (hasName) {
          lastName = row.name;
          return row;
        } // Nếu dòng không có name nhưng có uom, thì đây là dòng mới của uom. // Ta sẽ gán name là lastName (từ dòng trên).

        if (!hasName && lastName) {
          row.name = lastName;
          return row;
        }

        return row;
      })
      .filter((row) => row.name || row._id); // Lọc chỉ giữ các dòng có name hoặc _id

    if (dataImport.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Không tìm thấy dữ liệu hợp lệ trong file.",
      });
    } // Lấy các unit từ DB

    const uniqueUnits = [
      ...new Set(dataImport.map((d) => d.uom).filter(Boolean)),
    ];

    const existingUnits = await Unit.find({
      name: { $in: uniqueUnits },
    }).lean();

    const unitMap = new Map(existingUnits.map((d) => [d.name.trim(), d._id])); // Tạo unit mới nếu chưa có

    for (const u of uniqueUnits) {
      if (!unitMap.has(u)) {
        const newUnit = await Unit.create({ name: u });
        unitMap.set(u, newUnit._id);
      }
    }

    const operations = dataImport.map((item) => {
      let { _id, name, uom, ...updateData } = item;

      let finalName = name ? String(name).trim() : null;
      let finalUom = uom ? String(uom).trim() : null; // CLEANUP _id

      if (_id) {
        _id = String(_id).replace(/"/g, "").trim();
        if (_id.length !== 24) _id = null;
      }

      let finalUpdateData = { ...updateData }; // Map unit name sang unitId (Chỉ gán nếu tồn tại trong map)

      if (finalUom && unitMap.has(finalUom)) {
        finalUpdateData.uom = unitMap.get(finalUom);
      }

      const $setFields = {
        ...(finalName ? { name: finalName } : {}),
        ...finalUpdateData, // Chứa uom đã map và các trường khác
      }; // ------- CASE 1: Có _id → update hoặc delete -------

      if (_id) {
        const hasData =
          Object.values(finalUpdateData).some(
            (v) => v !== undefined && v !== null && String(v).trim() !== ""
          ) ||
          (finalName && finalName !== "");

        if (!hasData) return { deleteOne: { filter: { _id } } };

        return {
          updateOne: {
            filter: { _id },
            update: { $set: $setFields },
            upsert: true,
          },
        };
      } // ------- CASE 2: Không có _id nhưng có name → upsert theo name -------

      if (finalName) {
        return {
          updateOne: {
            filter: { name: finalName },
            update: { $set: $setFields },
            upsert: true,
          },
        };
      } // ------- CASE 3: Insert mới (dòng gốc) -------

      return { insertOne: { document: item } };
    });

    if (operations.length > 0) {
      await CrossSection.bulkWrite(operations);
    }

    res.status(200).json({
      status: "success",
      message: "Import dữ liệu hoàn tất.",
      totalProcessed: dataImport.length,
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      status: "error",
      message: "Tải thất bại",
      error: err.message,
      stack: err.stack,
    });
  }
};

exports.export = async (req, res) => {
  try {
    const data = await CrossSection.find().populate("uom", "name");

    const columns = [
      { header: "Tiết diện lò xén", key: "name", width: 30 },
      { header: "ĐVT", key: "uom", width: 20 },
      { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
    ];

    const formatted = data.map((i) => ({
      name: i?.name || "",
      uom: i?.uom?.name || "",
      _id: i?._id || "", // Thêm _id
    }));

    const units = await Unit.find();
    const unitList = [...new Set(units.map((u) => u.name).filter(Boolean))];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("cross_section");

    worksheet.columns = columns;
    worksheet.addRows(formatted); // Ẩn cột id
    const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
    if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

    const MAX = Math.max(worksheet.rowCount + 100, 1000); // Cột ẩn cho dropdown

    worksheet.getColumn("X").values = ["uom", ...unitList];
    worksheet.getColumn("X").hidden = true; // Áp dụng data validation cho cột ĐVT (cột B)

    const uomColLetter = worksheet.getColumn(2).letter; // Cột B là cột thứ 2
    worksheet.dataValidations.add(`${uomColLetter}2:${uomColLetter}${MAX}`, {
      type: "list",
      allowBlank: true,
      formulae: [`=$X$2:$X$${unitList.length + 1}`],
    }); // Cột cần mở khóa chỉnh sửa

    const editableKeys = ["name", "uom"];

    const buffer = await configExport(workbook, worksheet, editableKeys, MAX);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=cross_section.xlsx"
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Tải thất bại",
      error: err.message,
      stack: err.stack,
    });
  }
};
