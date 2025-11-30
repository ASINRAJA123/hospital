// server/routes/appointmentRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
    createAppointment,
    getAppointments,
    cancelAppointment,
    markAppointmentNoShow,
    startConsultation,
    saveVisitDetails,
    getAllAppointmentsForNurses,
} = require('../controllers/appointmentsController');

router.use(protect);

// --- START: CORRECTED CODE ---
// FIX: The super_admin has no role in managing appointments.
// Restrict all these routes to hospital staff.
router.route('/')
    .post(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE), createAppointment)
    .get(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE), getAppointments);
    
router.get('/all', authorize(USER_ROLES.NURSE), getAllAppointmentsForNurses);
    
router.put('/:id/status/cancel', authorize(USER_ROLES.DOCTOR, USER_ROLES.NURSE), cancelAppointment);
router.put('/:id/status/no-show', authorize(USER_ROLES.DOCTOR, USER_ROLES.NURSE), markAppointmentNoShow);
router.put('/:id/status/start', authorize(USER_ROLES.DOCTOR), startConsultation);
router.put('/:id/status/complete', authorize(USER_ROLES.DOCTOR), saveVisitDetails);
// --- END: CORRECTED CODE ---

module.exports = router;