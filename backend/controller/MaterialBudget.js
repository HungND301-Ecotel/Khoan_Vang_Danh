const MaterialBudget = require('../model/MaterialBudget')
const MaterialAssignment = require('../model/MaterialAssignment')
const { updatePriceAssignmentCode } = require('../utils/recalculateAssignmentCodePrice')
const ProductionScope = require('../model/ProductionScope')

const monthToNumber = (month) => month ? Number(month.replace('-', '')) : ''

exports.create = async (req, res) => {
    try {
        const { code, phaseGroup, phase, assignmentNormCode, adjustmentNormCode, production } = req.body
        const newMaterialBudget = new MaterialBudget({ code, phaseGroup, phase, assignmentNormCode, adjustmentNormCode, production })
        await newMaterialBudget.save()
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await MaterialBudget.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await MaterialBudget.findByIdAndDelete(req.params.id)
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

        let scopeMatchQuery = {}; // Query để lọc ProductionScope ID

        // 1. Xử lý điều kiện tìm kiếm theo req.query.q
        if (req.query.q) {
            // Lọc ProductionScope theo mã, sau đó dùng các ID này để match trong MaterialBudget
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') }).select('_id');
            const productionScopeIds = productionScopes.map(i => i._id);
            scopeMatchQuery.productionScope = { $in: productionScopeIds };
        }

        // --- BƯỚC 1: Lấy các ProductionScope ID DUY NHẤT có dữ liệu (áp dụng phân trang) ---

        // Lấy tất cả ID ProductionScope duy nhất từ MaterialBudget khớp với điều kiện tìm kiếm
        const uniqueScopeIds = await MaterialBudget.distinct('productionScope', scopeMatchQuery);

        // Tổng số ProductionScope đã nhóm (Tổng số tài liệu để phân trang)
        const totalItems = uniqueScopeIds.length;

        // Lấy các ID cho trang hiện tại
        const paginatedScopeIds = uniqueScopeIds.slice(skip, skip + limit);

        // Populate thông tin ProductionScope cho các ID đã phân trang
        const targetScopes = await ProductionScope.find({ _id: { $in: paginatedScopeIds } })
            .select('code name phases')
            .populate([
                { path: 'phases.phase', select: 'code name' }
            ])
            .lean()
            .exec();

        // 2. Query MaterialBudget: Chỉ lấy các document có productionScope nằm trong các ID đã phân trang
        const materialBudgetQuery = { productionScope: { $in: paginatedScopeIds } };

        // --- BƯỚC 2: Thực hiện query toàn bộ MaterialBudget cho các Scope đã chọn (KHÔNG phân trang) ---

        const allDocs = await MaterialBudget.find(materialBudgetQuery)
            .populate({
                path: 'productionScope',
                select: 'code name phases',
                // Populate Phases.phase lồng trong productionScope đã được thực hiện ở targetScopes
            })
            .populate('phases.phase', 'code name') // Populate Phase ở cấp độ phases trực tiếp
            .populate({
                path: 'phases.budgetCostDetails.assignmentCode',
                select: 'code name uom',
                populate: "uom"
            })
            .populate({
                path: 'phases.assignmentNormCode',
                select: 'norms code',
                populate: [{ path: 'norms.assignmentCode', populate: 'uom' }]
            })
            .populate({
                path: 'phases.adjustmentNormCode',
                select: 'norms code',
                populate: [{ path: 'norms.assignmentCode', populate: 'uom' }]
            })
            // Thêm các populate còn thiếu (nếu có)
            .lean()
            .exec();

        // --- BƯỚC 3: Xử lý dữ liệu bằng JavaScript để nhóm ---

        const groupedMap = new Map();

        // Khởi tạo Map với các ProductionScope đã được phân trang (đã populate)
        for (const scope of targetScopes) {
            groupedMap.set(scope._id.toString(), {
                _id: scope._id.toString(),
                productionScope: scope,
                minMonth: null,
                maxMonth: null,
                group: []
            });
        }

        for (const doc of allDocs) {
            const scopeId = doc.productionScope?._id?.toString();

            if (groupedMap.has(scopeId)) {
                const groupedDoc = groupedMap.get(scopeId);

                // --- Logic tìm Min/Max Month ---
                const currentMonthDate = new Date(doc.month + '-01');
                if (!groupedDoc.minMonth || currentMonthDate < new Date(groupedDoc.minMonth + '-01')) {
                    groupedDoc.minMonth = doc.month;
                }
                if (!groupedDoc.maxMonth || currentMonthDate > new Date(groupedDoc.maxMonth + '-01')) {
                    groupedDoc.maxMonth = doc.month;
                }

                // Thêm dữ liệu vào mảng 'group'
                groupedDoc.group.push({
                    _id: doc._id,
                    month: doc.month,
                    totalBudgetCost: doc.totalBudgetCost,
                    phases: doc.phases?.map((phaseItem) => ({
                        ...phaseItem,
                        // Thêm key
                        key: `${doc._id.toString()}_${phaseItem.phase._id.toString()}`
                    }))
                });
            }
        }

        // Chuyển Map thành mảng và định dạng tháng
        const results = Array.from(groupedMap.values()).map(item => {
            const formatMonth = (m) => {
                if (!m) return '';
                const [y, mm] = m.split('-');
                return `${mm}/${y}`;
            };

            return {
                ...item,
                month: `${formatMonth(item.minMonth)} -> ${formatMonth(item.maxMonth)}`
            };
        });

        // 4. Trả về kết quả phân trang
        const totalPages = Math.ceil(totalItems / limit);
        const pagination = {
            data: results,
            page: page,
            totalDocs: totalItems,
            totalPages: totalPages
        };

        res.status(200).json({ status: 'success', data: pagination });
    } catch (err) {
        console.error(err.stack); // Dùng console.error để theo dõi lỗi
        res.status(500).json({ status: 'error', message: err.message });
    }
};
exports.getOne = async (req, res) => {
    try {
        const materialbudget = await MaterialBudget.findById(req.params.id)
            .populate('phase')
            .populate({
                path: 'assignmentNormCode',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: {
                        path: 'uom'
                    }
                }
            })
            .populate({
                path: 'adjustmentNormCode',
                populate: {
                    path: 'norms.assignmentCode',
                    populate: {
                        path: 'uom'
                    }
                }
            })

        const assignmentNorms = materialbudget.assignmentNormCode?.norms || [];
        const adjustmentNorms = materialbudget.adjustmentNormCode?.norms || [];
        const today = new Date()
        const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`

        const currentMonthNum = monthToNumber(currentYearMonth)

        const result = [];

        for (const norm of adjustmentNorms) {
            const assignment = norm.assignmentCode;
            if (!assignment?._id) continue;
            await updatePriceAssignmentCode(assignment._id);



            const adjustmentNorm = assignmentNorms.find(a => (
                a.assignmentCode?._id?.toString() === assignment._id.toString()
            ));


            const materials = await MaterialAssignment.find({ assignmentCode: assignment._id }).populate('uom');

            const materialsWithPrice = materials.map(item => {
                let currentPrice = null;

                if (Array.isArray(item.priceHistory)) {
                    const matched = item.priceHistory.find(priceItem => {
                        const start = monthToNumber(priceItem.startMonth)
                        const end = monthToNumber(priceItem.endMonth)
                        return start <= currentMonthNum && currentMonthNum <= end
                    });

                    if (matched) currentPrice = matched.price;
                }

                return {
                    ...item.toObject(),
                    currentPrice
                };
            });

            const totalNorm = norm.norm && adjustmentNorm?.norm ? norm.norm * adjustmentNorm.norm : 0
            const quantity = totalNorm * materialbudget.production
            const cost = quantity * (assignment.price || 0)
            result.push({
                _id: assignment._id,
                name: assignment.name,
                code: assignment.code,
                uom: assignment.uom?.name,
                price: assignment.price,
                assignmentNorm: norm?.norm,
                adjustmentNorm: adjustmentNorm?.norm,
                totalNorm: totalNorm,
                quantity: totalNorm * materialbudget.production,
                cost: cost,
                materials: materialsWithPrice
            });
        }


        res.status(200).json({
            status: 'success', data: {
                materialbudget,
                assignments: result
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

