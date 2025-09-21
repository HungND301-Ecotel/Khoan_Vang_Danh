const mongoose = require('mongoose')

const MaterialCostUsed = new mongoose.Schema({
    code: {
        type: String
    },
    productionScope: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionScope'
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
    ],
    materials: [
        {
            material: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MaterialAssignment'
            },
            quantity: {
                type: Number
            }
        }
    ]
}, {
    timestamps: true
})
module.exports = mongoose.model('MaterialCostUsed', MaterialCostUsed)