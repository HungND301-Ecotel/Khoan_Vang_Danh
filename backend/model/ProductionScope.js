const mongoose = require('mongoose')

const ProductionScope = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        unique: true
    },
}, {
    timestamps: true
})
module.exports = mongoose.model('ProductionScope', ProductionScope)