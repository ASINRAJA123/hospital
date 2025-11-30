const { USER_ROLES } = require('../utils/constants');

const users = [
    // Super Admin does not belong to a hospital
    {
        fullName: 'Super Admin',
        email: 'superadmin@hms.com',
        password: 'password123',
        role: USER_ROLES.SUPER_ADMIN,
        hospitalName: null // No hospital
    },
    // Admin for Central City General
    {
        fullName: 'Admin User',
        email: 'admin@hms.com',
        password: 'password123',
        role: USER_ROLES.ADMIN,
        hospitalName: 'Central City General Hospital'
    },
    // Doctor at Central City General
    {
        fullName: 'Dr. John Carter',
        email: 'doctor.carter@hms.com',
        password: 'password123',
        role: USER_ROLES.DOCTOR,
        speciality: 'Cardiology',
        hospitalName: 'Central City General Hospital'
    },
    // Nurse at Central City General
    {
        fullName: 'Nurse Carol Hathaway',
        email: 'nurse.carol@hms.com',
        password: 'password123',
        role: USER_ROLES.NURSE,
        hospitalName: 'Central City General Hospital'
    },
    // Pharmacy at Central City General
    {
        fullName: 'Central City Pharmacy',
        email: 'pharmacy.central@hms.com',
        password: 'password123',
        role: USER_ROLES.MEDICAL_SHOP,
        hospitalName: 'Central City General Hospital'
    },
    // A second doctor at Lakeside Medical Center for testing scope
    {
        fullName: 'Dr. Susan Lewis',
        email: 'doctor.lewis@hms.com',
        password: 'password123',
        role: USER_ROLES.DOCTOR,
        speciality: 'Pediatrics',
        hospitalName: 'Lakeside Medical Center'
    },
];

module.exports = users;