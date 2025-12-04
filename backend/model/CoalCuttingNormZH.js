const mongoose = require('mongoose')

const CoalCuttingNormZH = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    length: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Length'
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
module.exports = mongoose.model('CoalCuttingNormZH', CoalCuttingNormZH)