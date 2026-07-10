const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const {
  getProfile,
  getNotifications,
  markNotificationRead,
  getStats,
  getAdminTelemetry,
  getAdminUsers,
  updateUserStatus,
  getAdminAuditLogs,
  deleteUser
} = require('../controllers/userController');
const validateRequest = require('../middleware/validate');
const {
  userObjectIdParamSchema,
  updateUserStatusSchema,
} = require('../validations/userSchema');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, validateRequest(userObjectIdParamSchema), markNotificationRead);
router.get('/stats', protect, getStats);

router.get('/admin/telemetry', protect, requireRole('admin'), getAdminTelemetry);
router.get('/admin/users', protect, requireRole('admin'), getAdminUsers);
router.put('/admin/users/:id', protect, requireRole('admin'), validateRequest(updateUserStatusSchema), updateUserStatus);
router.delete('/admin/users/:id', protect, requireRole('admin'), validateRequest(userObjectIdParamSchema), deleteUser);
router.get('/admin/audit-logs', protect, requireRole('admin'), getAdminAuditLogs);

module.exports = router;
