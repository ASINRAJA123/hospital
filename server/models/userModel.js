const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, USER_ROLE_LIST } = require('../utils/constants');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, required: true, enum: USER_ROLE_LIST },
    isActive: { type: Boolean, default: true },
    speciality: { type: String, trim: true },
    lastLogin: { type: Date },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for populating the hospital
userSchema.virtual('hospital', {
    ref: 'Hospital',
    localField: 'hospitalId',
    foreignField: '_id',
    justOne: true
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('hashedPassword')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, salt);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.hashedPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;