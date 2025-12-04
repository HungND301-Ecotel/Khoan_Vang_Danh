const mongoose = require('mongoose')

const phase = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Phase name is required'],
        unique: true
    },
    phaseGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhaseGroup'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Phase', phase)