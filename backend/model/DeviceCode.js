const mongoose = require('mongoose')

const DeviceCode = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'DeviceCode is required'],
        unique: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('DeviceCode', DeviceCode)