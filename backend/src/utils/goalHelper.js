/**
 * Calculates and updates weekly progress and currentDayIndex for an enrollment's study goal.
 * @param {Object} enrollment - Mongoose Enrollment document
 * @param {Date} [today] - Current date reference
 */
const initializeWeeklyProgress = (enrollment, today = new Date()) => {
  if (!enrollment.studyGoal) {
    return; // No study goal configured
  }

  const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  // Start of week date (Monday at 00:00:00 local time)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const completedDates = enrollment.studyGoal.completedDates || [];
  const weeklyProgress = [];

  // Monday to Saturday are indices 0 to 5
  for (let i = 0; i < 6; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    const dayDateStr = dayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD local format

    if (completedDates.includes(dayDateStr)) {
      weeklyProgress.push('completed');
    } else {
      const compareDate = new Date(today);
      compareDate.setHours(0, 0, 0, 0);

      // If the day is strictly in the past, it's missed
      if (dayDate < compareDate) {
        weeklyProgress.push('missed');
      } else {
        weeklyProgress.push('pending');
      }
    }
  }

  let currentDayIndex = currentDay === 0 ? -1 : currentDay - 1; // 0 for Mon, 5 for Sat, -1 for Sun
  if (currentDayIndex > 5) currentDayIndex = -1;

  enrollment.studyGoal.weeklyProgress = weeklyProgress;
  enrollment.studyGoal.currentDayIndex = currentDayIndex;
};

module.exports = { initializeWeeklyProgress };
