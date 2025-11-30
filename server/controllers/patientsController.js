const asyncHandler = require('express-async-handler');
const Patient = require('../models/patientModel');
const Appointment = require('../models/appointmentModel');
const { generatePatientReport } = require('../services/pdfGenerator');

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Doctor, Nurse)
const createPatient = asyncHandler(async (req, res) => {
    // --- START: CORRECTED CODE ---
    // FIX: Destructure the snake_case keys that are being sent from the frontend.
    const { full_name, phone_number, date_of_birth, sex, height, weight } = req.body;
    // --- END: CORRECTED CODE ---
    
    const { hospitalId } = req.user;

    // Improved logging for easier debugging
    console.log('Received patient creation request. Body:', JSON.stringify(req.body));


    if (!hospitalId) {
        res.status(403);
        throw new Error("Creator is not associated with a hospital.");
    }

    // Check for an existing patient with the same name and phone number.
    const patientExists = await Patient.findOne({ fullName: full_name, phoneNumber: phone_number, hospitalId });
    if (patientExists) {
        res.status(400);
        throw new Error("This patient is already registered with this phone number.");
    }

    const patient = new Patient({
        // --- START: CORRECTED CODE ---
        // FIX: Map the snake_case variables to the camelCase fields defined in the Mongoose schema.
        fullName: full_name,
        phoneNumber: phone_number,
        dateOfBirth: date_of_birth || null,
        // --- END: CORRECTED CODE ---
        sex,
        height,
        weight,
        hospitalId
    });
    
    const createdPatient = await patient.save();
    console.log('Patient created successfully:', createdPatient._id);
    res.status(201).json(createdPatient);
});


// @desc    Get all patients for the user's hospital with filters
// @route   GET /api/patients
// @access  Private
const getAllPatients = asyncHandler(async (req, res) => {
    const { hospitalId } = req.user;
    const { search, appointment_date } = req.query;

    let query = { hospitalId };

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { fullName: searchRegex },
            { phoneNumber: searchRegex }
        ];
    }
    
    let patientQuery = Patient.find(query).sort({ fullName: 1 });

    if (appointment_date) {
        const startOfDay = new Date(appointment_date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointment_date);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            appointmentTime: { $gte: startOfDay, $lte: endOfDay }
        }).select('patientId');
        
        const patientIds = appointments.map(a => a.patientId);
        patientQuery = patientQuery.where('_id').in(patientIds);
    }
    
    const patients = await patientQuery.exec();
    res.json(patients);
});

// @desc    Search patients by phone number
// @route   GET /api/patients/search
// @access  Private
const searchPatientsByPhone = asyncHandler(async (req, res) => {
    const { phone_number } = req.query;
    const { hospitalId } = req.user;

    if (!phone_number) {
        return res.json([]);
    }

    // --- START: CORRECTED CODE ---
    // FIX: Sanitize the incoming search query by removing all non-numeric characters.
    const sanitizedPhone = phone_number.replace(/\D/g, '');

    if (!sanitizedPhone) {
        return res.json([]);
    }

    // Create a regular expression that finds the sequence of digits anywhere in the stored phone number.
    const phoneRegex = new RegExp(sanitizedPhone);
    
    // Find patients where the phone number matches the flexible regex.
    const patients = await Patient.find({ phoneNumber: phoneRegex, hospitalId });
    // --- END: CORRECTED CODE ---
    
    res.json(patients);
});


// @desc    Get a patient's appointment history
// @route   GET /api/patients/:id/appointment-history
// @access  Private
const getPatientAppointmentHistory = asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient || patient.hospitalId.toString() !== req.user.hospitalId.toString()) {
        res.status(404);
        throw new Error("Patient not found in this hospital.");
    }

    const history = await Appointment.find({ 
        patientId: req.params.id,
        status: 'Completed'
    })
    .populate('doctor', 'fullName')
    .populate({
        path: 'visit',
        populate: {
            path: 'prescription',
            populate: {
                path: 'lineItems patient'
            }
        }
    })
    .sort({ appointmentTime: -1 });

    res.json(history);
});

// @desc    Generate and download a patient's PDF report
// @route   GET /api/patients/:id/report
// @access  Private
const getPatientReportPdf = asyncHandler(async (req, res) => {
    const patient = await Patient.findById(req.params.id).populate('hospital');

    if (!patient || patient.hospitalId.toString() !== req.user.hospitalId.toString()) {
        res.status(404);
        throw new Error("Patient not found in this hospital.");
    }
    
    // Fetch history needed for the report
    const history = await Appointment.find({ 
        patientId: req.params.id,
        status: 'Completed'
    })
    .populate('doctor', 'fullName speciality')
    .populate({
        path: 'visit',
        populate: { path: 'prescription' }
    })
    .sort({ appointmentTime: -1 });

    const pdfBuffer = await generatePatientReport(patient, patient.hospital, history);
    
    const filename = `${patient.fullName.replace(/\s/g, '_')}-${patient.phoneNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
});


module.exports = {
    createPatient,
    getAllPatients,
    searchPatientsByPhone,
    getPatientAppointmentHistory,
    getPatientReportPdf
};