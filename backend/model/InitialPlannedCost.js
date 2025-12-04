const mongoose = require('mongoose')

const InitialPlannedCost = new mongoose.Schema({
    code: {
        type: String
    },
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
            totalPlannedCost: Number,
            plannedCostDetails: [{
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
    totalPlannedCost: Number
}, {
    timestamps: true
})
module.exports = mongoose.model('InitialPlannedCost', InitialPlannedCost)