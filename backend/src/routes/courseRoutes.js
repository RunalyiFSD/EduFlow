const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { videoUpload } = require('../middleware/upload');
const {
  getCourses,
  getCourseById,
  enroll,
  unenroll,
  updateProgress,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadVideo,
  setStudyGoal,
  toggleStudySession,
  getCourseEnrollments
} = require('../controllers/courseController');
const validateRequest = require('../middleware/validate');
const {
  objectIdParamSchema,
  createCourseSchema,
  updateCourseSchema,
  updateProgressSchema,
  setStudyGoalSchema,
  toggleStudySessionSchema,
} = require('../validations/courseSchema');

const router = express.Router();

// ── Static routes MUST come before /:id dynamic routes ──────────────
// Public catalog browsing (used by the welcome page for anonymous visitors)
router.get('/', getCourses);
router.post('/', protect, upload.single('coverImage'), validateRequest(createCourseSchema), createCourse);

// Video upload endpoint — declared before /:id to avoid Express matching
// "upload" as a course ObjectId
router.post('/upload/video', protect, videoUpload.single('video'), uploadVideo);

// ── Dynamic :id routes ───────────────────────────────────────────────
router.get('/:id', protect, validateRequest(objectIdParamSchema), getCourseById);
router.get('/:id/enrollments', protect, validateRequest(objectIdParamSchema), getCourseEnrollments);
router.put('/:id', protect, upload.single('coverImage'), validateRequest(updateCourseSchema), updateCourse);
router.delete('/:id', protect, validateRequest(objectIdParamSchema), deleteCourse);
router.post('/:id/enroll', protect, validateRequest(objectIdParamSchema), enroll);
router.post('/:id/unenroll', protect, validateRequest(objectIdParamSchema), unenroll);
router.put('/:id/progress', protect, validateRequest(updateProgressSchema), updateProgress);
router.put('/:id/goal', protect, validateRequest(setStudyGoalSchema), setStudyGoal);
router.post('/:id/goal/toggle', protect, validateRequest(toggleStudySessionSchema), toggleStudySession);

module.exports = router;
