const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')


function processBudgetAndUsedData(materialBudget, materialCostUsed) {
    const budgetPhase = materialBudget.phases[0];
    const usedMaterials = materialCostUsed.materials;

    const mergedGroupsMap = new Map();

    // ----------------------------------------------------------------------
    // 1. TẠO KHUNG NHÓM TỪ DỮ LIỆU KẾ HOẠCH (BUDGET)
    // --- (Phần này không thay đổi, dùng Map.set) ---
    // ----------------------------------------------------------------------
    budgetPhase.budgetCostDetails.forEach(detail => {
        const code = detail.assignmentCode.code;
        const price = detail.price || 0;
        const compoundKey = `${code}_${price}`;

        mergedGroupsMap.set(compoundKey, {
            assignmentCode: detail.assignmentCode,
            baseNorm: detail.baseNorm,
            adjustmentNorm: detail.adjustmentNorm,
            norm: detail.norm,
            price: price,
            plan_Quantity: detail.quantity || 0,
            plan_Cost: detail.cost || 0,
            used_Quantity: 0,
            used_Cost: 0,
            materialUseds: []
        });
    });

    // ----------------------------------------------------------------------
    // 2. HỢP NHẤT DỮ LIỆU THỰC HIỆN (USED) VÀO KHUNG VÀ TÍNH TỔNG
    // ----------------------------------------------------------------------
    usedMaterials.forEach(mat => {
        const assignmentCodeDoc = mat.material?.assignmentCode;
        const code = assignmentCodeDoc?.code || '';
        const matPrice = mat.price || 0;
        const quantity = mat.quantity || 0;
        const cost = mat.cost || 0;

        // TẠO KHÓA HỢP NHẤT
        const compoundKey = assignmentCodeDoc ? `${code}_${matPrice}` : 'NO_ASSIGNMENTCODE';

        let group = mergedGroupsMap.get(compoundKey);

        if (!group) {
            // Trường hợp: Vật tư không có trong Kế hoạch (hoặc có giá khác) HOẶC không có Mã giao khoán

            // Khởi tạo nhóm mới và thêm vào Map
            group = {
                assignmentCode: assignmentCodeDoc,
                baseNorm: '',
                adjustmentNorm: '',
                norm: '',
                price: assignmentCodeDoc ? matPrice : '',
                plan_Quantity: 0,
                plan_Cost: 0,
                used_Quantity: 0,
                used_Cost: 0,
                materialUseds: []
            };
            mergedGroupsMap.set(compoundKey, group);
        }

        // Cập nhật tổng thực hiện (cho cả nhóm cũ và nhóm mới được tạo)
        group.used_Quantity += quantity;
        group.used_Cost += cost;

        // Thêm chi tiết vật tư vào nhóm
        group.materialUseds.push({
            material: mat.material,
            quantity: quantity,
            price: matPrice,
            cost: cost
        });
    });

    // ----------------------------------------------------------------------
    // 3. TÍNH TOÁN KẾT QUẢ CUỐI CÙNG (Không thay đổi)
    // ----------------------------------------------------------------------
    const finalGroups = Array.from(mergedGroupsMap.values()).map(group => {

        const varianceQuantity = group.plan_Quantity - group.used_Quantity;
        const varianceCost = group.plan_Cost - group.used_Cost;

        return {
            ...group,
            varianceQuantity: varianceQuantity,
            varianceCost: varianceCost,
        };
    });

    finalGroups.sort((a, b) => {
        const codeA = a.assignmentCode?.code || 'NO_ASSIGNMENTCODE';
        const codeB = b.assignmentCode?.code || 'NO_ASSIGNMENTCODE';

        // 1. Đẩy nhóm không có Mã giao khoán xuống cuối
        if (codeA === 'NO_ASSIGNMENTCODE' && codeB !== 'NO_ASSIGNMENTCODE') {
            return 1; // A lớn hơn B -> A đi sau
        }
        if (codeA !== 'NO_ASSIGNMENTCODE' && codeB === 'NO_ASSIGNMENTCODE') {
            return -1; // A nhỏ hơn B -> A đi trước
        }

        // 2. Sắp xếp Alphabetical (A-Z) cho các nhóm có Mã giao khoán
        // Hoặc nếu cả hai đều là 'NO_ASSIGNMENTCODE' (sắp xếp giữa các nhóm rỗng)
        if (codeA < codeB) {
            return -1;
        }
        if (codeA > codeB) {
            return 1;
        }

        return 0; // Giữ nguyên thứ tự nếu bằng nhau
    });

    return finalGroups;
}
exports.getMonth = async (req, res) => {
    try {
        const { productionScope, month, phase } = req.query

        const materialCostUsed = await MaterialCostUsed.findOne({
            productionScope: productionScope,
            month: month,
            "phases.phase": phase
        })
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

        if (!materialCostUsed) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy dữ liệu chi phí thực hiện.' });
        }

        const materialBudget = await MaterialBudget.findOne({
            productionScope: productionScope,
            month: month,
        })
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
                select: 'norms code',
                populate: [
                    { path: 'norms.assignmentCode', populate: 'uom' }
                ]
            }).lean();

        if (!materialBudget) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy dữ liệu chi phí kế hoạch.' });
        }
        const data = processBudgetAndUsedData(materialBudget, materialCostUsed);

        res.status(200).json({ status: 'success', data })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}