const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    fullName: { type: String, required: true, index: true, trim: true },
    phoneNumber: { type: String, required: true, index: true, trim: true },
    dateOfBirth: { type: Date },
    sex: { type: String, enum: ['Male', 'Female', 'Other'] },
    height: { type: String },
    weight: { type: String },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

patientSchema.virtual('hospital', {
    ref: 'Hospital',
    localField: 'hospitalId',
    foreignField: '_id',
    justOne: true
});

patientSchema.virtual('appointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'patientId'
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;