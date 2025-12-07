const mongoose = require('mongoose')

const MaterialCostUsed = new mongoose.Schema({
    productionScope: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionScope',
        required: [true, 'ProductionScope is required'],
    },
    startDate: {
        type: String,
        required: [true, 'startDate is required'],
    },
    endDate: {
        type: String,
        required: [true, 'endDate is required'],
    },
    phases: [
        {
            phase: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PhaseGroup',
                required: [true, 'PhaseGroup is required'],
            },
            production: {
                type: Number
            },
            unit: {
                type: String
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

    const newStartDate = this.startDate; // Ví dụ: "2025-12-01"
    const newEndDate = this.endDate;   // Ví dụ: "2025-12-30"
    const currentScope = this.productionScope;

    // 2. Xây dựng truy vấn để tìm các tài liệu xung đột
    const conflictQuery = {
        _id: { $ne: this._id },
        productionScope: currentScope,
        startDate: newStartDate,
        endDate: newEndDate
    };

    console.log(conflictQuery)
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