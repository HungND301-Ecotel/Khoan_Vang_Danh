const InitialPlannedCost = require('../model/InitialPlannedCost')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')
const { recalculateAssignmentCodePrice, calculatedPhases } = require('../utils/recalculateAssignmentCodePrice')


exports.create = async (req, res) => {
    try {
        const { productionScope, month, phases } = req.body;


        const result = await calculatedPhases(phases, month, "initial")

        const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)


        // Tạo đối tượng InitialPlannedCost mới
        const newInitialPlannedCost = new InitialPlannedCost({
            productionScope,
            month,
            phases: result, // Dùng mảng đã tính toán
            totalInitialPlannedCost
        });

        await newInitialPlannedCost.save();

        res.status(201).json({ status: 'success', message: 'Tạo thành công' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
exports.update = async (req, res) => {
    try {
        const result = await calculatedPhases(req.body.phases, req.body.month, "initial")

        const totalInitialPlannedCost = result.reduce((sum, item) => sum + item.totalInitialPlannedCost, 0)

        const updateData = await InitialPlannedCost.findByIdAndUpdate(
            req.params.id,
            { ...req.body, phases: result, totalInitialPlannedCost },
            { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
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
        res.status(200).json({ status: 'success', message: 'Xóa thành công' })
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
                model: 'PhaseGroup', // <--- THÊM KHAI BÁO MODEL TƯỜNG MINH
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