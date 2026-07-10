const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action:    { type: String, required: true },
    details:   { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    user: {
      name:  { type: String, default: null },
      email: { type: String, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
