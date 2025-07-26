const mongoose = require('mongoose')

const ExcavationNorm = new mongoose.Schema({
    code: {
        type: String
    },
    phaseGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhaseGroup'
    },
    phase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Phase'
    },
    excavationTech: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExcavationTech'
    },
    hardness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hardness'
    },
    step: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Step'
    },
    norms: [
        {
            assignmentCode: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AssignmentCode'
            },
            norm: {
                type: Number
            }
        }
    ]
}, {
    timestamps: true
})
module.exports = mongoose.model('ExcavationNorm', ExcavationNorm)