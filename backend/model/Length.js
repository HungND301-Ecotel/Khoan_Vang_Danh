const mongoose = require('mongoose')

const Length = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Length name is required']
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Length', Length)