const express = require('express');
const { 
  login, 
  register, 
  forgotPassword, 
  googleAuth, 
  registerAdmin, 
  googleAdminRegister,
  verifyOtp,
  resendOtp,
  resetPassword
} = require('../controllers/authController');
const validateRequest = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resetPasswordSchema,
  googleAuthSchema,
  registerAdminSchema,
  googleAdminSchema,
} = require('../validations/authSchema');

const router = express.Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateRequest(resendOtpSchema), resendOtp);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);
router.post('/google', validateRequest(googleAuthSchema), googleAuth);
router.post('/register-admin', validateRequest(registerAdminSchema), registerAdmin);
router.post('/google-admin', validateRequest(googleAdminSchema), googleAdminRegister);

module.exports = router;
