const mongoose = require('mongoose')

const ProductionScope = new mongoose.Schema({
    code: {
        type: String
    },
    name: {
        type: String
    },
    phases: [
        {
            phase: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PhaseGroup'
            },
            production: {
                type: Number
            }
        }
    ]
}, {
    timestamps: true
})
module.exports = mongoose.model('ProductionScope', ProductionScope)