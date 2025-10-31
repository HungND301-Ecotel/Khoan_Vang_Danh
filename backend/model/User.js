const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    gender: { type: String },
    email: { type: String },
    phone: { type: String },
    avatar: { type: String },
    role: { type: String, default: "admin" },
    passwordChangedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now();
    next();
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('User', userSchema); 