const mongoose = require('mongoose')

const MaterialBudget = new mongoose.Schema({
    code: {
        type: String
    },
 //   phaseGroup: {
 //       type: mongoose.Schema.Types.ObjectId,
 //       ref: 'PhaseGroup'
 //   },
    phase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Phase'
    },
    assignmentNormCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssignmentNorm'
    },
    adjustmentNormCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdjustmentNorm'
    },
    production: {
        type: Number
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('MaterialBudget', MaterialBudget)