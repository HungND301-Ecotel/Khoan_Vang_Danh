const mongoose = require('mongoose')

const MingingTech = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'MingingTech code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'MingingTech name is required'],
        unique: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('MingingTech', MingingTech)