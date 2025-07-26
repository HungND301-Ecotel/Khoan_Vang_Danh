const mongoose = require('mongoose')

const CurbSlope = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'CurbSlope name is required']
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('CurbSlope', CurbSlope)