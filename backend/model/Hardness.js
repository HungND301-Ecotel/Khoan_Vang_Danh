const mongoose = require('mongoose')

const hardness = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('Hardness', hardness)