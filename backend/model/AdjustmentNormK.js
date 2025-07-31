const mongoose = require('mongoose')

const AdjustmentNormK = new mongoose.Schema({
    code: {
        type: String
    },
    hardness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hardness'
    },
    rockRatio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RockRatio'
    },
    type: {
        type: String
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
module.exports = mongoose.model('AdjustmentNormK', AdjustmentNormK)