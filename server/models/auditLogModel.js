const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String },
    entityId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed }
}, {
    timestamps: true // Adds createdAt (for timestamp) and updatedAt
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;