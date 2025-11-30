// server/controllers/prescriptionController.js

const asyncHandler = require('express-async-handler');
const Prescription = require('../models/prescriptionModel');
const { notifyUser } = require('../utils/socketManager');
const { PRESCRIPTION_STATUS, DISPENSE_LINE_STATUS } = require('../utils/constants');
const moment = require('moment');

// @desc    Get pharmacy prescription queue
// @route   GET /api/prescriptions/queue
// @access  Private (Medical Shop, Admin)
const getPharmacyQueue = asyncHandler(async (req, res) => {
    const prescriptions = await Prescription.find({
        hospitalId: req.user.hospitalId,
        status: { $in: [PRESCRIPTION_STATUS.CREATED, PRESCRIPTION_STATUS.PARTIALLY_DISPENSED] }
    })
    .populate('patient', 'fullName')
    .sort({ createdAt: -1 });
    
    res.json(prescriptions);
});

// @desc    Get pharmacy dashboard stats
// @route   GET /api/prescriptions/stats
// @access  Private (Medical Shop)
const getPharmacyStats = asyncHandler(async (req, res) => {
    const { hospitalId } = req.user;
    
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    const new_prescriptions = await Prescription.countDocuments({ hospitalId, status: PRESCRIPTION_STATUS.CREATED });
    const in_progress = await Prescription.countDocuments({ hospitalId, status: PRESCRIPTION_STATUS.PARTIALLY_DISPENSED });
    const completed_today = await Prescription.countDocuments({ 
        hospitalId, 
        status: PRESCRIPTION_STATUS.FULLY_DISPENSED,
        updatedAt: { $gte: todayStart, $lte: todayEnd }
    });
    
    res.json({
        new_prescriptions,
        in_progress,
        completed_today,
        total_pending: new_prescriptions + in_progress,
    });
});

// @desc    Update dispense status for a prescription
// @route   PUT /api/prescriptions/:id/dispense
// @access  Private (Medical Shop)
const dispensePrescription = asyncHandler(async (req, res) => {
    // req.body can now contain { status: 'Dispensed', line_items: [...] }
    const { status, line_items, updates } = req.body;
    
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription || prescription.hospitalId.toString() !== req.user.hospitalId.toString()) {
        res.status(404);
        throw new Error('Prescription not found');
    }
    
    // --- 1. HANDLE DIGITIZATION (Whiteboard -> Digital) ---
    // If we receive a full list of new items (e.g. from digitizing a whiteboard)
    if (line_items && Array.isArray(line_items) && line_items.length > 0) {
        
        // Map frontend snake_case to Mongoose camelCase schema
        const formattedItems = line_items.map(item => ({
            medicineName: item.medicine_name,
            dose: item.dose,
            frequency: item.frequency,
            durationDays: item.duration_days,
            instructions: item.instructions,
            // Capture the status set by the pharmacist (Given, Partial, Not Given)
            status: item.status || DISPENSE_LINE_STATUS.GIVEN 
        }));

        prescription.lineItems = formattedItems;
        
        // Ensure overall status is set to dispensed if items are added
        prescription.status = PRESCRIPTION_STATUS.FULLY_DISPENSED;
    } 
    // --- 2. HANDLE STANDARD UPDATE (Updating existing items) ---
    else if (updates && Array.isArray(updates)) {
        updates.forEach(update => {
            const lineItem = prescription.lineItems.id(update.line_item_id);
            if (lineItem) {
                lineItem.status = update.status;
                lineItem.substitutionInfo = update.substitution_info;
            }
        });

        // Recalculate overall prescription status based on individual line items
        const allStatuses = prescription.lineItems.map(item => item.status);
        if (allStatuses.every(s => [DISPENSE_LINE_STATUS.GIVEN, DISPENSE_LINE_STATUS.SUBSTITUTED].includes(s))) {
            prescription.status = PRESCRIPTION_STATUS.FULLY_DISPENSED;
        } else if (allStatuses.some(s => s !== DISPENSE_LINE_STATUS.NOT_GIVEN)) {
            prescription.status = PRESCRIPTION_STATUS.PARTIALLY_DISPENSED;
        } else {
             prescription.status = PRESCRIPTION_STATUS.CREATED;
        }
    }
    // --- 3. HANDLE DIRECT STATUS OVERRIDE ---
    else if (status) {
        // If just a status update is sent (fallback)
        prescription.status = status === 'Dispensed' ? PRESCRIPTION_STATUS.FULLY_DISPENSED : status;
    }

    await prescription.save();
    
    const updatedPrescription = await Prescription.findById(prescription._id).populate('patient', 'fullName');

    // Notify the doctor
    notifyUser(prescription.doctorId, "dispense_update", {
        prescription_id: updatedPrescription._id,
        status: updatedPrescription.status,
    });
    
    res.json(updatedPrescription);
});

// @desc    Get a single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id)
        .populate('patient', 'fullName')
        .populate('doctor', 'fullName'); // Added doctor population
    
    if (!prescription || prescription.hospitalId.toString() !== req.user.hospitalId.toString()) {
        res.status(404);
        throw new Error('Prescription not found');
    }
    
    res.json(prescription);
});

// @desc    Get public view of a prescription via token
// @route   GET /api/prescriptions/view/:token
// @access  Public
const getPublicPrescriptionView = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findOne({ publicViewToken: req.params.token })
        .populate('patient', 'fullName')
        .populate('doctor', 'fullName')
        .populate('hospital', 'name');

    if (!prescription) {
        res.status(404);
        throw new Error('Prescription not found or link is invalid.');
    }
    
    res.json({
        patient_name: prescription.patient.fullName,
        doctor_name: `Dr. ${prescription.doctor.fullName}`,
        hospital_name: prescription.hospital.name,
        status: prescription.status,
        created_at: prescription.createdAt,
        // Include Image if handwritten
        prescription_type: prescription.prescriptionType,
        prescription_image: prescription.prescriptionImage,
        line_items: prescription.lineItems.map(item => ({
            medicine_name: item.medicineName,
            dose: item.dose,
            frequency: item.frequency,
            duration_days: item.durationDays,
            instructions: item.instructions,
            status: item.status
        }))
    });
});

module.exports = {
    getPharmacyQueue,
    getPharmacyStats,
    dispensePrescription,
    getPrescriptionById,
    getPublicPrescriptionView
};