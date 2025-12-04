const mongoose = require('mongoose')

const AssignmentNorm = new mongoose.Schema({
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
    step: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Step'
    },
    length: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Length'
    },
    cutting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cutting'
    },
    crossSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CrossSection'
    },
    curbSlope: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurbSlope'
    },
    hardness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hardness'
    },
    thickness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thickness'
    },
    type: {
        type: String,
        enum: ['cutting', 'excavation', 'coal_kb', 'coal_zh', 'coal_zry']
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
module.exports = mongoose.model('AssignmentNorm', AssignmentNorm)