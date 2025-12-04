const mongoose = require('mongoose')

const ExcavationNorm = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
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
                ref: 'AssignmentCode',
                required: [true, 'AssignmentCode is required'],
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