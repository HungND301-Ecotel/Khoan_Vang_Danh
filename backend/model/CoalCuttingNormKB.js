const mongoose = require('mongoose')

const CoalCuttingNormKB = new mongoose.Schema({
    code: {
        type: String
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
module.exports = mongoose.model('CoalCuttingNormKB', CoalCuttingNormKB)