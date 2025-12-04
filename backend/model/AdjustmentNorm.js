const mongoose = require('mongoose')

const AdjustmentNorm = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    hardness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hardness'
    },
    rockRatio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RockRatio'
    },
    mirrorRatio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MirrorRatio'
    },
    type: {
        type: String,
        enum: ['CM', 'CKKT', 'CKĐL']
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
module.exports = mongoose.model('AdjustmentNorm', AdjustmentNorm)