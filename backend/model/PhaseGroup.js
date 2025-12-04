const mongoose = require('mongoose')

const phaseGroup = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Phase group name is required'],
        unique: true
    }
},{
    timestamps: true
})

module.exports = mongoose.model('PhaseGroup', phaseGroup)