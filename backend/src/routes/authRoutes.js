const express = require('express');
const { 
  login, 
  register, 
  forgotPassword, 
  googleAuth, 
  registerAdmin, 
  googleAdminRegister,
  resetPassword
} = require('../controllers/authController');
const validateRequest = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  registerAdminSchema,
  googleAdminSchema,
} = require('../validations/authSchema');

const router = express.Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);
router.post('/google', validateRequest(googleAuthSchema), googleAuth);
router.post('/register-admin', validateRequest(registerAdminSchema), registerAdmin);
router.post('/google-admin', validateRequest(googleAdminSchema), googleAdminRegister);

module.exports = router;
