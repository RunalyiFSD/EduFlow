const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');
const { JWT_SECRET, GOOGLE_CLIENT_ID, ADMIN_REGISTER_SECRET, CLIENT_ORIGIN } = require('../config/env');

const generateToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl || null,
  isApproved: user.isApproved,
  isSuspended: user.isSuspended
});

const logActivity = async (action, details, user = null) => {
  await AuditLog.create({
    action,
    details,
    user: user ? { name: user.name, email: user.email } : null
  });
};

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    throw new ApiError(401, 'Invalid email or password combination.');
  }
  if (user.isSuspended) throw new ApiError(403, 'This account has been suspended by an administrator.');
  if (!user.isVerified) {
    throw new ApiError(403, 'Your account phone number is not verified. Please register again or verify your OTP.');
  }

  await logActivity('USER_LOGIN', `User ${user.email} successfully logged in.`, user);

  res.json({ token: generateToken(user._id), user: sanitizeUser(user) });
});

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    if (user.isVerified) {
      throw new ApiError(409, 'An account with this email already exists.');
    }
    // Update existing unverified user info
    user.name = name;
    user.password = bcrypt.hashSync(password, 10);
    user.role = role;
    user.phone = phone;
    user.isApproved = role !== 'instructor';
  } else {
    const isApproved = role !== 'instructor';
    user = new User({
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      role,
      phone,
      isApproved,
      isVerified: false
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  await user.save();

  await sendSMS({
    to: phone,
    body: `Your EduFlow verification OTP is ${otp}. It will expire in 10 minutes.`
  });

  await logActivity('USER_REGISTER_OTP_SENT', `New user registered: ${email} as ${role}. OTP sent to ${phone}.`, user);

  if (role === 'instructor') {
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'Pending Instructor Approval',
        message: `Instructor ${name} (${email}) has registered and requires administrator review.`
      });
    }
  }

  res.status(201).json({ requiresVerification: true, email: user.email, message: 'OTP sent to mobile number.' });
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'No account found with this email address.');

  // Generate recovery token and set 1-hour expiration
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  await user.save();

  const resetUrl = `${CLIENT_ORIGIN}/reset-password/${token}`;

  await sendEmail({
    to: user.email,
    subject: 'EduFlow Password Reset Request',
    text: `You are receiving this email because you (or someone else) requested a password reset for your account.\n\n` +
          `Please click on the following link, or paste this into your browser to complete the process within 10 minutes:\n\n` +
          `${resetUrl}\n\n` +
          `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    html: `<p>You are receiving this because you (or someone else) requested a password reset for your account.</p>` +
          `<p>Please click the link below to reset your password:</p>` +
          `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
          `<p>This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>`
  });

  await logActivity('PASSWORD_RESET_REQUEST', `Password recovery requested for ${email}.`, user);
  res.json({ success: true, message: 'Password reset link sent to your email.' });
});

// POST /api/auth/google
exports.googleAuth = asyncHandler(async (req, res) => {
  const { credential, defaultRole = 'student' } = req.body;
  if (!GOOGLE_CLIENT_ID) throw new ApiError(500, 'Google OAuth is not configured on the server.');

  let payload;
  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google token verification failed. Please try again.');
  }

  const { email, name, picture, sub: googleId } = payload;
  if (!email) throw new ApiError(400, 'Google account did not return an email address.');

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (user.isSuspended) throw new ApiError(403, 'This account has been suspended.');
    let updated = false;
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatarUrl = user.avatarUrl || picture;
      updated = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      updated = true;
    }
    if (updated) {
      await user.save();
    }
    await logActivity('USER_LOGIN', `${user.email} logged in via Google OAuth.`, user);
  } else {
    const role = ['student', 'instructor'].includes(defaultRole) ? defaultRole : 'student';
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      provider: 'google',
      googleId,
      avatarUrl: picture,
      role,
      isApproved: role !== 'instructor',
      isVerified: true
    });

    await logActivity('USER_REGISTER', `New user registered via Google: ${email} as ${role}.`, user);

    if (role === 'instructor') {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        await Notification.create({
          userId: admin._id,
          title: 'Pending Instructor Approval',
          message: `Instructor ${user.name} (${email}) registered via Google and requires review.`
        });
      }
    }
  }

  res.json({ token: generateToken(user._id), user: sanitizeUser(user) });
});

// POST /api/auth/register-admin
exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, adminSecret } = req.body;
  if (adminSecret !== ADMIN_REGISTER_SECRET) {
    throw new ApiError(403, 'Invalid admin secret key. Registration denied.');
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role: 'admin',
    isApproved: true,
    isVerified: true
  });

  await logActivity('ADMIN_REGISTER', `New admin account created: ${email}.`, user);

  res.status(201).json({ token: generateToken(user._id), user: sanitizeUser(user) });
});

// POST /api/auth/google-admin
exports.googleAdminRegister = asyncHandler(async (req, res) => {
  const { credential, adminSecret } = req.body;
  if (adminSecret !== ADMIN_REGISTER_SECRET) throw new ApiError(403, 'Invalid admin secret key. Registration denied.');
  if (!GOOGLE_CLIENT_ID) throw new ApiError(500, 'Google OAuth is not configured on the server.');

  let payload;
  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google token verification failed. Please try again.');
  }

  const { email, name, picture, sub: googleId } = payload;
  if (!email) throw new ApiError(400, 'Google account did not return an email address.');

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (user.isSuspended) throw new ApiError(403, 'This account has been suspended.');
    if (user.role === 'admin') {
      await logActivity('ADMIN_LOGIN', `Admin ${email} signed in via Google OAuth.`, user);
    } else {
      user.role = 'admin';
      user.isApproved = true;
      user.googleId = user.googleId || googleId;
      user.avatarUrl = user.avatarUrl || picture;
      user.isVerified = true;
      await user.save();
      await logActivity('ADMIN_REGISTER', `Account ${email} upgraded to admin via Google OAuth.`, user);
    }
  } else {
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      provider: 'google',
      googleId,
      avatarUrl: picture,
      role: 'admin',
      isApproved: true,
      isVerified: true
    });
    await logActivity('ADMIN_REGISTER', `New admin account created via Google OAuth: ${email}.`, user);
  }

  res.status(201).json({ token: generateToken(user._id), user: sanitizeUser(user) });
});

// POST /api/auth/verify-otp
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found.');

  if (user.isVerified) {
    return res.status(200).json({
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  }

  if (user.otp !== otp || user.otpExpires < Date.now()) {
    throw new ApiError(400, 'Invalid or expired OTP.');
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  await logActivity('USER_OTP_VERIFIED', `User ${user.email} verified account via OTP.`, user);

  res.status(200).json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
});

// POST /api/auth/resend-otp
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.isVerified) throw new ApiError(400, 'Account is already verified.');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendSMS({
    to: user.phone,
    body: `Your EduFlow verification OTP is ${otp}. It will expire in 10 minutes.`
  });

  await logActivity('USER_OTP_RESENT', `OTP resent to ${user.email}.`, user);

  res.json({ success: true, message: 'OTP resent successfully.' });
});

// POST /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired.');
  }

  user.password = bcrypt.hashSync(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'EduFlow Password Reset Successful',
    text: `Hello ${user.name},\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
  });

  await logActivity('PASSWORD_RESET_SUCCESS', `Password successfully reset for ${user.email}.`, user);

  res.json({ success: true, message: 'Password has been reset successfully.' });
});
