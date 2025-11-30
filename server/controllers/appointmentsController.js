const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Appointment = require('../models/appointmentModel');
const Visit = require('../models/visitModel');
const Prescription = require('../models/prescriptionModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const { notifyUser, notifyPharmacy } = require('../utils/socketManager');
const { sendSms } = require('../services/smsSender');
const { APPOINTMENT_STATUS, USER_ROLES } = require('../utils/constants');
const config = require('../config');

// Helper function for status updates
const updateAppointmentStatus = async (appointmentId, newStatus, currentUser) => {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (!(currentUser.role === USER_ROLES.NURSE || currentUser.role === USER_ROLES.ADMIN) && appointment.doctorId.toString() !== currentUser._id.toString()) {
        throw new Error('Not authorized to modify this appointment');
    }
    
    appointment.status = newStatus;
    await appointment.save();
    return appointment;
};

// @desc    Create a new appointment
const createAppointment = asyncHandler(async (req, res) => {
    const { patient_id, doctor_id, appointment_time, visit_purpose } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(patient_id)) {
        res.status(400);
        throw new Error(`Invalid patient_id: ${patient_id}`);
    }
    if (!mongoose.Types.ObjectId.isValid(doctor_id)) {
        res.status(400);
        throw new Error(`Invalid doctor_id: ${doctor_id}`);
    }
    console.log(`✅ Validated IDs. Creating appointment for patient ${patient_id} with doctor ${doctor_id}`);

    const appointment = new Appointment({
        patientId: patient_id,
        doctorId: doctor_id,
        appointmentTime: appointment_time,
        visitPurpose: visit_purpose,
        createdById: req.user._id,
    });

    const createdAppointment = await appointment.save();
    const populatedAppointment = await Appointment.findById(createdAppointment._id).populate('patient', 'fullName');

    notifyUser(doctor_id, "new_appointment", {
        appointment_id: populatedAppointment._id,
        patient_name: populatedAppointment.patient.fullName,
    });

    res.status(201).json(populatedAppointment);
});

// @desc    Get appointments with filters
const getAppointments = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { patient_id, doctor_id, appointment_date } = req.query;

    let query = {};

    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
        const usersInHospital = await User.find({ hospitalId: currentUser.hospitalId }).select('_id');
        const userIds = usersInHospital.map(u => u._id);
        query.doctorId = { $in: userIds };
    }

    if (currentUser.role === USER_ROLES.DOCTOR && !doctor_id) {
        query.doctorId = currentUser._id;
    } else if (doctor_id) {
        query.doctorId = doctor_id;
    }
    
    if (patient_id) query.patientId = patient_id;
    
    if (appointment_date) {
        const startOfDay = new Date(appointment_date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(appointment_date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.appointmentTime = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const appointments = await Appointment.find(query)
        .populate('patient', 'fullName sex dateOfBirth')
        .populate('doctor', 'fullName')
        .populate({
            path: 'visit',
            populate: { path: 'prescription' }
        })
        .sort({ appointmentTime: 1 });

    res.json(appointments);
});

// @desc    Cancel an appointment
const cancelAppointment = asyncHandler(async (req, res) => {
    const appointment = await updateAppointmentStatus(req.params.id, APPOINTMENT_STATUS.CANCELLED, req.user);
    res.json(appointment);
});

// @desc    Mark appointment as no-show
const markAppointmentNoShow = asyncHandler(async (req, res) => {
    const appointment = await updateAppointmentStatus(req.params.id, APPOINTMENT_STATUS.NO_SHOW, req.user);
    res.json(appointment);
});

// @desc    Start a consultation
const startConsultation = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized for this appointment');
    }
    if (appointment.visit) {
        res.status(400);
        throw new Error('Consultation has already been started.');
    }

    const newVisit = new Visit({ appointmentId: appointment._id });
    await newVisit.save();

    appointment.status = APPOINTMENT_STATUS.IN_CONSULTATION;
    appointment.visit = newVisit._id;
    const updatedAppointment = await appointment.save();

    const result = await Appointment.findById(updatedAppointment._id)
        .populate('patient')
        .populate('doctor')
        .populate({ path: 'visit', populate: { path: 'prescription' } });
        
    res.json(result);
});

// @desc    Save visit details and complete appointment
const saveVisitDetails = asyncHandler(async (req, res) => {
    const { visit_details, prescription_details } = req.body;
    
    const appointment = await Appointment.findById(req.params.id).populate('visit').populate('patient');
    
    if (!appointment || !appointment.visit) {
        res.status(404);
        throw new Error("Consultation not found or was not properly started.");
    }
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to complete this visit.");
    }
    
    const visit = await Visit.findById(appointment.visit._id).populate('prescription');

    // --- 1. Map Frontend (Snake Case) to Backend (Camel Case) ---
    if (visit_details) {
        if (visit_details.subjective !== undefined) visit.subjective = visit_details.subjective;
        if (visit_details.objective !== undefined) visit.objective = visit_details.objective;
        if (visit_details.assessment !== undefined) visit.assessment = visit_details.assessment;
        if (visit_details.plan !== undefined) visit.plan = visit_details.plan;
        
        if (visit_details.next_visit_date) {
            visit.nextVisitDate = visit_details.next_visit_date;
        } else if (visit_details.next_visit_date === null || visit_details.next_visit_date === '') {
             visit.nextVisitDate = undefined; 
        }

        if (visit_details.private_note) {
            if (!visit.notes) visit.notes = [];
            const existingNoteIndex = visit.notes.findIndex(note => 
                note.authorDoctorId.toString() === req.user._id.toString()
            );
            if (existingNoteIndex > -1) {
                visit.notes[existingNoteIndex].content = visit_details.private_note;
                visit.notes[existingNoteIndex].createdAt = Date.now();
            } else {
                visit.notes.push({ authorDoctorId: req.user._id, content: visit_details.private_note });
            }
        }
    }
    
    // --- 2. Handle Prescription (Updated for Whiteboard) ---
    if (prescription_details) {
        
        // Check type: 'digital' or 'handwritten'
        const type = prescription_details.type || 'digital';
        
        let formattedLineItems = [];
        let prescriptionImage = null;

        // Process based on type
        if (type === 'digital' && prescription_details.line_items) {
             formattedLineItems = prescription_details.line_items.map(item => ({
                medicineName: item.medicine_name,
                dose: item.dose,
                frequency: item.frequency,
                durationDays: item.duration_days,
                instructions: item.instructions
            }));
        } else if (type === 'handwritten') {
            prescriptionImage = prescription_details.prescription_image;
        }

        if (!visit.prescription) {
            // Create New Prescription
            const newPrescription = new Prescription({
                visitId: visit._id,
                patientId: appointment.patientId,
                doctorId: req.user._id,
                hospitalId: req.user.hospitalId,
                prescriptionType: type,          // Save Type
                prescriptionImage: prescriptionImage, // Save Image (if handwritten)
                lineItems: formattedLineItems,   // Save items (if digital)
            });
            const savedPrescription = await newPrescription.save();
            visit.prescription = savedPrescription._id;

            console.log(`✅ Prescription created (${type}):`, savedPrescription._id);

            notifyPharmacy("new_prescription", {
                prescription_id: savedPrescription._id,
                patient_name: appointment.patient.fullName,
            });

            // Send SMS
            const viewUrl = `${config.frontendURL}/view-prescription/${savedPrescription.publicViewToken}`;
            const hospitalName = req.user.hospital ? req.user.hospital.name : "your recent visit";
            const smsBody = `Your e-prescription from ${hospitalName} is ready. View it here: ${viewUrl}`;
            sendSms(appointment.patient.phoneNumber, smsBody);

        } else {
            // Update Existing Prescription
            const existingPrescription = await Prescription.findById(visit.prescription._id);
            if (existingPrescription.status !== 'Dispensed') {
                existingPrescription.prescriptionType = type;
                existingPrescription.lineItems = formattedLineItems;
                existingPrescription.prescriptionImage = prescriptionImage;
                await existingPrescription.save();
                console.log('✅ Prescription updated successfully:', existingPrescription._id);
            }
        }
    }
    
    await visit.save();

    appointment.status = APPOINTMENT_STATUS.COMPLETED;
    await appointment.save();

    res.json({ msg: "Visit details saved successfully.", visitId: visit._id });
});

// @desc    Get all appointments for a nurse's hospital
const getAllAppointmentsForNurses = asyncHandler(async (req, res) => {
    const { appointment_date, doctor_id, patient_gender } = req.query;

    const doctorsInHospital = await User.find({ hospitalId: req.user.hospitalId }).select('_id');
    const doctorIds = doctorsInHospital.map(d => d._id);
    
    let query = { doctorId: { $in: doctorIds } };
    
    if (appointment_date) {
        const startOfDay = new Date(appointment_date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(appointment_date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.appointmentTime = { $gte: startOfDay, $lte: endOfDay };
    }

    if (doctor_id) {
        query.doctorId = doctor_id;
    }

    let appointmentsQuery = Appointment.find(query)
        .populate('patient', 'fullName sex')
        .populate('doctor', 'fullName')
        .populate({ path: 'visit', populate: { path: 'prescription' }})
        .sort({ appointmentTime: -1 });

    if (patient_gender) {
        const patients = await Patient.find({ sex: patient_gender, hospitalId: req.user.hospitalId }).select('_id');
        const patientIds = patients.map(p => p._id);
        appointmentsQuery.where('patientId').in(patientIds);
    }
    
    const appointments = await appointmentsQuery.exec();
    res.json(appointments);
});

module.exports = {
    createAppointment,
    getAppointments,
    cancelAppointment,
    markAppointmentNoShow,
    startConsultation,
    saveVisitDetails,
    getAllAppointmentsForNurses
};