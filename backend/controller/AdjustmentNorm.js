const AdjustmentNorm = require('../model/AdjustmentNorm')
const AssignmentCode = require('../model/AssignmentCode')
const Hardness = require('../model/Hardness')
const MirrorRatio = require('../model/MirrorRatio')
const { AdjustmentType } = require('../config/constant')
const RockRatio = require('../model/RockRatio')
const ExcelJS = require('exceljs')
const xlsx = require('xlsx')
const { configExport } = require('../utils/config_export')

const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, mirrorRatio, hardness, rockRatio, type, norms } = req.body
        const exitAdjustment = await AdjustmentNorm.countDocuments({ code: code })
        if (exitAdjustment > 0) {
            return res.status(409).json({ status: 'error', message: `Mã hệ số điều chỉnh định mức '${code}' đã tồn tại` })
        }
        const newAdjustmentNorm = new AdjustmentNorm({ code, hardness, mirrorRatio, rockRatio, type, norms })
        await newAdjustmentNorm.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await AdjustmentNorm.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await AdjustmentNorm.findByIdAndDelete(req.params.id)
        if (!deleteData) {
            return res.status(404).json({ status: 'error', message: 'Xóa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Xóa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.get = async (req, res) => {
    try {
        let query = {}
        if (req.query.q) {
            query.code = new RegExp(req.query.q, 'i')
        }
        if (req.query.type) {
            query.type = new RegExp(req.query.type, 'i')
        }
        const modelQuery = AdjustmentNorm.find(query)
            .populate('mirrorRatio')
            .populate('rockRatio')
            .populate('hardness')
            .populate({
                path: 'norms.assignmentCode',
                populate: 'uom'
            })
        const pagination = await paginateQuery(AdjustmentNorm, modelQuery, query, req.query)

        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

const columnMapping = {
    "Loại": "type",
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
    type: "ignored"
};

const parseNorms = (normsString, assignmentCodeMap) => {
    if (!normsString || typeof normsString !== 'string') return [];

    return normsString.split(',').map(pair => {
        const [code, value] = pair.split('=');
        const trimmedCode = code?.trim();
        const normValue = parseFloat(value);

        const assignmentId = assignmentCodeMap.get(trimmedCode);

        if (assignmentId && !isNaN(normValue)) {
            return {
                assignmentCode: assignmentId,
                norm: normValue
            };
        }
        return null;
    }).filter(Boolean); // Loại bỏ các cặp không hợp lệ hoặc không tìm thấy code
};
exports.import = async (req, res) => {
    try {
        // const user = req.user;
        if (!req.file) {
            return res
                .status(400)
                .json({ status: "error", message: "Vui lòng chọn file" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

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

        const mappedHeaders = headers.map(
            (header) => columnMapping[header] || header
        );
        const data = xlsx.utils.sheet_to_json(worksheet, {
            header: mappedHeaders,
            range: 1,
        }); // Lọc bản ghi hợp lệ: có _id HOẶC (có code VÀ có name)

        const dataImport = data.filter((row) => (row._id || row.code) && row.type);

        if (dataImport.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Không tìm thấy dữ liệu hợp lệ trong file.",
            });
        } // Lấy danh sách codes/units để tìm kiếm

        const uniqueRockRatios = [
            ...new Set(
                dataImport.map((d) => String(d.rockRatio).trim()).filter(Boolean)
            ),
        ];
        const uniqueMirrorRatios = [
            ...new Set(dataImport.map((d) => String(d.mirrorRatio).trim()).filter(Boolean)),
        ];

        const uniqueHardness = [
            ...new Set(dataImport.map((d) => String(d.hardness).trim()).filter(Boolean)),
        ];

        const [existingMirrorRatios, existingRockRatios, exitingHardness] = await Promise.all([
            MirrorRatio.find({ name: { $in: uniqueMirrorRatios } }).lean(),
            RockRatio.find({ name: { $in: uniqueRockRatios } }).lean(),
            Hardness.find({ name: { $in: uniqueHardness } }).lean(),
        ]);

        const rockRatioMap = new Map(
            existingRockRatios.map((d) => [d.name, d._id])
        );
        const mirrorRatioMap = new Map(existingMirrorRatios.map((d) => [d.name, d._id]));
        const hardnessMap = new Map(exitingHardness.map((d) => [d.name, d._id]));

        const assignmentCodes = await AssignmentCode.find()
        const assignmentCodeMap = new Map(assignmentCodes.map((d) => [d.code, d._id]));

        const operations = [];
        const invalidRows = [];

        for (const item of dataImport) {
            // Loại bỏ cột ignored
            if (item.ignored !== undefined) delete item.ignored;

            let { _id, type, code, rockRatio, mirrorRatio, hardness, norms, ...updateData } =
                item;

            // --- CLEANUP _id ---
            if (_id) {
                _id = String(_id).replace(/"/g, "").trim();
                if (_id.length !== 24) _id = null;
            } // --- Xử lý Tham chiếu và Dữ liệu ---

            let finalUpdateData = { ...updateData };

            if (type) {
                if ([AdjustmentType.CKKT, AdjustmentType.CKĐL, AdjustmentType.CM].includes(String(type).trim())) {
                    finalUpdateData.type = String(type).trim()
                } else {
                    invalidRows.push({
                        item,
                        error: `Loại định mức không hợp lệ: ${type}`,
                    });
                    continue;
                }
            }

            if (norms) {
                finalUpdateData.norms = parseNorms(String(norms), assignmentCodeMap);
            }

            if (hardness) {
                const trimmedHardness = String(hardness).trim();
                const hardnessId = hardnessMap.get(trimmedHardness);
                if (!hardnessId) {
                    invalidRows.push({
                        item,
                        error: `Độ cứng f không hợp lệ: ${hardness}`,
                    });
                    continue;
                }
                finalUpdateData.hardness = hardnessId;
            } // 2. Xử lý uom

            if (rockRatio) {
                const trimmedRockRatio = String(rockRatio).trim();
                const rockRatioId = rockRatioMap.get(trimmedRockRatio);
                if (!rockRatioId) {
                    invalidRows.push({ item, error: `Tỉ lệ đá lẫn trong gương không hợp lệ: ${rockRatio}` });
                    continue;
                }
                finalUpdateData.rockRatio = rockRatioId;
            } else {
                finalUpdateData.rockRatio = null;
            }

            if (mirrorRatio) {
                const trimmedMirrorRatio = String(mirrorRatio).trim();
                const mirrorRatioId = mirrorRatioMap.get(trimmedMirrorRatio);
                if (!mirrorRatioId) {
                    invalidRows.push({ item, error: `Tỉ lệ gương than mềm không hợp lệ: ${mirrorRatio}` });
                    continue;
                }
                finalUpdateData.mirrorRatio = mirrorRatioId;
            } else {
                finalUpdateData.mirrorRatio = null;
            }

            // ------- CASE 1: Có _id → update hoặc delete -------
            if (_id) {
                console.log(finalUpdateData)
                const hasData =
                    Object.values(finalUpdateData).some(
                        (v) => v !== undefined && v !== null && String(v).trim() !== ""
                    ) ||
                    (code && String(code).trim() !== "")

                if (!hasData) {
                    operations.push({ deleteOne: { filter: { _id } } });
                    continue;
                }

                operations.push({
                    updateOne: {
                        filter: { _id },
                        update: {
                            $set: {
                                ...(code ? { code: String(code).trim() } : {}),
                                ...finalUpdateData,
                            },
                        },
                        upsert: true,
                    },
                });
                continue;
            }

            // ------- CASE 2: Không có _id nhưng có code và name → upsert theo cặp (code, name) -------
            if (code) {
                operations.push({
                    updateOne: {
                        filter: {
                            code: String(code).trim(),
                        },
                        update: {
                            $set: {
                                code: String(code).trim(),
                                ...finalUpdateData, // Bao gồm FKs và quantity
                            },
                        },
                        upsert: true,
                    },
                });
                continue;
            }
        }

        let bulkResult = null;
        if (operations.length > 0) {
            bulkResult = await AdjustmentNorm.bulkWrite(operations);
        }
        res.status(200).json({
            status: "success",
            message: "Import dữ liệu hoàn tất.",
            summary: {
                totalProcessed: dataImport.length,
                insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
                updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
                invalidCount: invalidRows.length,
            },
            invalidRows: invalidRows,
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
        let query = {};
        if (req.query.type) {
            query.type = new RegExp(req.query.type, 'i')
        }
        const data = await AdjustmentNorm.find(query)
            .populate('mirrorRatio')
            .populate('rockRatio')
            .populate('hardness')
            .populate({
                path: 'norms.assignmentCode',
                populate: 'uom'
            })

        const columns = [
            { header: "Loại", key: "type", width: 15 },
            { header: "Mã định mức", key: "code", width: 20 },
            [AdjustmentType.CKKT, AdjustmentType.CKĐL].includes(req.query.type) && { header: "Độ cứng f", key: "hardness", width: 20 },
            [AdjustmentType.CKKT, AdjustmentType.CKĐL].includes(req.query.type) && { header: "Tỷ lệ đá lẫn trong gương", key: "rockRatio", width: 25 },
            [AdjustmentType.CM].includes(req.query.type) && { header: "Tỷ lệ gương than mềm", key: "mirrorRatio", width: 25 },
            { header: "Định mức", key: "norms", width: 200 },
            { header: "_id", key: "_id", width: 20 }, // Thêm cột _id
        ].filter(Boolean);

        const formatNorm = (norms = []) =>
            norms
                .map(p => `${p.assignmentCode?.code}=${p.norm}`)
                .join(",");

        const formated = (data || []).map((i) => ({
            type: i?.type || '',
            code: i?.code || "",
            ...([AdjustmentType.CKKT, AdjustmentType.CKĐL].includes(req.query.type) ? { hardness: i?.hardness?.name || "" } : {}),
            ...([AdjustmentType.CKKT, AdjustmentType.CKĐL].includes(req.query.type) ? { rockRatio: i?.rockRatio?.name || "" } : {}),
            ...([AdjustmentType.CM].includes(req.query.type) ? { mirrorRatio: i?.mirrorRatio?.name || "" } : {}),
            norms: formatNorm(i?.norms || []),
            _id: i?._id || "", // Thêm _id
        }));

        const hardness = await Hardness.find();
        const rockRatios = await RockRatio.find();
        const mirrorRatios = await MirrorRatio.find();



        const hardnessList = [...new Set(hardness.map((d) => d.name).filter(Boolean))];
        const rockRatioList = [...new Set(rockRatios.map((d) => d.name).filter(Boolean))];
        const mirrorRatioList = [...new Set(mirrorRatios.map((d) => d.name).filter(Boolean))];


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("he_so_dieu_chinh_dinh_muc");

        worksheet.columns = columns;
        worksheet.addRows(formated);

        const MAX = Math.max(worksheet.rowCount + 100, 1000); // Ẩn cột id

        const idCol = worksheet.columns.findIndex((c) => c && c.key === "_id") + 1;
        if (idCol > 0) worksheet.getColumn(idCol).hidden = true;

        const editableKeys = ["code", "norms"];
        // --- KHỐI LOGIC DROP DOWN BẮT ĐẦU ---

        worksheet.dataValidations.add(`A2:A${MAX}`, {
            type: 'list',
            allowBlank: true,
            formulae: ['"CM,CKĐL,CKKT"'],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
        });

        if ([AdjustmentType.CKKT, AdjustmentType.CKĐL].includes(req.query.type)) {
            // Cột ĐVT luôn được thêm vào cột Y
            const hardnessColIndex = columns.findIndex((c) => c && c.key === "hardness"); // Cột ĐVT
            const hardnessolLetter = worksheet.getColumn(hardnessColIndex + 1).letter;

            worksheet.getColumn("Y").values = ["hardness", ...hardnessList];
            worksheet.getColumn("Y").hidden = true;

            // Áp dụng Data Validation cho cột ĐVT (luôn luôn)
            worksheet.dataValidations.add(`${hardnessolLetter}2:${hardnessolLetter}${MAX}`, {
                type: "list",
                allowBlank: true,
                formulae: [`=$Y$2:$Y$${hardnessList.length + 1}`],
            });
            editableKeys.push("hardness");
        }

        if ([AdjustmentType.CKKT, AdjustmentType.CKĐL].includes(req.query.type)) {
            const rockRatioColIndex = columns.findIndex(
                (c) => c && c.key === "rockRatio"
            );
            const rockRatioColLetter = worksheet.getColumn(
                rockRatioColIndex + 1
            ).letter;

            // Thêm cột X cho Mã giao khoán
            worksheet.getColumn("X").values = [
                "rockRatios",
                ...rockRatioList,
            ];
            worksheet.getColumn("X").hidden = true;

            // Áp dụng Data Validation cho Mã giao khoán
            worksheet.dataValidations.add(
                `${rockRatioColLetter}2:${rockRatioColLetter}${MAX}`,
                {
                    type: "list",
                    allowBlank: true,
                    formulae: [`=$X$2:$X$${rockRatioList.length + 1}`],
                }
            );

            editableKeys.push("rockRatio"); // Cho phép sửa cột này
        }

        if ([AdjustmentType.CM].includes(req.query.type)) {
            const mirrorRatioColIndex = columns.findIndex(
                (c) => c && c.key === "mirrorRatio"
            );
            const mirrorRatioColLetter = worksheet.getColumn(
                mirrorRatioColIndex + 1
            ).letter;

            // Thêm cột X cho Mã giao khoán
            worksheet.getColumn("W").values = [
                "mirrorRatios",
                ...mirrorRatioList,
            ];
            worksheet.getColumn("W").hidden = true;

            // Áp dụng Data Validation cho Mã giao khoán
            worksheet.dataValidations.add(
                `${mirrorRatioColLetter}2:${mirrorRatioColLetter}${MAX}`,
                {
                    type: "list",
                    allowBlank: true,
                    formulae: [`=$W$2:$W$${mirrorRatioList.length + 1}`],
                }
            );

            editableKeys.push("mirrorRatio"); // Cho phép sửa cột này
        }

        // --- KHỐI LOGIC DROP DOWN KẾT THÚC ---

        const buffer = await configExport(
            workbook,
            worksheet,
            editableKeys, // Truyền đúng editableKeys
            MAX
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=he_so_dieu_chinh_dinh_muc.xlsx"
        );
        res.send(buffer);
    } catch (err) {
        console.log(err.stack)
        res
            .status(500)
            .send({ status: "error", message: err.message, stack: err.stack });
    }
};


