const mongoose = require('mongoose');
const connectDB = require('./config/db');
const config = require('./config');

// Load Models
const User = require('./models/userModel');
const Hospital = require('./models/hospitalModel');
const Patient = require('./models/patientModel');
const Appointment = require('./models/appointmentModel');
const Visit = require('./models/visitModel');
const Prescription = require('./models/prescriptionModel');

// Load Data
const usersData = require('./data/users');
const hospitalsData = require('./data/hospitals');

// Connect to DB
connectDB();

// Function to import data
const importData = async () => {
    try {
        // Clear existing data
        await Prescription.deleteMany();
        await Visit.deleteMany();
        await Appointment.deleteMany();
        await Patient.deleteMany();
        await User.deleteMany();
        await Hospital.deleteMany();

        console.log('Cleared all collections...');

        // Insert hospitals
        const createdHospitals = await Hospital.insertMany(hospitalsData);
        console.log('Hospitals Imported!');

        // --- THIS IS THE FIX ---
        // We now create users one-by-one to ensure the pre-save hook for password hashing runs.

        // Map hospital names to their new MongoDB _id for easy lookup
        const hospitalMap = createdHospitals.reduce((acc, hospital) => {
            acc[hospital.name] = hospital._id;
            return acc;
        }, {});
        
        // Loop through the user data and create each user individually
        for (const userData of usersData) {
            const userToCreate = {
                fullName: userData.fullName,
                email: userData.email,
                // We pass the plain text password to the field that the pre-save hook is watching.
                // The hook in `userModel.js` will intercept this, hash it, and save the hash.
                hashedPassword: userData.password,
                role: userData.role,
                speciality: userData.speciality, // Add optional fields
                hospitalId: userData.hospitalName ? hospitalMap[userData.hospitalName] : null
            };
            // User.create() triggers 'save' middleware
            await User.create(userToCreate);
        }
        // -----------------------
        
        console.log('Users Imported!');

        console.log('\x1b[32m%s\x1b[0m', 'Data Successfully Imported!');
        process.exit();

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `Error: ${error.message}`);
        process.exit(1);
    }
};

// Function to destroy data (remains the same)
const destroyData = async () => {
    try {
        await Prescription.deleteMany();
        await Visit.deleteMany();
        await Appointment.deleteMany();
        await Patient.deleteMany();
        await User.deleteMany();
        await Hospital.deleteMany();

        console.log('\x1b[33m%s\x1b[0m', 'Data Successfully Destroyed!');
        process.exit();

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `Error: ${error.message}`);
        process.exit(1);
    }
};

// Command-line argument logic (remains the same)
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}