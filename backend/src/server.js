const app = require('./app');
const connectDB = require('./config/db');
const seedDatabase = require('./config/seed');
const { startWeeklyScheduler, initAllGoalReminders, startDailyGoalProgressScheduler } = require('./utils/scheduler');
const { PORT } = require('./config/env');

const start = async () => {
  await connectDB();
  await seedDatabase();
  startWeeklyScheduler();
  startDailyGoalProgressScheduler();
  await initAllGoalReminders();
  app.listen(PORT, () => {
    console.log(`EduFlow backend listening on http://localhost:${PORT}`);
  });
};

start();
