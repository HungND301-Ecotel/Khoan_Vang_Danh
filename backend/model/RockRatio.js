const mongoose = require('mongoose')

const RockRatio = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'RockRatio name is required']
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('RockRatio', RockRatio)