const mongoose = require('mongoose')

const ProductionScope = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'code is required'],
        unique: true
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        unique: true
    },
    phases: {
        type: [
            {
                phase: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Phase',
                    required: [true, 'phase is required'],
                },
                // production: {
                //     type: Number
                // }
            }
        ],
        required: [true, 'phases array is required'],
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('ProductionScope', ProductionScope)