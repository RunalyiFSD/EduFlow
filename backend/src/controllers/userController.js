const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { initializeWeeklyProgress } = require('../utils/goalHelper');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl || null,
  isApproved: user.isApproved,
  isSuspended: user.isSuspended
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ notifications });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

exports.getStats = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role === 'student') {
    const enrollments = await Enrollment.find({ user: user._id })
      .populate('course');

    for (const enrollment of enrollments) {
      if (enrollment.studyGoal && enrollment.studyGoal.studyDays?.length > 0) {
        const oldProgress = JSON.stringify(enrollment.studyGoal.weeklyProgress);
        const oldIndex = enrollment.studyGoal.currentDayIndex;
        initializeWeeklyProgress(enrollment, new Date());
        if (JSON.stringify(enrollment.studyGoal.weeklyProgress) !== oldProgress || enrollment.studyGoal.currentDayIndex !== oldIndex) {
          enrollment.markModified('studyGoal');
          await enrollment.save();
        }
      }
    }

    const valid = enrollments
      .filter((e) => e.course)           // drop orphaned enrollments
      .map((e) => {
        const eObj = e.toObject();
        return {
          ...eObj,
          _id:    String(eObj._id),
          user:   String(eObj.user),
          course: {
            ...eObj.course,
            _id: String(eObj.course._id),
          },
        };
      });

    return res.json({
      stats: {
        enrolledCoursesCount:   valid.length,
        completedCoursesCount:  valid.filter((e) => e.isCompleted).length,
        activeEnrollments:      valid,
      },
    });
  }

  if (user.role === 'instructor') {
    const courses = await Course.find({ 'instructor.id': user._id });
    const ids = courses.map((c) => c._id);
    const enrollments = await Enrollment.find({ course: { $in: ids } });
    return res.json({
      stats: {
        myCoursesCount: courses.length,
        totalStudentsEnrolled: enrollments.length,
        completionsCount: enrollments.filter((e) => e.isCompleted).length
      }
    });
  }

  res.json({ stats: null });
});

exports.getAdminTelemetry = asyncHandler(async (req, res) => {
  const [users, courses, enrollments] = await Promise.all([
    User.find(),
    Course.find(),
    Enrollment.find().populate('course')
  ]);

  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);

  res.json({
    telemetry: {
      totalUsers: users.length,
      totalRevenue,
      coursesCount: courses.length,
      enrollmentsCount: enrollments.length,
      studentsCount: users.filter((u) => u.role === 'student').length,
      instructorsCount: users.filter((u) => u.role === 'instructor').length
    }
  });
});

exports.getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ users });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const adminUser = req.user;

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin' && updates.isSuspended) {
    throw new ApiError(403, 'Cannot suspend another administrator account.');
  }

  const allowedFields = ['isApproved', 'isSuspended', 'role'];
  allowedFields.forEach((f) => { if (updates[f] !== undefined) user[f] = updates[f]; });
  await user.save();

  await AuditLog.create({
    action: 'ADMIN_UPDATE_USER_STATUS',
    details: `Updated status for user ${user.email}: ${JSON.stringify(updates)}`,
    user: { name: adminUser.name, email: adminUser.email }
  });

  if (updates.isApproved && user.role === 'instructor') {
    await Notification.create({
      userId: user._id,
      title: 'Profile Approved',
      message: 'Your instructor account has been approved. You can now publish courses.'
    });
  }

  res.json({ user: await User.findById(id).select('-password') });
});

exports.getAdminAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 });
  res.json({ logs });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminUser = req.user;

  if (id === String(adminUser._id)) {
    throw new ApiError(400, 'Cannot delete your own administrator account.');
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');

  // Perform cascading deletes based on user roles
  if (user.role === 'student') {
    await Enrollment.deleteMany({ user: id });
  } else if (user.role === 'instructor') {
    const courses = await Course.find({ 'instructor.id': id });
    const courseIds = courses.map((c) => c._id);
    await Enrollment.deleteMany({ course: { $in: courseIds } });
    await Course.deleteMany({ 'instructor.id': id });
  }

  await Notification.deleteMany({ userId: id });
  await User.findByIdAndDelete(id);

  await AuditLog.create({
    action: 'ADMIN_DELETE_USER',
    details: `Deleted user ${user.email} (Role: ${user.role}, Name: ${user.name})`,
    user: { name: adminUser.name, email: adminUser.email }
  });

  res.json({ success: true, message: `User "${user.name}" has been deleted successfully.` });
});
