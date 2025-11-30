const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
    getPharmacyQueue,
    getPharmacyStats,
    dispensePrescription,
    getPrescriptionById,
    getPublicPrescriptionView,
} = require('../controllers/prescriptionsController');

// Public route - does not use 'protect' middleware
router.get('/view/:token', getPublicPrescriptionView);

// All subsequent routes are protected
router.use(protect);

router.get('/queue', authorize(USER_ROLES.MEDICAL_SHOP, USER_ROLES.ADMIN), getPharmacyQueue);
router.get('/stats', authorize(USER_ROLES.MEDICAL_SHOP), getPharmacyStats);

router.route('/:id')
    .get(getPrescriptionById) // General access for authorized users
    .put(authorize(USER_ROLES.MEDICAL_SHOP), dispensePrescription);

// Renaming the route from `/dispense` to match the controller action
router.put('/:id/dispense', authorize(USER_ROLES.MEDICAL_SHOP), dispensePrescription);

module.exports = router;