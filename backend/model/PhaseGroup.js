const mongoose = require('mongoose')

const phaseGroup = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Phase group name is required']
    }
},{
    timestamps: true
})

module.exports = mongoose.model('PhaseGroup', phaseGroup)