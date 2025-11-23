const mongoose = require('mongoose')

const MaterialCostUsed = new mongoose.Schema({
    code: {
        type: String
    },
    productionScope: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionScope'
    },
    phases: [
        {
            phase: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PhaseGroup'
            },
            production: {
                type: Number
            },
            unit: {
                type: String
            },
            assignmentNormCode: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AssignmentNorm'
            },
            adjustmentNormCode: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AdjustmentNorm'
            },
        }
    ],
    materials: [
        {
            material: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MaterialAssignment'
            },
            quantity: {
                type: Number
            },
            cost: Number
        }
    ]
}, {
    timestamps: true
})
module.exports = mongoose.model('MaterialCostUsed', MaterialCostUsed)