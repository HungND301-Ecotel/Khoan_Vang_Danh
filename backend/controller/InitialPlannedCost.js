const InitialPlannedCost = require('../model/InitialPlannedCost')
const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const MaterialAssignment = require('../model/MaterialAssignment')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')
const { monthToNumber } = require('../utils/helpers')

const syncRelatedData = async (productionScope, month, phases, oldProductionScope, oldMonth) => {
    try {
        const searchScope = oldProductionScope || productionScope;
        const searchMonth = oldMonth || month;

        // 1. Lấy dữ liệu hiện có từ MCU và MB dựa trên thông tin cũ (nếu có) hoặc thông tin hiện tại
        const [existingMCU, existingMB] = await Promise.all([
            MaterialCostUsed.findOne({ productionScope: searchScope, month: searchMonth }),
            MaterialBudget.findOne({ productionScope: searchScope, month: searchMonth })
        ])

        // 2. Tạo mảng phases đồng bộ (ưu tiên lấy production từ MCU hiện có, nếu không có để mặc định là 0)
        const synchronizedPhases = phases.map(p => {
            const pObj = p.toObject ? p.toObject() : p;
            const phaseId = (pObj.phase?._id || pObj.phase).toString();

            const mcuPhase = existingMCU?.phases?.find(ph => ph.phase.toString() === phaseId);

            return {
                ...pObj,
                production: mcuPhase?.production ?? 0
            };
        });

        // 3. Đồng bộ sang MaterialCostUsed trước
        if (existingMCU) {
            existingMCU.productionScope = productionScope; // Cập nhật sang scope mới (nếu đổi)
            existingMCU.month = month;                     // Cập nhật sang tháng mới (nếu đổi)
            existingMCU.phases = synchronizedPhases;

            // Tái tính toán giá và chi phí cho từng vật tư trong MCU dựa trên tháng mới
            if (existingMCU.materials && existingMCU.materials.length > 0) {
                const refreshedMaterials = await Promise.all(
                    existingMCU.materials.map(async (doc) => {
                        const material = await MaterialAssignment.findById(doc?.material);
                        let matched = null;

                        if (material && Array.isArray(material.priceHistory)) {
                            matched = material.priceHistory.find(priceItem => {
                                const start = monthToNumber(priceItem.startMonth)
                                const end = monthToNumber(priceItem.endMonth)
                                const checkMonth = monthToNumber(month)
                                return start <= checkMonth && checkMonth <= end
                            });
                        }
                        const priceResult = await recalculateAssignmentCodePrice(material?.assignmentCode, null, null, month);

                        const price = material?.assignmentCode ? priceResult : (matched ? matched.price : 0);
                        return {
                            material: doc.material,
                            quantity: Number(doc.quantity),
                            price: price || 0,
                            cost: (price || 0) * Number(doc.quantity || 0)
                        };
                    })
                );
                existingMCU.materials = refreshedMaterials;
                existingMCU.totalUsedCost = refreshedMaterials.reduce((sum, item) => sum + item.cost, 0);
            }

            await existingMCU.save()
        } else {
            const newMCU = new MaterialCostUsed({
                productionScope,
                month,
                phases: synchronizedPhases,
                materials: [],
                totalUsedCost: 0
            })
            await newMCU.save()
        }

        // 4. Tính toán phases cho MaterialBudget dựa trên synchronizedPhases
        const budgetPhases = await calculatedPhases(synchronizedPhases, month, "budget")
        const totalBudgetCost = budgetPhases.reduce((sum, item) => sum + (item?.totalBudgetCost || 0), 0)

        // 5. Đồng bộ sang MaterialBudget sau (sử dụng findOneAndUpdate với filter cũ để cập nhật sang tháng mới)
        await MaterialBudget.findOneAndUpdate(
            { productionScope: searchScope, month: searchMonth },
            {
                productionScope: productionScope,
                month: month,
                phases: budgetPhases,
                totalBudgetCost
            },
            { upsert: true, new: true },
        );
    } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu liên quan:", error.stack)
        throw error
    }
}

exports.create = async (req, res) => {
    try {
        const { productionScope, groups } = req.body; // groups: [{ month, phases }]

        if (groups && Array.isArray(groups)) {
            const errors = [];
            for (const group of groups) {
                try {
                    const { month, phases } = group;
                    const result = await calculatedPhases(phases, month, "initial")
                    const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

                    await InitialPlannedCost.findOneAndUpdate(
                        { productionScope, month },
                        { phases: result, totalInitialPlannedCost },
                        { upsert: true, new: true }
                    )
                    await syncRelatedData(productionScope, month, phases)
                } catch (err) {
                    console.error(`Lỗi khi xử lý nhóm tháng ${group.month}:`, err.message);
                    errors.push({ month: group.month, error: err.message });
                }
            }

            if (errors.length > 0) {
                return res.status(201).json({ 
                    status: 'partial_success', 
                    message: 'Hoàn thành với một số lỗi', 
                    errors 
                });
            }
        } else {
            // Hỗ trợ format cũ
            const { month, phases } = req.body;
            const result = await calculatedPhases(phases, month, "initial")
            const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

            const newInitialPlannedCost = new InitialPlannedCost({
                productionScope,
                month,
                phases: result,
                totalInitialPlannedCost
            });
            await newInitialPlannedCost.save();
            await syncRelatedData(productionScope, month, phases)
        }

        res.status(201).json({ status: 'success', message: 'Tạo và đồng bộ thành công' });
    } catch (err) {
        console.error("Lỗi nghiêm trọng trong create InitialPlannedCost:", err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const oldData = await InitialPlannedCost.findById(req.params.id)
        if (!oldData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại - Không tìm thấy dữ liệu cũ' })
        }

        const result = await calculatedPhases(req.body.phases, req.body.month, "initial")

        const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

        const updateData = await InitialPlannedCost.findByIdAndUpdate(
            req.params.id,
            { ...req.body, phases: result, totalInitialPlannedCost },
            { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }

        // Đồng bộ dữ liệu liên quan (truyền cả thông tin cũ để tìm đúng bản ghi MCU/MB)
        await syncRelatedData(updateData.productionScope, updateData.month, updateData.phases, oldData.productionScope, oldData.month)

        res.status(200).json({ status: 'success', message: 'Sửa và đồng bộ thành công' })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        const deleteData = await InitialPlannedCost.findByIdAndDelete(req.params.id)
        if (!deleteData) {
            return res.status(404).json({ status: 'error', message: 'Xóa thất bại' })
        }

        // Xóa dữ liệu liên quan (lần lượt MCU rồi đến MB)
        await MaterialCostUsed.findOneAndDelete({
            productionScope: deleteData.productionScope,
            month: deleteData.month
        })
        await MaterialBudget.findOneAndDelete({
            productionScope: deleteData.productionScope,
            month: deleteData.month
        })

        res.status(200).json({ status: 'success', message: 'Xóa và đồng bộ thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}


exports.get = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let matchQuery = {};

        // 1. Xử lý điều kiện tìm kiếm theo req.query.q
        if (req.query.q) {
            // Lọc các ProductionScope khớp với mã tìm kiếm
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') }).select('_id');
            const productionScopeIds = productionScopes.map(i => i._id);
            // Chỉ match những InitialPlannedCost có productionScope nằm trong kết quả tìm kiếm
            matchQuery.productionScope = { $in: productionScopeIds };
        }

        const pipeline = [
            // 1. Match: Lọc InitialPlannedCost theo tìm kiếm (nếu có)
            { $match: matchQuery },

            // 2. Group: Nhóm các chi phí theo productionScope để tạo ra các document duy nhất
            {
                $group: {
                    _id: "$productionScope", // Nhóm theo ProductionScope ID
                    minMonth: { $min: "$month" },
                    maxMonth: { $max: "$month" },
                    // Gom tất cả các document chi phí hàng tháng vào mảng 'group'
                    group: {
                        $push: {
                            _id: "$_id",
                            month: "$month",
                            totalInitialPlannedCost: "$totalInitialPlannedCost",
                            // Tạo trường 'key' cho phases
                            phases: {
                                $map: {
                                    input: "$phases",
                                    as: "phaseItem",
                                    in: {
                                        $mergeObjects: [
                                            "$$phaseItem",
                                            {
                                                key: {
                                                    $concat: [
                                                        { $toString: "$_id" },
                                                        "_",
                                                        { $toString: "$$phaseItem.phase" }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                }
            },

            // 3. Populate (Lookup): Lấy thông tin chi tiết của productionScope
            {
                $lookup: {
                    from: 'productionscopes',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productionScope',
                }
            },
            { $unwind: '$productionScope' },

            // 4. Facet: Đếm tổng và Phân trang trên các document đã nhóm
            {
                $facet: {
                    totalDocs: [{ $count: "count" }], // Đếm tổng số lượng ProductionScope (sau khi nhóm)
                    paginatedData: [
                        { $skip: skip },
                        { $limit: limit },
                    ]
                }
            }
        ];

        const aggregationResult = await InitialPlannedCost.aggregate(pipeline).exec();

        const data = aggregationResult[0].paginatedData;
        const totalItems = aggregationResult[0].totalDocs[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / limit);

        // 5. Xử lý sau aggregation (Populate các trường lồng sâu trong mảng 'group')
        // Sử dụng Mongoose.populate() và khai báo Model tường minh
        const populatedData = await InitialPlannedCost.populate(data, [
            {
                path: 'group.phases.initialPlannedCostDetails.assignmentCode',
                select: 'code name uom',
                model: 'AssignmentCode',
                populate: {
                    path: 'uom',
                    select: 'code name',
                },
            },
            {
                path: 'group.phases.phase',
                select: 'code name', // Chọn các trường bạn muốn lấy
                model: 'Phase', // <--- THÊM KHAI BÁO MODEL TƯỜNG MINH
            },
            {
                path: 'productionScope.phases.phase',
                select: 'code name', // Chọn các trường bạn muốn lấy
                model: 'Phase', // <--- THÊM KHAI BÁO MODEL TƯỜNG MINH
            },
            {
                path: 'group.phases.assignmentNormCode',
                select: 'norms code',
                model: 'AssignmentNorm',
                populate: {
                    path: 'norms.assignmentCode',
                    model: 'AssignmentCode',
                    populate: { path: 'uom' }
                }
            },
            {
                path: 'group.phases.adjustmentNormCode',
                select: 'norms code',
                model: 'AdjustmentNorm',
                populate: {
                    path: 'norms.assignmentCode',
                    model: 'AssignmentCode',
                    populate: { path: 'uom' }
                }
            },
            // Bạn có thể muốn populate `productionScope.phases.phase` nếu cần hiển thị tên phase chi tiết
        ]);

        // 6. Định dạng lại kết quả cho Response
        const results = populatedData.map(item => {
            const formatMonth = (m) => {
                if (!m) return '';
                const [y, mm] = m.split('-');
                return `${mm}/${y}`;
            };

            return {
                _id: item._id,
                productionScope: item.productionScope,
                month: `${formatMonth(item.minMonth)} -> ${formatMonth(item.maxMonth)}`,
                group: item.group,
            };
        });

        const pagination = {
            data: results,
            page: page,
            totalDocs: totalItems,
            totalPages: totalPages
        };

        res.status(200).json({ status: 'success', data: pagination });

    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
exports.getOne = async (req, res) => {
    try {

        // 2. Thực hiện query với Populate
        // Lấy tất cả dữ liệu liên quan mà không cần nhóm, nhưng giới hạn theo phân trang
        const scopeId = req.params.productionScope
        const modelQuery = InitialPlannedCost.find({ productionScope: scopeId })
            .populate({
                path: 'productionScope',
                select: 'code name phases',
                populate: [
                    { path: 'phases.phase', populate: 'code name' }
                ]
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'phases.initialPlannedCostDetails.assignmentCode', // Đường dẫn lồng
                select: 'code name uom', // Chọn các trường bạn muốn hiển thị ở Frontend
                populate: "uom"
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
            })
        // Thêm các populate còn thiếu


        const allDocs = await modelQuery.lean().exec(); // Dùng .lean() để tăng hiệu suất
        if (allDocs.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy dữ liệu InitialPlannedCost cho phạm vi sản xuất này.' });
        }
        // 3. Xử lý dữ liệu bằng JavaScript để nhóm
        let data = {
            _id: scopeId,
            productionScope: allDocs[0]?.productionScope,
            group: []
        }

        for (const doc of allDocs) {

            // Thêm dữ liệu vào mảng 'group'
            data.group.push({
                _id: doc._id,
                month: doc.month,
                totalInitialPlannedCost: doc.totalInitialPlannedCost,
                phases: doc.phases.map((phaseItem) => ({
                    ...phaseItem,
                    key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`
                }))
            });
        }

        res.status(200).json({ status: 'success', data })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}