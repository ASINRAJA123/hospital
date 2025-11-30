const mongoose = require('mongoose');

const clinicalNoteSchema = new mongoose.Schema({
    authorDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const visitSchema = new mongoose.Schema({
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment', 
        required: true, 
        unique: true, 
        index: true 
    },
    // Standard SOAP notes
    subjective: { type: String },
    objective: { type: String },
    assessment: { type: String }, // Diagnosis/Assessment
    plan: { type: String },
    
    // New field for Next Visit
    nextVisitDate: { type: Date },

    // Internal notes array
    notes: [clinicalNoteSchema], 
    
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }
}, {
    timestamps: true
});

const Visit = mongoose.model('Visit', visitSchema);
module.exports = Visit;