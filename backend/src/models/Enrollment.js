const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    course:             { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons:   [{ type: mongoose.Schema.Types.ObjectId }], // module _ids
    progressPercentage: { type: Number, default: 0 },
    isCompleted:        { type: Boolean, default: false },
    completedAt:        { type: Date, default: null },
    enrolledAt:         { type: Date, default: Date.now },
    studyGoal: {
      studyDays:       [{ type: String }],
      studyTime:       { type: String, default: '' },
      duration:        { type: String, default: '' },
      receiveWhatsapp: { type: Boolean, default: false },
      completedDates:  [{ type: String }], // Array of strings like YYYY-MM-DD
      weeklyProgress:  {
        type: [String],
        enum: ['pending', 'completed', 'missed'],
        default: ['pending', 'pending', 'pending', 'pending', 'pending', 'pending']
      },
      currentDayIndex: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// One enrollment per user-course pair
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
