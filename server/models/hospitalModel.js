const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, index: true, trim: true },
    address: { type: String, trim: true },
    settings: { type: mongoose.Schema.Types.Mixed }
}, {
    timestamps: true
});

// Middleware to handle cascading deletes
hospitalSchema.pre('remove', async function(next) {
    // This hook will be triggered when a hospital document is removed.
    // We need to delete all associated documents.
    try {
        await mongoose.model('User').deleteMany({ hospitalId: this._id });
        await mongoose.model('Patient').deleteMany({ hospitalId: this._id });
        await mongoose.model('Prescription').deleteMany({ hospitalId: this._id });
        // Appointments are linked via Users/Patients, so they will be removed implicitly
        // if the database relationships were strictly enforced. In MongoDB, we handle it here.
        next();
    } catch (error) {
        next(error);
    }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);
module.exports = Hospital;