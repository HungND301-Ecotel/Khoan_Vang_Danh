const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialAssignment = require('../model/MaterialAssignment')
const MaterialBudget = require('../model/MaterialBudget')
const ProductionScope = require('../model/ProductionScope')
const { paginateQuery } = require('../utils/pagination')

exports.create = async (req, res) => {
    try {
        const { code, productionScope, phases, materials } = req.body
        const todayStr = new Date().toISOString().split('T')[0];

        const processedMaterials = materials.map(async (doc) => {
            const material = await MaterialAssignment.findById(doc?.material)
            let currentPrice = null;

            if (material && Array.isArray(material.priceHistory)) {
                const matched = material.priceHistory.find(priceItem =>
                    todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
                );

                if (matched) currentPrice = matched.price;
            }

            return {
                ...doc,
                cost: currentPrice * doc.quantity || 0,
            };
        })
        const newMaterialCostUsed = new MaterialCostUsed({ code, productionScope, phases, processedMaterials })
        await newMaterialCostUsed.save()

        // let i = 0
        // for (const p of phases) {
        //     newMaterialBudget = new MaterialBudget({
        //         code: code + i,
        //         phase: p.phase,
        //         assignmentNormCode: p.assignmentNormCode,
        //         adjustmentNormCode: p.adjustmentNormCode,
        //         production: p.production
        //     })

        //     i++

        //     await newMaterialBudget.save()
        // }

        res.status(201).json({ status: 'success', message: 'Tạo thành công' })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message })
    }
}

exports.update = async (req, res) => {
    try {
        const updateData = await MaterialCostUsed.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
        const deleteData = await MaterialCostUsed.findByIdAndDelete(req.params.id)
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
            const productionScopes = await ProductionScope.find({ code: new RegExp(req.query.q, 'i') })
            const productionScopeIds = productionScopes.map(i => i._id)
            query.productionScope = { $in: productionScopeIds }
        }
        const modelQuery = MaterialCostUsed.find(query)
            .populate({
                path: 'productionScope',
                populate: 'phases.phase'
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'materials.material',
                populate: [
                    { path: 'uom', select: 'name' },
                    {
                        path: 'assignmentCode', select: 'code name uom',
                        populate: 'uom'
                    }
                ]
            })
        const pagination = await paginateQuery(MaterialCostUsed, modelQuery, query, req.query)

        const todayStr = new Date().toISOString().split('T')[0];

        pagination.data = pagination.data.map((doc) => {
            const docObj = doc.toObject();
            const groupMap = {};
            docObj.materials = docObj.materials.map((mat) => {
                const material = mat.material;

                const assignmentCode = material?.assignmentCode?.code || "";

                let currentPrice = null;

                if (material && Array.isArray(material.priceHistory)) {
                    const matched = material.priceHistory.find(priceItem =>
                        todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
                    );

                    if (matched) currentPrice = matched.price;
                }

                if (!groupMap[assignmentCode]) {
                    groupMap[assignmentCode] = {
                        assignmentCode: material.assignmentCode,
                        materials: []
                    };
                }
                groupMap[assignmentCode].materials.push({
                    ...mat,
                    cost: (currentPrice || 0) * mat.quantity,
                    material: {
                        ...material,
                        currentPrice
                    }
                });
            });
            docObj.materials = Object.values(groupMap);
            return docObj;
        });


        res.status(200).json({ status: 'success', data: pagination })
    } catch (err) {
        console.log(err.stack)
        res.status(500).json({ status: 'error', message: err.message })
    }
}