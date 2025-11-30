// server/routes/patientRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');

const {
    createPatient,
    getAllPatients,
    searchPatientsByPhone,
    getPatientAppointmentHistory,
    getPatientReportPdf
} = require('../controllers/patientsController');

router.use(protect);

// --- START: CORRECTED CODE ---
// FIX: Authorize these routes only for hospital-level roles.
// The super_admin should not be interacting with specific patients.
router.route('/')
    .post(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE), createPatient)
    .get(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE), getAllPatients);

router.route('/search').get(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE), searchPatientsByPhone);

router.route('/:id/appointment-history').get(authorize(USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE), getPatientAppointmentHistory);
router.route('/:id/report').get(authorize(USER_ROLES.DOCTOR, USER_ROLES.NURSE), getPatientReportPdf);
// --- END: CORRECTED CODE ---

module.exports = router;