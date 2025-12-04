const mongoose = require('mongoose')

const CrossSection = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    uom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
}, {
    timestamps: true
})
module.exports = mongoose.model('CrossSection', CrossSection)