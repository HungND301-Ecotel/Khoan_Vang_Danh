const MaterialsOutsideContract = require('../model/MaterialsOutsideContract')
const AssignmentCode = require('../model/AssignmentCode')
const dayjs = require('dayjs');
const quarterOfYear = require('dayjs/plugin/quarterOfYear');
dayjs.extend(quarterOfYear);

const recalculateAssignmentCodePrice = require('./recalculateAssignmentCodePrice')

exports.create = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { code, name, assignmentCode, uom, quantity, priceHistory } = req.body
        const newMaterialAssignment = new MaterialsOutsideContract({ code, name, assignmentCode, uom, quantity, priceHistory })
           if (!code || !name) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Code và Name là bắt buộc' 
            });
        }
        await newMaterialAssignment.save()
        await recalculateAssignmentCodePrice(assignmentCode);
        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
         console.error('Error in create:', err);
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        // SỬA: MaterialsOutsideContract thay vì MaterialAssignment
        const updateData = await MaterialsOutsideContract.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!updateData) {
            return res.status(404).json({ status: 'error', message: 'Sửa thất bại' })
        }
        await recalculateAssignmentCodePrice(updateData.assignmentCode);
        res.status(200).json({ status: 'success', message: 'Sửa thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.delete = async (req, res) => {
    try {
        // SỬA: MaterialsOutsideContract thay vì MaterialAssignment
        const deleteData = await MaterialsOutsideContract.findByIdAndDelete(req.params.id)
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
        const assignments = await AssignmentCode.find()
            .populate('deviceCode')
            .populate({
                path: 'uom'
            });

        const result = [];

        for (const assignment of assignments) {
            await recalculateAssignmentCodePrice(assignment._id);

            // SỬA: MaterialsOutsideContract thay vì MaterialAssignment
            const materials = await MaterialsOutsideContract.find({ assignmentCode: assignment._id }).populate('assignmentCode').populate('uom');

            const todayStr = new Date().toISOString().split('T')[0];

            const materialsWithPrice = materials.map(item => {
                let currentPrice = null;

                if (Array.isArray(item.priceHistory)) {
                    const matched = item.priceHistory.find(priceItem => {
                        return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
                    });

                    if (matched) currentPrice = matched.price;
                }

                return {
                    ...item.toObject(),
                    currentPrice
                };
            });

            result.push({
                _id: assignment._id,
                name: assignment.name,
                code: assignment.code,
                uom: assignment.uom?.name,
                price: assignment.price,
                device: assignment.deviceCode?.code,
                materials: materialsWithPrice
            });
        }

        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        // SỬA: MaterialsOutsideContract thay vì MaterialAssignment
        const materials = await MaterialsOutsideContract.find().populate('assignmentCode').populate('uom');
        const assignmentIds = [
            ...new Set(
                materials
                    .map(m => m.assignmentCode?._id?.toString())
                    .filter(Boolean)
            ),
        ];

        await Promise.all(assignmentIds.map(id => recalculateAssignmentCodePrice(id)));
        const todayStr = new Date().toISOString().split('T')[0];

        const materialsWithPrice = materials.map(item => {
            let currentPrice = null;

            if (Array.isArray(item.priceHistory)) {
                const matched = item.priceHistory.find(priceItem => {
                    return todayStr >= priceItem.startDate && todayStr <= priceItem.endDate;
                });

                if (matched) currentPrice = matched.price;
            }

            return {
                ...item.toObject(),
                currentPrice
            };
        });

        res.status(200).json({ status: 'success', data: materialsWithPrice });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getFilter = async (req, res) => {
    try {
        const { month, quarter, year } = req.query
        let startDate, endDate;

        if (month && year) {
            startDate = dayjs(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
            endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
        } else if (quarter && year) {
            startDate = dayjs().year(year).quarter(quarter).startOf('quarter').format('YYYY-MM-DD');
            endDate = dayjs(startDate).endOf('quarter').format('YYYY-MM-DD');
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu month/year hoặc quarter/year trong query.',
            });
        }
        const assignments = await AssignmentCode.find()
            .populate('deviceCode')
            .populate({
                path: 'uom'
            });

        const result = [];

        for (const assignment of assignments) {
            // SỬA: MaterialsOutsideContract thay vì MaterialAssignment
            const materials = await MaterialsOutsideContract.find({ assignmentCode: assignment._id }).populate('assignmentCode').populate('uom');
            let totalQty = 0;
            let totalValue = 0;
            const materialsWithPrice = materials.map(item => {
                let currentPrice = null;

                if (Array.isArray(item.priceHistory)) {
                    const matched = item.priceHistory.find(priceItem => {
                        return (
                            priceItem.startDate <= endDate &&
                            priceItem.endDate >= startDate
                        );
                    });

                    if (matched) {
                        currentPrice = matched.price;
                    }
                }
                const qty = item.quantity || 0;
                totalQty += qty;
                totalValue += qty * currentPrice;
                return {
                    ...item.toObject(),
                    currentPrice
                };
            });

            const averagePrice = totalQty > 0 ? Math.round(totalValue / totalQty) : null;

            result.push({
                _id: assignment._id,
                name: assignment.name,
                code: assignment.code,
                uom: assignment.uom?.name,
                price: averagePrice,
                device: assignment.deviceCode?.code,
                materials: materialsWithPrice
            });
        }

        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};