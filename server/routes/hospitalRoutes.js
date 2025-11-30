const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
    createHospitalAndAdmin,
    getAllHospitals,
    deleteHospital
} = require('../controllers/hospitalsController');

router.route('/')
    .post(protect, authorize(USER_ROLES.SUPER_ADMIN), createHospitalAndAdmin)
    .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), getAllHospitals);
    
router.route('/:id')
    .delete(protect, authorize(USER_ROLES.SUPER_ADMIN), deleteHospital);

module.exports = router;