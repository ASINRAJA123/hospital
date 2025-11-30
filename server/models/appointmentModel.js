const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LIST } = require('../utils/constants');

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentTime: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: APPOINTMENT_STATUS_LIST, default: APPOINTMENT_STATUS.SCHEDULED },
    visitPurpose: { type: String },
    
    // Link to the Visit details (Clinical data)
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals for populating related documents
appointmentSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true
});

appointmentSchema.virtual('doctor', {
    ref: 'User',
    localField: 'doctorId',
    foreignField: '_id',
    justOne: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;