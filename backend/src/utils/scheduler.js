const cron = require('node-cron');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Map to store active user reminder alarms in memory (key: enrollmentId, value: node-cron task)
const activeReminders = new Map();

/**
 * Dynamically configures a cron alarm for a student's specific enrollment goal.
 */
const scheduleReminder = (enrollmentId, studyDays, studyTime, userId, courseTitle) => {
  // Cancel previous alarm if any exists
  cancelReminder(enrollmentId);

  if (!studyDays || studyDays.length === 0 || !studyTime) {
    return;
  }

  const [hours, minutes] = studyTime.split(':');

  const DAY_MAP = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };

  const mappedDays = studyDays
    .map(d => DAY_MAP[d])
    .filter(Boolean);

  if (mappedDays.length === 0) return;

  const daysCron = mappedDays.join(',');
  const cronExpression = `${minutes} ${hours} * * ${daysCron}`;

  const task = cron.schedule(cronExpression, async () => {
    try {
      const enrollment = await Enrollment.findById(enrollmentId).populate('user').populate('course');
      if (!enrollment || !enrollment.user) {
        console.log(`Reminder skipped: Enrollment ${enrollmentId} or student not found.`);
        return;
      }

      // 1. Send system internal notification
      await Notification.create({
        userId: enrollment.user._id,
        title: 'Study Reminder',
        message: `It's time to study! Work on your course: "${enrollment.course?.title || courseTitle}".`
      });

      // 2. Send email reminder
      if (enrollment.user.email) {
        sendEmail({
          to: enrollment.user.email,
          subject: `EduFlow Study Reminder: "${enrollment.course?.title || courseTitle}"`,
          text: `Hi ${enrollment.user.name},\n\nIt's time to study! This is your scheduled reminder to work on your course "${enrollment.course?.title || courseTitle}".\n\nKeep up your learning momentum!\n- The EduFlow Team`,
          html: `<p>Hi <strong>${enrollment.user.name}</strong>,</p>` +
                `<p>It's time to study! This is your scheduled reminder to work on your course: <strong>${enrollment.course?.title || courseTitle}</strong>.</p>` +
                `<p>Keep up your learning momentum!</p>` +
                `<p>Best regards,<br/>- The EduFlow Team</p>`
        }).catch(err => console.error('Failed to send goal reminder email:', err.message));
      }

      console.log(`Triggered study goal alarm for student ${enrollment.user.email} for "${enrollment.course?.title || courseTitle}".`);
    } catch (err) {
      console.error('❌ Error executing goal reminder alarm:', err.message);
    }
  });

  activeReminders.set(enrollmentId, task);
};

/**
 * Cancels a configured study goal cron alarm.
 */
const cancelReminder = (enrollmentId) => {
  if (activeReminders.has(enrollmentId)) {
    const task = activeReminders.get(enrollmentId);
    task.stop();
    activeReminders.delete(enrollmentId);
    console.log(`Cancelled reminder alarm for Enrollment ${enrollmentId}`);
  }
};

/**
 * Initializes all study goal reminder alarms from the database on startup.
 */
const initAllGoalReminders = async () => {
  console.log('Initializing all study goal reminder alarms from database...');
  try {
    const enrollments = await Enrollment.find({ "studyGoal": { $exists: true } }).populate('course');
    let count = 0;
    for (const enrollment of enrollments) {
      if (enrollment.studyGoal?.studyDays?.length > 0 && enrollment.studyGoal.studyTime) {
        scheduleReminder(
          String(enrollment._id),
          enrollment.studyGoal.studyDays,
          enrollment.studyGoal.studyTime,
          String(enrollment.user),
          enrollment.course?.title || 'your course'
        );
        count++;
      }
    }
    console.log(`Successfully initialized ${count} goal reminder alarms.`);
  } catch (err) {
    console.error('❌ Failed to initialize goal reminder alarms:', err.message);
  }
};

/**
 * Daily cron job at midnight to update weekly progress indices and mark missed days.
 */
const startDailyGoalProgressScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily study goal progress calculator...');
    try {
      const { initializeWeeklyProgress } = require('./goalHelper');
      const enrollments = await Enrollment.find({ "studyGoal": { $exists: true } });
      for (const enrollment of enrollments) {
        initializeWeeklyProgress(enrollment, new Date());
        enrollment.markModified('studyGoal');
        await enrollment.save();
      }
      console.log(`✅ Daily study goal progress updated for ${enrollments.length} enrollments.`);
    } catch (err) {
      console.error('❌ Daily progress scheduler encountered an error:', err.message);
    }
  });
  console.log('📅 EduFlow daily study goal progress scheduler initialized successfully (Cron: Midnight daily).');
};

/**
 * Weekly summary reports emailed to students (Legacy).
 */
const startWeeklyScheduler = () => {
  // Monday at 9:00 AM: '0 9 * * 1'
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly student learning progress scheduler...');
    try {
      const students = await User.find({ role: 'student', isVerified: true, isSuspended: false });
      
      for (const student of students) {
        const enrollments = await Enrollment.find({ user: student._id }).populate('course');
        const activeEnrollments = enrollments.filter(e => e.course);
        
        if (activeEnrollments.length === 0) continue;
        
        let reportText = `Hi ${student.name},\n\nHere is your weekly EduFlow learning progress summary:\n\n`;
        let reportHtml = `<p>Hi <strong>${student.name}</strong>,</p>` +
                         `<p>Here is your weekly learning progress summary from <strong>EduFlow</strong>:</p>` +
                         `<table border="1" cellpadding="8" style="border-collapse:collapse; width:100%; max-width:600px;">` +
                         `<thead><tr style="background-color:#f1f5f9;"><th>Course Title</th><th>Completion Progress</th><th>Status</th></tr></thead>` +
                         `<tbody>`;
        
        activeEnrollments.forEach(enr => {
          const status = enr.isCompleted ? 'Completed ✅' : 'In Progress 📖';
          reportText += `- ${enr.course.title}: ${enr.progressPercentage}% (${status})\n`;
          reportHtml += `<tr>` +
                        `<td><strong>${enr.course.title}</strong></td>` +
                        `<td align="center">${enr.progressPercentage}%</td>` +
                        `<td>${status}</td>` +
                        `</tr>`;
        });
        
        reportText += `\nKeep up the great work and continue learning on EduFlow!\n- The EduFlow Team`;
        reportHtml += `</tbody></table>` +
                      `<p>Keep up the great work and continue learning on EduFlow!</p>` +
                      `<p>Best regards,<br/>- The EduFlow Team</p>`;
        
        await sendEmail({
          to: student.email,
          subject: 'EduFlow: Your Weekly Learning Progress Summary',
          text: reportText,
          html: reportHtml
        });
      }
      
      console.log(`✅ Weekly progress reports emailed to ${students.length} students.`);
    } catch (err) {
      console.error('❌ Weekly progress scheduler encountered an error:', err.message);
    }
  });
  console.log('📅 EduFlow weekly learning progress scheduler initialized successfully (Cron: Monday 9:00 AM).');
};

module.exports = {
  startWeeklyScheduler,
  scheduleReminder,
  cancelReminder,
  initAllGoalReminders,
  startDailyGoalProgressScheduler
};
