const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const mongoose = require('mongoose');
const { initializeWeeklyProgress } = require('../utils/goalHelper');
const { scheduleReminder, cancelReminder } = require('../utils/scheduler');

const log = async (action, details, user) => {
  await AuditLog.create({ action, details, user: user ? { name: user.name, email: user.email } : null });
};



exports.getCourses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';
  if (req.query.instructor)                filter['instructor.id'] = req.query.instructor;
  if (req.query.category)                  filter.category = { $regex: req.query.category, $options: 'i' };

  const courses = await Course.find(filter).lean();

  // Ensure _id is always a plain string so frontend comparisons work reliably
  const serialized = courses.map((c) => ({
    ...c,
    _id: String(c._id),
    ...(c.instructor?.id ? { instructor: { ...c.instructor, id: String(c.instructor.id) } } : {}),
  }));

  res.json({ courses: serialized });
});

exports.getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const enrollmentDoc = await Enrollment.findOne({ user: req.user._id, course: course._id });
  if (enrollmentDoc && enrollmentDoc.studyGoal && enrollmentDoc.studyGoal.studyDays?.length > 0) {
    const oldProgress = JSON.stringify(enrollmentDoc.studyGoal.weeklyProgress);
    const oldIndex = enrollmentDoc.studyGoal.currentDayIndex;
    initializeWeeklyProgress(enrollmentDoc, new Date());
    if (JSON.stringify(enrollmentDoc.studyGoal.weeklyProgress) !== oldProgress || enrollmentDoc.studyGoal.currentDayIndex !== oldIndex) {
      enrollmentDoc.markModified('studyGoal');
      await enrollmentDoc.save();
    } 
  }

  const enrollment = enrollmentDoc ? enrollmentDoc.toObject() : null;

  // Serialize all ObjectId fields to strings so the frontend can do reliable === comparisons
  const serializedCourse = {
    ...course,
    _id: String(course._id),
    instructor: course.instructor
      ? { ...course.instructor, id: String(course.instructor.id) }
      : course.instructor,
    modules: (course.modules || []).map((m) => ({ ...m, _id: String(m._id) })),
  };

  const serializedEnrollment = enrollment
    ? {
        ...enrollment,
        _id: String(enrollment._id),
        user: String(enrollment.user),
        course: String(enrollment.course),
        // completedLessons are module ObjectIds — stringify so includes() works in the frontend
        completedLessons: (enrollment.completedLessons || []).map(String),
      }
    : null;

  res.json({ course: serializedCourse, enrollment: serializedEnrollment });
});

exports.enroll = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const existing = await Enrollment.findOne({ user: req.user._id, course: course._id });
  if (existing) throw new ApiError(409, 'You are already enrolled in this course.');

  const enrollment = await Enrollment.create({ user: req.user._id, course: course._id });
  await log('COURSE_ENROLL', `User ${req.user.email} enrolled in "${course.title}"`, req.user);

  // Send notifications in the background
  let instructorEmail = null;
  if (course.instructor?.id) {
    User.findById(course.instructor.id).then((instructorUser) => {
      if (instructorUser && instructorUser.email) {
        sendEmail({
          to: instructorUser.email,
          subject: `New Student Enrolled: ${course.title}`,
          text: `Hi ${course.instructor.name || 'Educator'},\n\nStudent ${req.user.name} (${req.user.email}) has enrolled in your course "${course.title}".\n\nBest regards,\n- The EduFlow Team`,
          html: `<p>Hi <strong>${course.instructor.name || 'Educator'}</strong>,</p>` +
                `<p>A new student has enrolled in your course: <strong>${course.title}</strong>.</p>` +
                `<p>Student Details:<br/>` +
                `- Name: ${req.user.name}<br/>` +
                `- Email: ${req.user.email}</p>` +
                `<p>Best regards,<br/>- The EduFlow Team</p>`
        }).catch(err => console.error('Failed to send instructor enrollment email:', err.message));
      }
    }).catch(err => console.error('Failed to retrieve instructor for enrollment email:', err.message));
  }

  sendEmail({
    to: req.user.email,
    subject: `Course Enrollment Confirmation: ${course.title}`,
    text: `Hi ${req.user.name},\n\nYou have successfully enrolled in the course "${course.title}".\n\nHappy learning!\n- The EduFlow Team`,
    html: `<p>Hi <strong>${req.user.name}</strong>,</p>` +
          `<p>You have successfully enrolled in the course: <strong>${course.title}</strong>.</p>` +
          `<p>Log in to your dashboard to track your progress and complete modules.</p>` +
          `<p>Happy learning!<br/>- The EduFlow Team</p>`
  }).catch(err => console.error('Failed to send student enrollment email:', err.message));

  const enrollmentObj = enrollment.toObject();
  res.status(201).json({
    enrollment: {
      ...enrollmentObj,
      _id:    String(enrollmentObj._id),
      user:   String(enrollmentObj.user),
      course: { ...course, _id: String(course._id) },
    },
  });
});

exports.unenroll = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
  if (!enrollment) throw new ApiError(404, 'You are not enrolled in this course.');

  // If there's a scheduled study goal reminder for this enrollment, cancel it
  const { cancelReminder } = require('../utils/scheduler');
  cancelReminder(String(enrollment._id));

  // Delete the enrollment
  await Enrollment.deleteOne({ _id: enrollment._id });

  await log('COURSE_UNENROLL', `User ${req.user.email} unenrolled from "${course.title}"`, req.user);

  res.json({ message: 'Successfully unenrolled from course.' });
});

exports.updateProgress = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found.');

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
  if (!enrollment) throw new ApiError(404, 'Enrollment record not found.');

  const completedLessons = Array.isArray(req.body.completedLessons) ? req.body.completedLessons : [];
  const total = course.modules?.length || 0;
  const progressPercentage = total > 0 ? Math.round((completedLessons.length / total) * 100) : 0;
  const wasCompleted = enrollment.isCompleted;
  const isCompleted = progressPercentage === 100;

  enrollment.completedLessons = completedLessons;
  enrollment.progressPercentage = progressPercentage;
  enrollment.isCompleted = isCompleted;
  if (isCompleted && !wasCompleted) enrollment.completedAt = new Date();
  await enrollment.save();

  await log('PROGRESS_UPDATE', `User ${req.user.email} updated progress on "${course.title}" to ${progressPercentage}%`, req.user);
  const enrollmentObj = enrollment.toObject();
  res.json({
    enrollment: {
      ...enrollmentObj,
      _id: String(enrollmentObj._id),
      user: String(enrollmentObj.user),
      course: String(enrollmentObj.course),
      completedLessons: (enrollmentObj.completedLessons || []).map(String),
    },
  });
});

exports.createCourse = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.role !== 'instructor') throw new ApiError(403, 'Only instructors can author courses.');
  if (!user.isApproved) throw new ApiError(403, 'Your account requires admin approval before creating courses.');

  const { title, description, category, level, price, modules } = req.body;

  const coverImageUrl = req.file
    ? req.file.path  // Cloudinary returns full HTTPS URL in req.file.path
    : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';

  // Generate the ObjectId upfront so we can return it immediately as a string
  const newId = new mongoose.Types.ObjectId();

  const course = await Course.create({
    _id: newId,
    title, description, category, level, price, coverImageUrl, modules,
    instructor: { id: user._id, name: user.name },
    isPublished: true
  });

  await log('COURSE_CREATE', `Instructor ${user.email} created course: ${title} [id: ${newId}]`, user);

  // Return a plain object with _id guaranteed to be a string
  const courseObj = course.toObject();
  res.status(201).json({
    course: {
      ...courseObj,
      _id: String(courseObj._id),
      instructor: {
        ...courseObj.instructor,
        id: String(courseObj.instructor?.id)
      },
      modules: courseObj.modules.map(m => ({ ...m, _id: String(m._id) }))
    }
  });
});

exports.updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found.');

  if (req.user.role !== 'admin' && String(course.instructor?.id) !== String(req.user._id)) {
    throw new ApiError(403, 'Unauthorized course modification.');
  }

  const { title, description, category, level, price, isPublished, modules } = req.body;
  if (title !== undefined)       course.title = title;
  if (description !== undefined) course.description = description;
  if (category !== undefined)    course.category = category;
  if (level !== undefined)       course.level = level;
  if (price !== undefined)       course.price = price;
  if (isPublished !== undefined) course.isPublished = isPublished;
  if (modules !== undefined)     course.modules = modules;
  if (req.file) course.coverImageUrl = req.file.path; // Cloudinary full URL

  await course.save();
  await log('COURSE_UPDATE', `Course "${course.title}" updated.`, req.user);
  const updatedCourse = course.toObject();
  res.json({
    course: {
      ...updatedCourse,
      _id: String(updatedCourse._id),
      instructor: updatedCourse.instructor
        ? { ...updatedCourse.instructor, id: String(updatedCourse.instructor.id) }
        : updatedCourse.instructor,
      modules: (updatedCourse.modules || []).map((m) => ({ ...m, _id: String(m._id) })),
    },
  });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found.');

  if (req.user.role !== 'admin' && String(course.instructor?.id) !== String(req.user._id)) {
    throw new ApiError(403, 'Unauthorized course deletion.');
  }

  await Course.findByIdAndDelete(req.params.id);
  await Enrollment.deleteMany({ course: req.params.id });

  await log('COURSE_DELETE', `Course "${course.title}" was deleted.`, req.user);
  res.json({ success: true });
});

// Upload a video to Cloudinary and return its URL
exports.uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No video file provided.');
  res.json({ url: req.file.path, publicId: req.file.filename });
});

exports.setStudyGoal = asyncHandler(async (req, res) => {
  const { studyDays, studyTime, duration } = req.body;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.id }).populate('course');
  if (!enrollment) throw new ApiError(404, 'Enrollment not found for this course.');

  enrollment.studyGoal = {
    studyDays: studyDays || [],
    studyTime: studyTime || '',
    duration: duration || '',
    receiveWhatsapp: false,
    completedDates: enrollment.studyGoal?.completedDates || []
  };

  // Populate weeklyProgress and currentDayIndex based on current system time
  initializeWeeklyProgress(enrollment, new Date());

  await enrollment.save();
  await log('COURSE_GOAL_SET', `User ${req.user.email} set study goal for course "${enrollment.course?.title || req.params.id}"`, req.user);

  // Dynamically configure alarm
  if (studyDays && studyDays.length > 0 && studyTime) {
    scheduleReminder(
      String(enrollment._id),
      studyDays,
      studyTime,
      String(req.user._id),
      enrollment.course?.title || 'your course',
      false
    );
  } else {
    cancelReminder(String(enrollment._id));
  }

  res.json({
    success: true,
    studyGoal: enrollment.studyGoal
  });
});

exports.toggleStudySession = asyncHandler(async (req, res) => {
  const { date } = req.body; // format 'YYYY-MM-DD'
  const targetDate = date || new Date().toLocaleDateString('en-CA');

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.id }).populate('course');
  if (!enrollment) throw new ApiError(404, 'Enrollment not found for this course.');

  if (!enrollment.studyGoal) {
    enrollment.studyGoal = {
      studyDays: [],
      studyTime: '',
      duration: '',
      receiveWhatsapp: false,
      completedDates: [],
      weeklyProgress: ['pending', 'pending', 'pending', 'pending', 'pending', 'pending'],
      currentDayIndex: 0
    };
  }

  const completedDates = enrollment.studyGoal.completedDates || [];
  const index = completedDates.indexOf(targetDate);
  let checkedIn = false;

  if (index === -1) {
    completedDates.push(targetDate);
    checkedIn = true;
    await log('COURSE_GOAL_CHECKIN', `User ${req.user.email} checked in for study session on ${targetDate}`, req.user);
  } else {
    completedDates.splice(index, 1);
    await log('COURSE_GOAL_UNCHECKIN', `User ${req.user.email} removed study session checkin for ${targetDate}`, req.user);
  }

  enrollment.studyGoal.completedDates = completedDates;
  
  // Recalculate weeklyProgress and currentDayIndex based on current time
  initializeWeeklyProgress(enrollment, new Date());

  enrollment.markModified('studyGoal');
  await enrollment.save();

  res.json({
    success: true,
    studyGoal: enrollment.studyGoal
  });
});

exports.getCourseEnrollments = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  if (req.user.role !== 'admin' && String(course.instructor?.id) !== String(req.user._id)) {
    throw new ApiError(403, 'Unauthorized access to course enrollment metrics.');
  }

  const enrollments = await Enrollment.find({ course: req.params.id })
    .populate('user', 'name email avatarUrl')
    .lean();

  const formatted = enrollments.map((e) => ({
    enrollmentId: String(e._id),
    student: e.user ? {
      id: String(e.user._id),
      name: e.user.name,
      email: e.user.email,
      avatarUrl: e.user.avatarUrl
    } : null,
    progressPercentage: e.progressPercentage,
    isCompleted: e.isCompleted,
    completedAt: e.completedAt,
    enrolledAt: e.enrolledAt,
    studyGoal: e.studyGoal
  }));

  res.json({ enrollments: formatted });
});