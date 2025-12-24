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
    price: {
        type: Number
    },
}, {
    timestamps: true
})
module.exports = mongoose.model('AssignmentCode', AssignmentCode)