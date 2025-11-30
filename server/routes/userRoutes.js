// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
    getUserMe,
    createUser,
    getAllUsers,
    getMyStaff,
    updateUser,
    resetUserPassword
} = require('../controllers/usersController');

router.use(protect);

// This route is fine for all roles
router.get('/me', getUserMe);

// --- START: CORRECTED CODE ---
// FIX: Restrict these hospital-specific user management routes.
router.get('/my-staff', authorize(USER_ROLES.DOCTOR), getMyStaff);

router.route('/')
    .post(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR), createUser)
    .get(authorize(USER_ROLES.ADMIN, USER_ROLES.NURSE), getAllUsers);
    
router.route('/:id')
    .put(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR), updateUser);

router.post('/:id/reset-password', authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR), resetUserPassword);
// --- END: CORRECTED CODE ---

module.exports = router;