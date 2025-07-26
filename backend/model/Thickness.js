const mongoose = require('mongoose')

const Thickness = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Thickness name is required']
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Thickness', Thickness)