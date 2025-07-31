const mongoose = require('mongoose')

const AdjustmentNormCM = new mongoose.Schema({
    code: {
        type: String
    },
    mirrorRatio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MirrorRatio'
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
module.exports = mongoose.model('AdjustmentNormCM', AdjustmentNormCM)