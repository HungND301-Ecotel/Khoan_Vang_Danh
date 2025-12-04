const mongoose = require('mongoose')

const CuttingNorm = new mongoose.Schema({
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
    hardness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hardness'
    },
    cutting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cutting'
    },
    crossSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CrossSection'
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
module.exports = mongoose.model('CuttingNorm', CuttingNorm)