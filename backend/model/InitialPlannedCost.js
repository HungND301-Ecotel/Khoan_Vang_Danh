const mongoose = require('mongoose')

const InitialPlannedCost = new mongoose.Schema({
    productionScope: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionScope',
        required: [true, 'ProductionScope is required'],
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required'],
    },
    month: {
        type: String,
        required: [true, 'month is required'],
    },
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
            },
            adjustmentNormCode: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AdjustmentNorm',
            },
            totalInitialPlannedCost: Number,
            initialPlannedCostDetails: [{
                assignmentCode: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'AssignmentCode'
                },
                baseNorm: Number,
                adjustmentNorm: Number,
                norm: Number,
                quantity: Number,
                price: Number,
                cost: Number
            }]
        }
    ],
    totalInitialPlannedCost: Number
}, {
    timestamps: true
})

InitialPlannedCost.pre('save', async function (next) {

    const newMonth = this.month; // Ví dụ: "2025-12-01"
    const currentScope = this.productionScope;
    const currentDepartment = this.department;

    // 2. Xây dựng truy vấn để tìm các tài liệu xung đột
    const conflictQuery = {
        _id: { $ne: this._id },
        productionScope: currentScope,
        department: currentDepartment,
        month: newMonth
    };

    try {
        const existingDocument = await mongoose.models.InitialPlannedCost.findOne(conflictQuery);

        // 3. Xử lý kết quả truy vấn
        if (existingDocument) {
            // Nếu tìm thấy tài liệu xung đột
            const error = new Error('Thời gian tạo đã tồn tại.');
            return next(error);
        }
        next();
    } catch (error) {
        // Xử lý lỗi trong quá trình truy vấn
        next(error);
    }
});
module.exports = mongoose.model('InitialPlannedCost', InitialPlannedCost)