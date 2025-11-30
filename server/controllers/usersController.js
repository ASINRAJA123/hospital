// controllers/usersController.js

const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const { USER_ROLES } = require('../utils/constants');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getUserMe = asyncHandler(async (req, res) => {
    // req.user is attached by the 'protect' middleware and already includes populated hospital
    res.json(req.user);
});

// @desc    Create a new user
// @route   POST /api/users/
// @access  Private (Admin, Doctor)
const createUser = asyncHandler(async (req, res) => {
    // --- START: CORRECTED CODE ---
    // FIX: Destructure `full_name` (snake_case) from the request body to match the client.
    const { email, full_name, password, role } = req.body;
    // --- END: CORRECTED CODE ---

    const currentUser = req.user;

    console.log(`Attempting to create user with role: ${role} by user: ${currentUser.email} (Role: ${currentUser.role})`);

    let allowedRolesToCreate = [];
    switch (currentUser.role) {
        case USER_ROLES.ADMIN:
            allowedRolesToCreate = [USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.MEDICAL_SHOP];
            break;
        case USER_ROLES.DOCTOR:
            allowedRolesToCreate = [USER_ROLES.NURSE, USER_ROLES.MEDICAL_SHOP];
            break;
        default:
            res.status(403);
            throw new Error("You are not authorized to create new users.");
    }

    if (!role || !allowedRolesToCreate.includes(role)) {
        res.status(403);
        throw new Error(`Your role (${currentUser.role}) is not permitted to create a user with the role '${role}'.`);
    }

    if (!currentUser.hospitalId) {
        res.status(403);
        throw new Error("Creator is not associated with a hospital.");
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
        res.status(400);
        throw new Error("A user with this email already exists.");
    }

    const hospitalIdForNewUser = currentUser.hospital._id;

    const user = await User.create({
        email: email.toLowerCase(),
        // --- START: CORRECTED CODE ---
        // FIX: Map the destructured `full_name` to the Mongoose model's `fullName` field.
        fullName: full_name,
        // --- END: CORRECTED CODE ---
        hashedPassword: password, // Hashed by pre-save hook
        role,
        hospitalId: hospitalIdForNewUser,
    });

    if (user) {
        console.log("User created successfully:", user.email);
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            hospitalId: user.hospitalId
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get users by filter
// @route   GET /api/users/
// @access  Private (Admin, Nurse)
const getAllUsers = asyncHandler(async (req, res) => {
    const { hospitalId } = req.user;
    const { role, is_active } = req.query;

    let query = { hospitalId };
    if (role) {
        query.role = role;
    }
    if (is_active !== undefined) {
        query.isActive = is_active === 'true';
    }

    const users = await User.find(query).select('-hashedPassword').sort({ fullName: 1 });
    res.json(users);
});

// @desc    Get staff managed by a doctor
// @route   GET /api/users/my-staff
// @access  Private (Doctor)
const getMyStaff = asyncHandler(async (req, res) => {
    const { hospitalId } = req.user;
    const { role } = req.query; // role as string

    if (![USER_ROLES.NURSE, USER_ROLES.MEDICAL_SHOP].includes(role)) {
        res.status(400);
        throw new Error("Doctors can only view Nurses or Medical Shops.");
    }
    
    const staff = await User.find({ hospitalId, role }).select('-hashedPassword').sort({ fullName: 1 });
    res.json(staff);
});

// @desc    Update a user's status (activate/deactivate)
// @route   PUT /api/users/:id
// @access  Private (Admin, Doctor)
const updateUser = asyncHandler(async (req, res) => {
    const { is_active } = req.body;
    const currentUser = req.user;

    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('User not found');
    }

    if (userToUpdate.hospitalId.toString() !== currentUser.hospitalId.toString()) {
        res.status(403);
        throw new Error("Not authorized to manage users outside your hospital.");
    }
    
    if (currentUser.role === USER_ROLES.DOCTOR && ![USER_ROLES.NURSE, USER_ROLES.MEDICAL_SHOP].includes(userToUpdate.role)) {
        res.status(403);
        throw new Error("Doctors can only manage Nurses or Medical Shops.");
    }

    userToUpdate.isActive = is_active;
    const updatedUser = await userToUpdate.save();

    res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
    });
});

// @desc    Initiate a password reset for a user
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin, Doctor)
const resetUserPassword = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const userToReset = await User.findById(req.params.id);

    if (!userToReset) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (userToReset.hospitalId.toString() !== currentUser.hospitalId.toString()) {
        res.status(403);
        throw new Error("Not authorized to manage users outside your hospital.");
    }

    if (currentUser.role === USER_ROLES.DOCTOR && ![USER_ROLES.NURSE, USER_ROLES.MEDICAL_SHOP].includes(userToReset.role)) {
        res.status(403);
        throw new Error("Doctors can only reset passwords for Nurses or Medical Shops.");
    }
    
    // In a real application, you would generate a token and email it.
    // For this conversion, we match the original backend's response.
    res.json({ msg: `Password reset initiated for user ${userToReset.email}` });
});


module.exports = {
    getUserMe,
    createUser,
    getAllUsers,
    getMyStaff,
    updateUser,
    resetUserPassword
};