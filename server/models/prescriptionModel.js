const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { PRESCRIPTION_STATUS_LIST, DISPENSE_LINE_STATUS_LIST, PRESCRIPTION_STATUS, DISPENSE_LINE_STATUS } = require('../utils/constants');

const prescriptionLineItemSchema = new mongoose.Schema({
    medicineName: { type: String, required: true },
    dose: { type: String },
    frequency: { type: String },
    durationDays: { type: Number },
    instructions: { type: String },
    status: { type: String, enum: DISPENSE_LINE_STATUS_LIST, default: DISPENSE_LINE_STATUS.NOT_GIVEN },
    substitutionInfo: { type: String }
});

const prescriptionSchema = new mongoose.Schema({
    status: { type: String, enum: PRESCRIPTION_STATUS_LIST, default: PRESCRIPTION_STATUS.CREATED },
    publicViewToken: { type: String, default: uuidv4, unique: true, index: true },
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    
    // 👇 NEW FIELDS FOR WHITEBOARD FEATURE
    prescriptionType: { 
        type: String, 
        enum: ['digital', 'handwritten'], 
        default: 'digital' 
    },
    prescriptionImage: { type: String }, // Stores Base64 string of the drawing
    
    lineItems: [prescriptionLineItemSchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
prescriptionSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true
});

prescriptionSchema.virtual('doctor', {
    ref: 'User',
    localField: 'doctorId',
    foreignField: '_id',
    justOne: true
});

prescriptionSchema.virtual('hospital', {
    ref: 'Hospital',
    localField: 'hospitalId',
    foreignField: '_id',
    justOne: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;