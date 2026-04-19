const cron   = require('node-cron');
const logger = require('../utils/logger');
const User   = require('../models/User');
const Task   = require('../models/Task');
const { Habit, Notification, Pomodoro, Event } = require('../models/index');
const {
  sendTaskReminder,
  sendWeeklyReport,
  sendHabitStreak,
  sendPomoNotif,
  sendCalendarReminder,
  sendOverdueTask,
} = require('./sendEmail');

// ── Helper: create notification ──────────────────────────────
const createNotif = async (userId, type, category, title, message) => {
  try {
    await Notification.create({ user: userId, type, category, title, message });
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
};

// ── Helper: check quiet hours ────────────────────────────────
const isQuietHours = (user) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = (user.notifications?.quietStart || '22:00').split(':').map(Number);
  const [eh, em] = (user.notifications?.quietEnd   || '08:00').split(':').map(Number);
  const start = sh * 60 + sm;
  const end   = eh * 60 + em;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end; // overnight quiet hours
};

// ── Job 1: Task Due Reminders — runs every hour ───────────────
const taskReminderJob = cron.schedule('0 * * * *', async () => {
  logger.info('⏰ Cron: running task reminder job');
  try {
    const now  = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    const dueTasks = await Task.find({
      status:     { $ne: 'completed' },
      dueDate:    { $gte: now, $lte: in1h },
      isArchived: false,
    }).populate('user', 'firstName email notifications');

    for (const task of dueTasks) {
      if (!task.user) continue;
      const u = task.user;
      if (!u.notifications?.tasks) continue;

      await createNotif(u._id, 'task', 'tasks',
        `⏰ Task due soon: ${task.title}`,
        `Your task "${task.title}" is due within the next hour.`
      );

      if (!isQuietHours(u)) {
        await sendTaskReminder(u, task);
      }
    }

    logger.info(`⏰ Task reminders sent for ${dueTasks.length} tasks`);
  } catch (err) {
    logger.error(`Task reminder job failed: ${err.message}`);
  }
}, { scheduled: false });

// ── Job 2: Overdue Task Notifications — runs every hour ───────
const overdueTaskJob = cron.schedule('30 * * * *', async () => {
  logger.info('⚠️  Cron: running overdue task job');
  try {
    const now = new Date();

    const overdueTasks = await Task.find({
      status:              { $ne: 'completed' },
      dueDate:             { $lt: now },
      isArchived:          false,
      overdueNotifiedAt:   { $exists: false },
    }).populate('user', 'firstName email notifications');

    for (const task of overdueTasks) {
      if (!task.user) continue;
      const u = task.user;
      if (!u.notifications?.tasks) continue;

      await createNotif(u._id, 'task', 'tasks',
        `⚠️ Overdue: ${task.title}`,
        `Your task "${task.title}" is overdue. Please complete it as soon as possible.`
      );

      if (!isQuietHours(u)) {
        await sendOverdueTask(u, task);
      }

      // Mark as notified so we don't spam
      task.overdueNotifiedAt = now;
      await task.save({ validateBeforeSave: false });
    }

    logger.info(`⚠️  Overdue notifications sent for ${overdueTasks.length} tasks`);
  } catch (err) {
    logger.error(`Overdue task job failed: ${err.message}`);
  }
}, { scheduled: false });

// ── Job 3: Calendar Reminders — runs every 5 minutes ─────────
const calendarReminderJob = cron.schedule('*/5 * * * *', async () => {
  logger.info('📅 Cron: running calendar reminder job');
  try {
    const now = new Date();

    // Get all upcoming events in the next 25 hours
    const todayStr    = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString().split('T')[0];

    const events = await Event.find({
      date: { $gte: todayStr, $lte: tomorrowStr },
    }).populate('user', 'firstName email notifications');

    for (const event of events) {
      if (!event.user) continue;
      const u = event.user;
      if (!u.notifications?.calendar) continue;

      // Build event start datetime
      const [h, m]    = event.startTime.split(':').map(Number);
      const eventStart = new Date(`${event.date}T${event.startTime}:00`);
      const diffMin    = Math.round((eventStart - now) / 60000);

      const checks = [
        { key: 'oneDayBefore',    min: 1440, label: '1 day',     mins: 1440 },
        { key: 'oneHourBefore',   min: 60,   label: '1 hour',    mins: 60   },
        { key: 'thirtyMinBefore', min: 30,   label: '30 minutes',mins: 30   },
        { key: 'fifteenMinBefore',min: 15,   label: '15 minutes',mins: 15   },
        { key: 'fiveMinBefore',   min: 5,    label: '5 minutes', mins: 5    },
      ];

      for (const check of checks) {
        // Fire if within a 5 min window and not already sent
        if (
          diffMin <= check.min &&
          diffMin > check.min - 5 &&
          !event.remindersSet?.[check.key]
        ) {
          await createNotif(u._id, 'reminder', 'reminders',
            `📅 "${event.title}" in ${check.label}`,
            `Your event "${event.title}" starts at ${event.startTime} on ${event.date}.`
          );

          if (!isQuietHours(u)) {
            await sendCalendarReminder(u, event, check.mins);
          }

          event.remindersSet = { ...event.remindersSet?.toObject?.() || {}, [check.key]: true };
          await event.save();
        }
      }
    }

    logger.info(`📅 Calendar reminders processed`);
  } catch (err) {
    logger.error(`Calendar reminder job failed: ${err.message}`);
  }
}, { scheduled: false });

// ── Job 4: Daily Habit Check-In — runs at 8 PM every day ─────
const habitReminderJob = cron.schedule('0 20 * * *', async () => {
  logger.info('⭐ Cron: running habit reminder job');
  try {
    const today  = new Date().toISOString().split('T')[0];
    const habits = await Habit.find({ isActive: true }).populate('user', 'firstName email notifications');
    const usersNotified = new Set();

    for (const habit of habits) {
      if (!habit.user) continue;
      const u      = habit.user;
      const userId = u._id.toString();
      if (!u.notifications?.habits) continue;

      const doneToday = habit.completions?.some(c => c.date === today && c.status === 'done');
      if (doneToday || usersNotified.has(userId + habit._id)) continue;

      await createNotif(u._id, 'habit', 'reminders',
        `🔥 Don't break your streak!`,
        `You haven't logged "${habit.name}" yet today. Streak: ${habit.streak} days.`
      );

      const milestones = [7, 14, 21, 30, 60, 90];
      if (milestones.includes(habit.streak) && !isQuietHours(u)) {
        await sendHabitStreak(u, habit.name, habit.streak);
      }

      usersNotified.add(userId + habit._id);
    }

    logger.info(`⭐ Habit reminders processed`);
  } catch (err) {
    logger.error(`Habit reminder job failed: ${err.message}`);
  }
}, { scheduled: false });

// ── Job 5: Weekly Report — runs every Monday at 8 AM ─────────
const weeklyReportJob = cron.schedule('0 8 * * 1', async () => {
  logger.info('📊 Cron: running weekly report job');
  try {
    const users   = await User.find({ 'notifications.weeklyReport': true });
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    for (const user of users) {
      try {
        const [completedTasks, pomodoros, habits] = await Promise.all([
          Task.countDocuments({ user: user._id, status: 'completed', completedAt: { $gte: weekAgo } }),
          Pomodoro.find({ user: user._id, completed: true, type: 'focus', date: { $gte: weekAgoStr } }),
          Habit.find({ user: user._id, isActive: true }),
        ]);

        const focusMinutes = pomodoros.reduce((s, p) => s + (p.duration || 0), 0);
        const avgHabitRate = habits.length > 0
          ? Math.round(habits.reduce((sum, h) => {
              const done = h.completions.filter(c => c.date >= weekAgoStr && c.status === 'done').length;
              return sum + Math.min(100, done / 7 * 100);
            }, 0) / habits.length)
          : 0;

        const stats = {
          tasksCompleted: completedTasks,
          focusHours:     parseFloat((focusMinutes / 60).toFixed(1)),
          habitRate:      avgHabitRate,
          pomodoros:      pomodoros.length,
        };

        await sendWeeklyReport(user, stats);
        await createNotif(user._id, 'report', 'reminders',
          '📊 Your weekly report is ready',
          `Last week: ${stats.tasksCompleted} tasks, ${stats.focusHours}h focused, ${stats.habitRate}% habits.`
        );
      } catch (err) {
        logger.error(`Weekly report failed for user ${user._id}: ${err.message}`);
      }
    }

    logger.info(`📊 Weekly reports sent to ${users.length} users`);
  } catch (err) {
    logger.error(`Weekly report job failed: ${err.message}`);
  }
}, { scheduled: false });

// ── Job 6: Cleanup — runs daily at 3 AM ──────────────────────
const cleanupJob = cron.schedule('0 3 * * *', async () => {
  logger.info('🗑️  Cron: running cleanup job');
  try {
    const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const notifResult = await Notification.deleteMany({ read: true, createdAt: { $lt: thirtyDaysAgo } });
    const pomoResult  = await Pomodoro.deleteMany({ completed: true, createdAt: { $lt: ninetyDaysAgo } });

    logger.info(`🗑️  Cleanup: deleted ${notifResult.deletedCount} notifications, ${pomoResult.deletedCount} pomodoro sessions`);
  } catch (err) {
    logger.error(`Cleanup job failed: ${err.message}`);
  }
}, { scheduled: false });

// ── Start / Stop ──────────────────────────────────────────────
const startCronJobs = () => {
  if (process.env.NODE_ENV === 'test') return;

  taskReminderJob.start();
  overdueTaskJob.start();
  calendarReminderJob.start();
  habitReminderJob.start();
  weeklyReportJob.start();
  cleanupJob.start();

  logger.info('✅ Cron jobs started');
  logger.info('  - Task reminders:     every hour');
  logger.info('  - Overdue tasks:      every hour (30 min offset)');
  logger.info('  - Calendar reminders: every 5 minutes');
  logger.info('  - Habit reminders:    daily at 8 PM');
  logger.info('  - Weekly reports:     Mondays at 8 AM');
  logger.info('  - Cleanup:            daily at 3 AM');
};

const stopCronJobs = () => {
  taskReminderJob.stop();
  overdueTaskJob.stop();
  calendarReminderJob.stop();
  habitReminderJob.stop();
  weeklyReportJob.stop();
  cleanupJob.stop();
  logger.info('Cron jobs stopped');
};

module.exports = { startCronJobs, stopCronJobs };