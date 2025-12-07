const mongoose = require('mongoose')

const MaterialBudget = new mongoose.Schema({
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
            totalBudgetCost: Number,
            budgetCostDetails: [{
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
    totalBudgetCost: Number
}, {
    timestamps: true
})

MaterialBudget.pre('save', async function (next) {

    const newStartDate = this.startDate; // Ví dụ: "2025-12-01"
    const newEndDate = this.endDate;   // Ví dụ: "2025-12-30"
    const currentScope = this.productionScope;

    // 2. Xây dựng truy vấn để tìm các tài liệu xung đột
    const conflictQuery = {

        _id: { $ne: this._id },
        productionScope: currentScope,
        $and: [
            // Cũ.startDate <= Mới.endDate (Ngày bắt đầu cũ xảy ra trước/cùng lúc với ngày kết thúc mới)
            { startDate: { $lte: newEndDate } },
            // Cũ.endDate >= Mới.startDate (Ngày kết thúc cũ xảy ra sau/cùng lúc với ngày bắt đầu mới)
            { endDate: { $gte: newStartDate } }
        ]
    };

    try {
        const existingDocument = await mongoose.models.MaterialBudget.findOne(conflictQuery);

        // 3. Xử lý kết quả truy vấn
        if (existingDocument) {
            // Nếu tìm thấy tài liệu xung đột
            const error = new Error('Thời gian không hợp lệ.');
            return next(error);
        }
        next();
    } catch (error) {
        // Xử lý lỗi trong quá trình truy vấn
        next(error);
    }
});
module.exports = mongoose.model('MaterialBudget', MaterialBudget)