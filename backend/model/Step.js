const mongoose = require('mongoose')

const Step = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Step name is required'],
        unique: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Step', Step)