const mongoose = require('mongoose')

const MaterialsOutsideContractSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: [true, 'Code is required'] 
    },
    name: {
        type: String,
        required: [true, 'Material name is required']
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

// SỬA: Dùng đúng tên schema
module.exports = mongoose.model('MaterialsOutsideContract', MaterialsOutsideContractSchema)