const mongoose = require('mongoose')

const hardness = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('Hardness', hardness)