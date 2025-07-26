const mongoose = require('mongoose')

const MaterialAssignment = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'MaterialAssignment name is required']
    },
    uom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    assignmentCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssignmentCode'
    },
    quantity:{
        type:Number
    },
    priceHistory: [{
        price: Number,
        startDate: String,
        endDate: String
    }],
}, {
    timestamps: true
})

module.exports = mongoose.model('MaterialAssignment', MaterialAssignment)