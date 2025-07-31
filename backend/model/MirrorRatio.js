const mongoose = require('mongoose')

const MirrorRatio = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'MirrorRatio name is required']
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('MirrorRatio', MirrorRatio)