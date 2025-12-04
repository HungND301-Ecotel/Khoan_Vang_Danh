const mongoose = require('mongoose')

const ExcavationTech = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'ExcavationTech name is required'],
        unique: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('ExcavationTech', ExcavationTech)