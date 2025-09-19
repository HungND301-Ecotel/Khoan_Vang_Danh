const MaterialCostUsed = require('../model/MaterialCostUsed')
const MaterialAssignment = require('../model/MaterialAssignment')

exports.create = async (req, res) => {
    try {
        const { code, productionScope, phases, materials } = req.body
        const newMaterialCostUsed = new MaterialCostUsed({ code, productionScope, phases, materials })
        await newMaterialCostUsed.save()
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
        const data = await MaterialCostUsed.find()
            .populate({
                path: 'productionScope',
                populate: 'phases.phase'
            })
            .populate('phases.phase', 'code name')
            .populate({
                path: 'materials.material',
                populate: 'uom'
            })
        const todayStr = new Date().toISOString().split('T')[0];

        const processedData = data.map((doc) => {
            const docObj = doc.toObject();

            docObj.materials = docObj.materials.map((mat) => {
                const material = mat.material;

                let currentPrice = null;

                if (material && Array.isArray(material.priceHistory)) {
                    const matched = material.priceHistory.find(priceItem =>
                        todayStr >= priceItem.startDate && todayStr <= priceItem.endDate
                    );

                    if (matched) currentPrice = matched.price;
                }

                return {
                    ...mat,
                    cost: currentPrice * mat.quantity || 0,
                    material: {
                        ...material,
                        currentPrice
                    }
                };
            });

            return docObj;
        });


        res.status(200).json({ status: 'success', data: processedData })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.stack })
    }
}