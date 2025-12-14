const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const { PhaseType } = require('../config/constant')
const ExcelJS = require('exceljs');

// function processBudgetAndUsedData(materialBudget, materialCostUsed, phase) {
//     const budgetPhase = materialBudget.phases[0];
//     const usedMaterials = materialCostUsed.materials;

//     const mergedGroupsMap = new Map();

//     // ----------------------------------------------------------------------
//     // 1. TẠO KHUNG NHÓM TỪ DỮ LIỆU KẾ HOẠCH (BUDGET)
//     // --- (Phần này không thay đổi, dùng Map.set) ---
//     // ----------------------------------------------------------------------
//     budgetPhase.budgetCostDetails.forEach(detail => {
//         const code = detail.assignmentCode.code;
//         const price = detail.price || 0;
//         const compoundKey = `${code}_${price}`;

//         mergedGroupsMap.set(compoundKey, {
//             assignmentCode: detail.assignmentCode,
//             baseNorm: detail.baseNorm,
//             adjustmentNorm: detail.adjustmentNorm,
//             norm: detail.norm,
//             price: price,
//             plan_Quantity: detail.quantity || 0,
//             plan_Cost: detail.cost || 0,
//             used_Quantity: 0,
//             used_Cost: 0,
//             materialUseds: []
//         });
//     });

//     // ----------------------------------------------------------------------
//     // 2. HỢP NHẤT DỮ LIỆU THỰC HIỆN (USED) VÀO KHUNG VÀ TÍNH TỔNG
//     // ----------------------------------------------------------------------
//     usedMaterials.forEach(mat => {
//         const assignmentCodeDoc = mat.material?.assignmentCode;
//         const code = assignmentCodeDoc?.code || '';
//         const matPrice = mat.price || 0;
//         const quantity = mat.quantity || 0;
//         const cost = mat.cost || 0;

//         // TẠO KHÓA HỢP NHẤT
//         const compoundKey = assignmentCodeDoc ? `${code}_${matPrice}` : 'NO_ASSIGNMENTCODE';

//         let group = mergedGroupsMap.get(compoundKey);

//         if (!group) {
//             // Trường hợp: Vật tư không có trong Kế hoạch (hoặc có giá khác) HOẶC không có Mã giao khoán

//             // Khởi tạo nhóm mới và thêm vào Map
//             group = {
//                 assignmentCode: assignmentCodeDoc,
//                 baseNorm: '',
//                 adjustmentNorm: '',
//                 norm: '',
//                 price: assignmentCodeDoc ? matPrice : '',
//                 plan_Quantity: 0,
//                 plan_Cost: 0,
//                 used_Quantity: 0,
//                 used_Cost: 0,
//                 materialUseds: []
//             };
//             mergedGroupsMap.set(compoundKey, group);
//         }

//         // Cập nhật tổng thực hiện (cho cả nhóm cũ và nhóm mới được tạo)
//         group.used_Quantity += quantity;
//         group.used_Cost += cost;

//         // Thêm chi tiết vật tư vào nhóm
//         group.materialUseds.push({
//             material: mat.material,
//             quantity: quantity,
//             price: matPrice,
//             cost: cost
//         });
//     });

//     const finalGroups = Array.from(mergedGroupsMap.values()).map(group => {

//         const varianceQuantity = group.plan_Quantity - group.used_Quantity;
//         const varianceCost = group.plan_Cost - group.used_Cost;

//         return {
//             ...group,
//             varianceQuantity: varianceQuantity,
//             varianceCost: varianceCost,
//         };
//     });

//     finalGroups.sort((a, b) => {
//         const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
//         const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';

//         // 1. Đẩy nhóm không có Mã giao khoán xuống cuối
//         if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') {
//             return 1; // A lớn hơn B -> A đi sau
//         }
//         if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') {
//             return -1; // A nhỏ hơn B -> A đi trước
//         }

//         // 2. Sắp xếp Alphabetical (A-Z) cho các nhóm có Mã giao khoán
//         // Hoặc nếu cả hai đều là 'NO_ASSIGNMENTCODE' (sắp xếp giữa các nhóm rỗng)
//         if (codeA < codeB) {
//             return -1;
//         }
//         if (codeA > codeB) {
//             return 1;
//         }

//         return 0; // Giữ nguyên thứ tự nếu bằng nhau
//     });

//     return finalGroups;
// }
function processBudgetAndUsedData(materialBudgetDocs, materialCostUsedDocs, phase) {
    const mergedGroupsMap = new Map();

    // 1. Hợp nhất TẤT CẢ Budget Phases từ TẤT CẢ Budget Docs
    materialBudgetDocs.forEach(budgetDoc => {

        // Lọc phase nếu tham số phase được truyền
        const phasesToProcess = phase
            ? budgetDoc.phases.filter(p => String(p.phase._id) === phase)
            : budgetDoc.phases;

        phasesToProcess.forEach(budgetPhase => {
            budgetPhase.budgetCostDetails.forEach(detail => {
                const code = detail.assignmentCode.code;
                const price = detail.price || 0;
                const compoundKey = `${code}_${price}`;

                // Nếu đã tồn tại key, cộng dồn Quantity và Cost (vì có thể trùng ở document khác)
                if (mergedGroupsMap.has(compoundKey)) {
                    const existing = mergedGroupsMap.get(compoundKey);
                    existing.plan_Quantity += detail.quantity || 0;
                    existing.plan_Cost += detail.cost || 0;
                } else {
                    // Khởi tạo nhóm mới
                    mergedGroupsMap.set(compoundKey, {
                        assignmentCode: detail.assignmentCode,
                        baseNorm: detail.baseNorm,
                        adjustmentNorm: detail.adjustmentNorm,
                        norm: detail.norm,
                        price: price,
                        plan_Quantity: detail.quantity || 0, // Giá trị khởi tạo
                        plan_Cost: detail.cost || 0,         // Giá trị khởi tạo
                        used_Quantity: 0,
                        used_Cost: 0,
                        materialUseds: []
                    });
                }
            });
        });
    });


    // 2. Hợp nhất TẤT CẢ Used Materials từ TẤT CẢ Used Docs
    materialCostUsedDocs.forEach(usedDoc => {
        // Lặp qua tất cả vật tư trong document Used này
        usedDoc.materials.forEach(mat => {
            const assignmentCodeDoc = mat.material?.assignmentCode;
            const code = assignmentCodeDoc?.code || '';
            const matPrice = mat.price || 0;
            const quantity = mat.quantity || 0;
            const cost = mat.cost || 0;

            const compoundKey = assignmentCodeDoc ? `${code}_${matPrice}` : 'NO_ASSIGNMENTCODE';

            let group = mergedGroupsMap.get(compoundKey);

            if (!group) {
                // Trường hợp vật tư Used không có trong Budget Hợp nhất
                group = {
                    assignmentCode: assignmentCodeDoc,
                    baseNorm: '', adjustmentNorm: '', norm: '',
                    price: assignmentCodeDoc ? matPrice : '',
                    plan_Quantity: 0, plan_Cost: 0,
                    used_Quantity: 0, used_Cost: 0,
                    materialUseds: []
                };
                mergedGroupsMap.set(compoundKey, group);
            }

            // Cập nhật tổng thực hiện (cho cả nhóm cũ và nhóm mới được tạo)
            group.used_Quantity += quantity;
            group.used_Cost += cost;

            // Thêm chi tiết vật tư vào nhóm (Có thể có chi tiết từ các Used Docs khác nhau)
            group.materialUseds.push({
                material: mat.material, quantity: quantity, price: matPrice, cost: cost
            });
        });
    });

    // 3. Tính toán Variance và Sắp xếp (Không đổi)
    const finalGroups = Array.from(mergedGroupsMap.values()).map(group => {
        const varianceQuantity = group.plan_Quantity - group.used_Quantity;
        const varianceCost = group.plan_Cost - group.used_Cost;
        return {
            ...group,
            varianceQuantity: varianceQuantity,
            varianceCost: varianceCost,
        };
    });

    // ... (Phần sắp xếp giữ nguyên) ...
    finalGroups.sort((a, b) => {
        const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
        const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
        // 1. Đẩy nhóm không có Mã giao khoán xuống cuối
        if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') {
            return 1;
        }
        if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') {
            return -1;
        }
        // 2. Sắp xếp Alphabetical
        if (codeA < codeB) {
            return -1;
        }
        if (codeA > codeB) {
            return 1;
        }
        return 0;
    });

    return finalGroups;
}

async function getMonth(res, productionScope, phase, matchQuery) {
    const materialCostUseds = await MaterialCostUsed.find(matchQuery)
        .populate({
            path: 'productionScope',
            select: 'code name phases',
            populate: [
                { path: 'phases.phase', populate: 'code name' }
            ]
        })
        .populate('phases.phase', 'code name')
        .populate({
            path: 'materials.material',
            populate: [
                { path: 'uom', select: 'name' },
                {
                    path: 'assignmentCode', select: 'code name uom deviceCode',
                    populate: [
                        { path: 'uom' },
                        { path: 'deviceCode' },
                    ]
                }
            ]
        }).lean();

    if (materialCostUseds.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy dữ liệu chi phí thực hiện.' });
    }

    const materialBudgets = await MaterialBudget.find(matchQuery)
        .populate({
            path: 'productionScope',
            select: 'code name phases',
            populate: [
                { path: 'phases.phase', populate: 'code name' }
            ]
        })
        .populate('phases.phase', 'code name')
        .populate({
            path: 'phases.budgetCostDetails.assignmentCode', // Đường dẫn lồng
            select: 'code name uom deviceCode',
            populate: [
                { path: 'uom' },
                { path: 'deviceCode' },
            ]
        })
        .populate({
            path: 'phases.assignmentNormCode',
            select: 'norms code',
            populate: [
                { path: 'norms.assignmentCode', populate: 'uom' }
            ]
        })
        .populate({
            path: 'phases.adjustmentNormCode',
            select: 'norms code rockRatio',
            populate: [
                { path: 'norms.assignmentCode', populate: 'uom' },
                { path: 'rockRatio', select: 'name' }
            ]
        }).lean();

    if (materialBudgets.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy dữ liệu chi phí kế hoạch.' });
    }

    const allScopes = new Map();
    const allPhases = new Map();

    // Khởi tạo các tổng sản lượng
    let totalCoal = 0;
    let totalExcavation = 0;
    let totalCutting = 0;
    let rockRatio = null;

    materialBudgets.forEach(budgetDoc => {
        // 1. Thu thập Production Scope
        if (budgetDoc.productionScope) {
            const scopeId = String(budgetDoc.productionScope._id);
            if (!allScopes.has(scopeId)) {
                allScopes.set(scopeId, {
                    _id: scopeId,
                    code: budgetDoc.productionScope.code,
                    name: budgetDoc.productionScope.name
                });
            }
        }

        // Lọc phase theo tham số query (Chỉ dùng để lấy Tỉ lệ đá kẹp nếu cần)
        const phasesToCheck = phase
            ? budgetDoc.phases.filter(p => String(p.phase._id) === phase)
            : budgetDoc.phases;

        phasesToCheck.forEach(budgetPhase => {
            const phaseDoc = budgetPhase.phase;
            const phaseId = String(phaseDoc._id);
            const production = budgetPhase.production || 0;

            // Thu thập Phase (để tránh trùng lặp)
            if (!allPhases.has(phaseId)) {
                allPhases.set(phaseId, {
                    _id: phaseId,
                    code: phaseDoc.code,
                    name: phaseDoc.name,
                });
            }

            // Tính tổng các loại sản lượng riêng biệt (Luôn cộng dồn TẤT CẢ phase đã lọc)
            switch (phaseDoc.name.toLowerCase()) {
                case PhaseType.COAL.toLowerCase():
                    totalCoal += production;
                    break;
                case PhaseType.EXCAVATION.toLowerCase():
                    totalExcavation += production;
                    break;
                case PhaseType.CUTTING.toLowerCase():
                    totalCutting += production;
                    break;
            }

            if (phase && productionScope && phaseId === phase) {
                // Lấy giá trị từ adjustmentNormCode đã được populate
                const rockRatioDoc = budgetPhase.adjustmentNormCode?.rockRatio;

                if (rockRatioDoc && rockRatioDoc.name !== undefined) {
                    // Giả định rockRatio.name chứa giá trị tỉ lệ (ví dụ: '10.5' hoặc 10.5)
                    rockRatio = rockRatioDoc.name;
                } else {
                    rockRatio = null;
                }
            }
        });
    });

    const info = {
        productionScopes: Array.from(allScopes.values()),
        phases: Array.from(allPhases.values()),
        totalCoal,
        totalCutting,
        totalExcavation,
        rockRatio
    };

    const data = processBudgetAndUsedData(materialBudgets, materialCostUseds, phase);
    return { data, info }
}
exports.getMonth = async (req, res) => {
    try {
        const { productionScope, month, phase } = req.query

        const matchQuery = { month: month }; // Bắt buộc lọc theo month

        if (productionScope) {
            matchQuery.productionScope = productionScope;
        }

        const { data, info } = await getMonth(res, productionScope, phase, matchQuery)

        res.status(200).json({
            status: 'success', data: { data, info }
        })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.getExcel = async (req, res) => {
    try {
        const { productionScope, month, phase, quarter, year } = req.body.data

        const matchQuery = { month: month }; // Bắt buộc lọc theo month

        if (productionScope) {
            matchQuery.productionScope = productionScope;
        }

        const isShow = productionScope && phase
        const isQuarter = quarter && year

        let result = {}
        if (quarter && year) {
            result = await getQuarterData(res, quarter, year);
        } else {
            result = await getMonth(res, productionScope, phase, matchQuery)
        }
        const { data, info } = result

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet('QTCP')

        worksheet.mergeCells(`A1:U1`)
        const tt1 = worksheet.getCell('A1')
        tt1.value = "CÔNG TY CP THAN VÀNG DANH - VINACOMIN"

        setMergeCellHeader(worksheet, 'A2:A6', 'STT')
        setMergeCellHeader(worksheet, 'B2:B6', "Mã vật tư")
        setMergeCellHeader(worksheet, 'C2:C6', "Trùng mã vật tư")
        setMergeCellHeader(worksheet, 'D2:D6', "Mã thiết bị")
        setMergeCellHeader(worksheet, 'E2:E6', "Mã giao khoán")
        setMergeCellHeader(worksheet, 'F2:F6', "Tên vật tư, tài sản")
        setMergeCellHeader(worksheet, 'G2:G6', "ĐVT")
        setMergeCellHeader(worksheet, 'H2:H6', "Đơn giá khoán")
        setMergeCellHeader(worksheet, `I2:U2`, isQuarter ? `Quyết toán giao khoán quý ${quarter} năm ${year}` : `Quyết toán giao khoán tháng ${new Date(month).getMonth()}`)

        if (isQuarter) {
            setMergeCellHeader(worksheet, 'I3:U4', "Bảng tổng hợp")
        } else {
            setMergeCellHeader(worksheet, 'I3:U3', (info.phases || []).map(i => i.name).join(', '))
            setMergeCellHeader(worksheet, 'I4:U4', (info.productionScopes || []).map(i => i.code).join(', '))
        }

        setMergeCellHeader(worksheet, 'I5:I6', "ĐM gốc")
        setMergeCellHeader(worksheet, 'J5:J6', "HS điều chỉnh ĐM")
        setMergeCellHeader(worksheet, 'K5:K6', "Định mức")
        setMergeCellHeader(worksheet, 'L5:N5', "Số lượng kế hoạch")

        setCellHeader(worksheet, 'L6', 'Tổng', true, "center")
        setCellHeader(worksheet, 'M6', 'Trong khoán', true, "center")
        setCellHeader(worksheet, 'N6', 'Ngoài khoán', true, "center")

        setMergeCellHeader(worksheet, 'O5:O6', "Giá trị kế hoạch")

        setMergeCellHeader(worksheet, 'P5:R5', "Số lượng thực hiện")

        setCellHeader(worksheet, 'P6', 'Tổng', true, "center")
        setCellHeader(worksheet, 'Q6', 'Trong khoán', true, "center")
        setCellHeader(worksheet, 'R6', 'Ngoài khoán', true, "center")

        setMergeCellHeader(worksheet, 'S5:S6', "Giá trị thực hiện")

        setMergeCellHeader(worksheet, 'T5:U5', "So sánh lãi (+); lỗ (-)")

        setCellHeader(worksheet, 'T6', 'Số lượng', true, "center")
        setCellHeader(worksheet, 'U6', 'Giá trị', true, "center")

        setCellHeader(worksheet, 'A7', '1', true, "center")
        setCellHeader(worksheet, 'F7', 'Than nguyên khai', true, "left")
        setCellHeader(worksheet, 'L7', info.totalCoal ? Number(info.totalCoal.toFixed(1)).toLocaleString() : '', true, "center")
        setCellHeader(worksheet, 'A8', '2', true, "center")
        setCellHeader(worksheet, 'F8', 'Mét lò đào', true, "left")
        setCellHeader(worksheet, 'L8', info.Excavation ? Number(info.Excavation.toFixed(1)).toLocaleString() : '', true, "center")
        setCellHeader(worksheet, 'A9', '3', true, "center")
        setCellHeader(worksheet, 'F9', 'Mét lò xén', true, "left")
        setCellHeader(worksheet, 'L9', info.totalCutting ? Number(info.totalCutting.toFixed(1)).toLocaleString() : '', true, "center")
        setCellHeader(worksheet, 'A10', '4', true, "center")
        setCellHeader(worksheet, 'F10', 'Tỉ lệ đá lẫn trong gương (Ckep)', true, "left")
        setCellHeader(worksheet, 'L10', info.rockRatio, true, "left")
        setCellHeader(worksheet, 'A11', '5', true, "center")
        setCellHeader(worksheet, 'F11', 'Vật tư có định mức', true, "left")

        let currentRow = 12; // Dữ liệu chi tiết bắt đầu từ dòng 12
        let stt = 6; // Bắt đầu STT từ 5 (vì 1-4 là tổng hợp)

        data.forEach((group, index) => {

            // Cột A: STT
            setCellHeader(worksheet, `A${currentRow}`, stt++, true, "center")

            // Cột D: Mã thiết bị
            setCellHeader(worksheet, `D${currentRow}`, group.assignmentCode?.deviceCode?.code || '', true, "center")

            // Cột E: Mã giao khoán
            setCellHeader(worksheet, `E${currentRow}`, group.assignmentCode?.code || '', true, "center")

            // Cột F: Tên Vật tư / Tên Nhóm (Lấy tên Mã giao khoán)
            setCellHeader(worksheet, `F${currentRow}`, group.assignmentCode?.name || 'Vật tư không có định mức', true, "left")


            // Cột G: ĐVT (Lấy ĐVT của Mã giao khoán)
            setCellHeader(worksheet, `G${currentRow}`, group.assignmentCode?.uom?.name || '', false, "center")

            // Cột H: Đơn giá khoán
            setCellHeader(worksheet, `H${currentRow}`, group.price ? Number(group.price.toFixed(0)).toLocaleString() : '', false, "center")

            if (group.assignmentCode) {
                // Dữ liệu Định mức và Kế hoạch (Tất cả đều trên dòng tổng hợp này)
                setCellHeader(worksheet, `I${currentRow}`, group.baseName ? Number(group.baseName.toFixed(3)).toLocaleString() : '', false, "center")
                setCellHeader(worksheet, `J${currentRow}`, group.adjustmentNorm ? Number(group.adjustmentNorm.toFixed(3)).toLocaleString() : '', false, "center")
                setCellHeader(worksheet, `K${currentRow}`, group.norm ? Number(group.norm.toFixed(3)).toLocaleString() : '', false, "center")

                // Kế hoạch
                setCellHeader(worksheet, `L${currentRow}`, group.plan_Quantity ? Number(group.plan_Quantity.toFixed(1)).toLocaleString() : '', false, "center")

                setCellHeader(worksheet, `O${currentRow}`, group.plan_Cost ? Number(group.plan_Cost.toFixed(0)).toLocaleString() : '', false, "center")

                // Thực hiện (Tổng)
                setCellHeader(worksheet, `P${currentRow}`, group.used_Quantity ? Number(group.used_Quantity.toFixed(1)).toLocaleString() : '', false, "center")

                // S: Giá trị Thực hiện (Tổng)
                setCellHeader(worksheet, `S${currentRow}`, group.used_Cost ? Number(group.used_Cost.toFixed(0)).toLocaleString() : '', false, "center")


                // So sánh Lãi/Lỗ
                setCellHeader(worksheet, `T${currentRow}`, group.varianceQuantity ? Number(group.varianceQuantity.toFixed(1)).toLocaleString() : '', false, "center")
                setCellHeader(worksheet, `U${currentRow}`, group.varianceCost ? Number(group.varianceCost.toFixed(0)).toLocaleString() : '', false, "center")
            }


            // --- B. Các dòng Chi tiết Vật tư thực hiện (materialUseds) ---
            currentRow++;

            group.materialUseds.forEach((matUsed) => {

                // Cột B: Mã vật tư
                setCellHeader(worksheet, `B${currentRow}`, matUsed.material?.code, false, "left")
                setCellHeader(worksheet, `C${currentRow}`, (group?.materialUseds || []).filter((mat) => mat.material?._id === matUsed?.material?._id)?.length || 1, false, "center")

                // Cột F: Tên vật tư (tên chi tiết)
                setCellHeader(worksheet, `F${currentRow}`, matUsed.material?.name, false, "left")


                // Cột G: ĐVT (ĐVT của vật tư chi tiết)
                setCellHeader(worksheet, `G${currentRow}`, matUsed.material?.uom?.name, false, "center")


                // Cột H: Đơn giá (Chỉ điền nếu không có Mã giao khoán)
                if (!group.assignmentCode) {
                    setCellHeader(worksheet, `H${currentRow}`, matUsed.price ? Number(matUsed.price.toFixed(0)).toLocaleString() : '', false, "center")
                }


                // Q: Trong khoán (Giả định: Vật tư con là trong khoán)
                setCellHeader(worksheet, `P${currentRow}`, matUsed.quantity ? Number(matUsed.quantity.toFixed(1)).toLocaleString() : '', false, "center")

                // S: Giá trị thực hiện
                // Trong code FE: if assignmentCode then cost is empty, else cost is used_Cost
                if (!group.assignmentCode) {
                    setCellHeader(worksheet, `S${currentRow}`, matUsed.cost ? Number(matUsed.cost.toFixed(0)).toLocaleString() : '', false, "center")
                }

                currentRow++;
            });
        });

        worksheet.columns = [
            { width: 6 },  // A: STT
            { width: 20 }, // B: Mã vật tư
            { width: 10, hidden: isQuarter }, // C: Trùng mã vật tư
            { width: 10 }, // D: Mã thiết bị
            { width: 10 }, // E: Mã giao khoán
            { width: 30 }, // F: Tên vật tư, tài sản
            { width: 10 }, // G: ĐVT
            { width: 15 }, // H: Đơn giá khoán
            { width: 10, hidden: !isShow }, // I: ĐM gốc
            { width: 10, hidden: !isShow }, // J: HS điều chỉnh ĐM
            { width: 10, hidden: !isShow }, // K: Định mức
            { width: 15 }, // L: SL Kế hoạch (Tổng)
            { width: 10 }, // M: SL Kế hoạch (Trong khoán)
            { width: 10 }, // N: SL Kế hoạch (Ngoài khoán)
            { width: 15 }, // O: Giá trị kế hoạch
            { width: 15 }, // P: SL Thực hiện (Tổng)
            { width: 10 }, // Q: SL Thực hiện (Trong khoán)
            { width: 10 }, // R: SL Thực hiện (Ngoài khoán)
            { width: 15 }, // S: Giá trị thực hiện
            { width: 15 }, // T: So sánh SL
            { width: 15 }  // U: So sánh Giá trị
        ];
        addTableBorders(worksheet, 2, currentRow, 1, 21)

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                if (!cell.font) cell.font = {};
                cell.font = {
                    ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                    name: 'Times New Roman', // đổi font chữ
                    size: 12          // kích thước chữ
                };
            });
        });


        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

function getMonthsInQuarter(year, quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const months = [];

    for (let m = startMonth; m <= endMonth; m++) {
        months.push(`${year}-${String(m).padStart(2, '0')}`);
    }
    return months;
}

async function getQuarterData(res, quarter, year) {
    const months = getMonthsInQuarter(year, quarter);

    // Khởi tạo các tổng cho quý
    let mergedGroupsMap = new Map();
    let totalCoal = 0;
    let totalCutting = 0;
    let totalExcavation = 0;

    for (const month of months) {
        const matchQuery = { month: month };

        // --- 1. Truy vấn Dữ liệu tháng (Budget và Used) ---
        // Sử dụng logic truy vấn y hệt như getMonth nhưng không cần populate sâu (vì không cần rockRatio/phase details)

        const materialCostUseds = await MaterialCostUsed.find(matchQuery)
            // Cần populate 'materials.material.assignmentCode' để có Mã/Đơn giá hợp nhất
            .populate({
                path: 'materials.material',
                populate: [
                    { path: 'uom', select: 'name' },
                    {
                        path: 'assignmentCode', select: 'code name uom deviceCode',
                        populate: 'deviceCode'
                    }
                ]
            }).lean();

        const materialBudgets = await MaterialBudget.find(matchQuery)
            // Cần populate 'phases.budgetCostDetails.assignmentCode' và 'phases.phase'
            .populate('phases.phase', 'code name')
            .populate({
                path: 'phases.budgetCostDetails.assignmentCode',
                select: 'code name uom deviceCode',
                populate: 'deviceCode'
            })
            // Không cần populate adjustmentNormCode/rockRatio vì không tính tỉ lệ đá kẹp
            .lean();

        if (materialBudgets.length === 0 && materialCostUseds.length === 0) {
            // Nếu không có dữ liệu cho tháng này, bỏ qua
            continue;
        }

        // --- 2. Tổng hợp Sản lượng ---
        materialBudgets.forEach(budgetDoc => {
            budgetDoc.phases.forEach(budgetPhase => {
                const phaseDoc = budgetPhase.phase;
                const production = budgetPhase.production || 0;

                switch (phaseDoc.name.toLowerCase()) {
                    case PhaseType.COAL.toLowerCase():
                        totalCoal += production;
                        break;
                    case PhaseType.EXCAVATION.toLowerCase():
                        totalExcavation += production;
                        break;
                    case PhaseType.CUTTING.toLowerCase():
                        totalCutting += production;
                        break;
                }
            });
        });

        // --- 3. Tổng hợp Dữ liệu Vật tư (Budget và Used) ---
        // Sử dụng logic hợp nhất tương tự processBudgetAndUsedData, nhưng hợp nhất vào mergedGroupsMap chung

        // Hợp nhất Budget (Kế hoạch)
        materialBudgets.forEach(budgetDoc => {
            budgetDoc.phases.forEach(budgetPhase => {
                budgetPhase.budgetCostDetails.forEach(detail => {
                    const code = detail.assignmentCode.code;
                    const price = detail.price || 0;
                    const compoundKey = `${code}_${price}`;

                    if (mergedGroupsMap.has(compoundKey)) {
                        const existing = mergedGroupsMap.get(compoundKey);
                        existing.plan_Quantity += detail.quantity || 0;
                        existing.plan_Cost += detail.cost || 0;
                    } else {
                        mergedGroupsMap.set(compoundKey, {
                            assignmentCode: detail.assignmentCode,
                            // Norms không cần tổng hợp cho quý
                            baseNorm: '', adjustmentNorm: '', norm: '',
                            price: price,
                            plan_Quantity: detail.quantity || 0,
                            plan_Cost: detail.cost || 0,
                            used_Quantity: 0, used_Cost: 0,
                            materialUseds: [] // Chi tiết vật tư sẽ không được tổng hợp ở đây
                        });
                    }
                });
            });
        });

        // Hợp nhất Used (Thực hiện)
        materialCostUseds.forEach(usedDoc => {
            usedDoc.materials.forEach(mat => {
                const assignmentCodeDoc = mat.material?.assignmentCode;
                const code = assignmentCodeDoc?.code || '';
                const matPrice = mat.price || 0;
                const quantity = mat.quantity || 0;
                const cost = mat.cost || 0;

                const compoundKey = assignmentCodeDoc ? `${code}_${matPrice}` : 'NO_ASSIGNMENTCODE';

                let group = mergedGroupsMap.get(compoundKey);

                if (!group) {
                    group = {
                        assignmentCode: assignmentCodeDoc,
                        baseNorm: '', adjustmentNorm: '', norm: '',
                        price: assignmentCodeDoc ? matPrice : '',
                        plan_Quantity: 0, plan_Cost: 0,
                        used_Quantity: 0, used_Cost: 0,
                        materialUseds: []
                    };
                    mergedGroupsMap.set(compoundKey, group);
                }

                group.used_Quantity += quantity;
                group.used_Cost += cost;

                // Lưu vật tư chi tiết vào nhóm (cần thiết cho phần Excel sau này)
                group.materialUseds.push({
                    material: mat.material, quantity: quantity, price: matPrice, cost: cost
                });
            });
        });
    } // Kết thúc vòng lặp tháng

    // --- 4. Hoàn thiện Dữ liệu và Tính toán Variance ---
    const finalGroups = Array.from(mergedGroupsMap.values()).map(group => {
        const varianceQuantity = group.plan_Quantity - group.used_Quantity;
        const varianceCost = group.plan_Cost - group.used_Cost;

        // Cần tổng hợp lại mảng materialUseds nếu có vật tư trùng lặp từ các tháng khác nhau
        // Đối với quý, ta sẽ giữ nguyên chi tiết materialUseds để đơn giản hóa.

        return {
            ...group,
            varianceQuantity: varianceQuantity,
            varianceCost: varianceCost,
        };
    });

    // Sắp xếp (sử dụng logic sắp xếp từ processBudgetAndUsedData)
    finalGroups.sort((a, b) => {
        const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
        const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
        if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') return 1;
        if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') return -1;
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;
        return 0;
    });

    const info = {
        totalCoal,
        totalCutting,
        totalExcavation,
        // Bỏ rockRatio, phases, productionScopes
    };

    return { data: finalGroups, info };
}

// ----------------------------------------------------------------------
// CONTROLLER MỚI: exports.getQuarter
// ----------------------------------------------------------------------
exports.getQuarter = async (req, res) => {
    try {
        const { quarter, year } = req.query;

        if (!quarter || !year) {
            return res.status(400).json({ status: 'error', message: 'Tham số quý và năm là bắt buộc.' });
        }

        const { data, info } = await getQuarterData(res, quarter, year);

        res.status(200).json({
            status: 'success', data: { data, info }
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

function setMergeCellHeader(ws, range, value) {
    ws.mergeCells(range);
    const cell = ws.getCell(range.split(':')[0]);
    cell.value = value;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { bold: true }
}
function setCellHeader(ws, range, value, bold, center) {
    const cell = ws.getCell(range);
    cell.value = value;
    cell.alignment = { horizontal: center, vertical: 'middle', wrapText: true };
    cell.font = { bold: bold }
}
const addTableBorders = (
    ws,
    startRow,
    endRow,
    startCol,
    endCol
) => {
    const lightBorder = { style: 'thin', color: "black" };

    for (let r = startRow; r <= endRow; r++) {
        const row = ws.getRow(r);
        for (let c = startCol; c <= endCol; c++) {
            const cell = row.getCell(c);

            cell.border = {
                top: lightBorder,
                bottom: lightBorder,
                left: lightBorder,
                right: lightBorder,
            };
        }
    }
};