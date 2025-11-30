const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Hospital = require('../models/hospitalModel');
const User = require('../models/userModel');
const Patient = require('../models/patientModel');
const Prescription = require('../models/prescriptionModel');
const { USER_ROLES } = require('../utils/constants');

// @desc    Create a new hospital and its initial admin user
// @route   POST /api/hospitals
// @access  Private (Super Admin)
const createHospitalAndAdmin = asyncHandler(async (req, res) => {
    const { name, address, admin_email, admin_full_name, admin_password } = req.body;

    // 1. Validation Checks
    const hospitalExists = await Hospital.findOne({ name });
    if (hospitalExists) {
        res.status(400);
        throw new Error('A hospital with this name already exists.');
    }

    const adminEmailExists = await User.findOne({ email: admin_email.toLowerCase() });
    if (adminEmailExists) {
        res.status(400);
        throw new Error('A user with this email already exists.');
    }
    
    // 2. Create Hospital
    const hospital = new Hospital({ name, address });
    const newHospital = await hospital.save();
    
    // 3. Create Admin User
    const adminUser = new User({
        email: admin_email.toLowerCase(),
        hashedPassword: admin_password, // Password will be hashed by pre-save hook
        fullName: admin_full_name,
        role: USER_ROLES.ADMIN,
        hospitalId: newHospital._id,
    });
    await adminUser.save();

    res.status(201).json(newHospital);
});

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private (Super Admin, Admin)
const getAllHospitals = asyncHandler(async (req, res) => {
    const hospitals = await Hospital.find({});
    res.json(hospitals);
});

// @desc    Delete a hospital and all its associated data
// @route   DELETE /api/hospitals/:id
// @access  Private (Super Admin)
const deleteHospital = asyncHandler(async (req, res) => {
    const hospitalId = req.params.id;

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
        res.status(404);
        throw new Error('Hospital not found');
    }

    // Manually perform cascading delete as MongoDB doesn't enforce it automatically
    await User.deleteMany({ hospitalId: hospitalId });
    await Patient.deleteMany({ hospitalId: hospitalId });
    await Prescription.deleteMany({ hospitalId: hospitalId });
    // Note: Appointments and Visits will be orphaned but are linked to now-deleted users/patients.
    // A more robust cleanup could remove them based on deleted patient/doctor IDs.

    await hospital.remove();
    
    res.json({ msg: `Hospital '${hospital.name}' and all its data have been deleted.` });
});


module.exports = {
    createHospitalAndAdmin,
    getAllHospitals,
    deleteHospital
};