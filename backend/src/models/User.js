const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, default: null },          // null for Google-only accounts
    role:       { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
    provider:   { type: String, default: 'local' },       // 'local' | 'google'
    googleId:   { type: String, default: null },
    avatarUrl:  { type: String, default: null },
    isApproved: { type: Boolean, default: true },         // instructors start false
    isSuspended:{ type: Boolean, default: false },
    phone:      { type: String, default: null },
    isVerified: { type: Boolean, default: false },         // true by default for Google logins, false for local
    otp:        { type: String, default: null },
    otpExpires: { type: Date, default: null },
    resetPasswordToken:   { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
