const mongoose = require('mongoose')

const AssignmentCode = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Assignment name is required'],
    },
    uom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    deviceCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeviceCode'
    },
    executionPrice: {
        type: Number,
        default: 0
    },
    plannedPrice: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
})
module.exports = mongoose.model('AssignmentCode', AssignmentCode)