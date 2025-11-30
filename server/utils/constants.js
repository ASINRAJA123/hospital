const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    MEDICAL_SHOP: 'medical_shop',
};

const APPOINTMENT_STATUS = {
    SCHEDULED: 'Scheduled',
    IN_CONSULTATION: 'In-Consultation',
    COMPLETED: 'Completed',
    NO_SHOW: 'No-Show',
    CANCELLED: 'Cancelled',
};

const PRESCRIPTION_STATUS = {
    CREATED: 'Created',
    PARTIALLY_DISPENSED: 'Partially Dispensed',
    FULLY_DISPENSED: 'Fully Dispensed',
    NOT_AVAILABLE: 'Not Available',
};

const DISPENSE_LINE_STATUS = {
    GIVEN: 'Given',
    PARTIALLY_GIVEN: 'Partially Given',
    NOT_GIVEN: 'Not Given',
    SUBSTITUTED: 'Substituted',
};

module.exports = {
    USER_ROLES,
    USER_ROLE_LIST: Object.values(USER_ROLES),
    APPOINTMENT_STATUS,
    APPOINTMENT_STATUS_LIST: Object.values(APPOINTMENT_STATUS),
    PRESCRIPTION_STATUS,
    PRESCRIPTION_STATUS_LIST: Object.values(PRESCRIPTION_STATUS),
    DISPENSE_LINE_STATUS,
    DISPENSE_LINE_STATUS_LIST: Object.values(DISPENSE_LINE_STATUS),
};