const mongoose = require('mongoose')

const MaterialCostUsed = new mongoose.Schema({
    productionScope: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionScope',
        required: [true, 'ProductionScope is required'],
    },
    month: String,
    phases: [
        {
            phase: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Phase',
                required: [true, 'Phase is required'],
            },
            production: {
                type: Number
            },
            unit: {
                type: String
            },
            assignmentNormCode: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AssignmentNorm',
                required: [true, 'AssignmentNorm is required'],
            },
            adjustmentNormCode: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AdjustmentNorm',
                required: [true, 'AdjustmentNorm is required'],
            },
        }
    ],
    totalUsedCost: Number,
    materials: [
        {
            material: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MaterialAssignment'
            },
            quantity: {
                type: Number
            },
            price: Number,
            cost: Number
        }
    ]
}, {
    timestamps: true
})

MaterialCostUsed.pre('save', async function (next) {

   const newMonth= this.month;
    const currentScope = this.productionScope;

    // 2. Xây dựng truy vấn để tìm các tài liệu xung đột
    const conflictQuery = {
        _id: { $ne: this._id },
        productionScope: currentScope,
        month: newMonth
    };

    try {
        const existingDocument = await mongoose.models.MaterialCostUsed.findOne(conflictQuery);
        // 3. Xử lý kết quả truy vấn
        if (existingDocument) {
            // Nếu tìm thấy tài liệu xung đột
            const error = new Error('Thời gian đã tồn tại');
            return next(error);
        }
        next();
    } catch (error) {
        // Xử lý lỗi trong quá trình truy vấn
        next(error);
    }
});
module.exports = mongoose.model('MaterialCostUsed', MaterialCostUsed)