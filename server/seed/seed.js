/**
 * TimeWise Database Seeder
 *
 * Usage:
 *   node seed/seed.js              — seed the database
 *   node seed/seed.js --destroy    — wipe all data
 *   node seed/seed.js --fresh      — wipe then seed
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const path     = require('path');
const bcrypt   = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User   = require('../models/User');
const Task   = require('../models/Task');
const { Event, Habit, Pomodoro, Notification } = require('../models/index');

// ── Colors ───────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
};
const log  = (msg) => console.log(c.green + '✓ ' + c.reset + msg);
const warn = (msg) => console.log(c.yellow + '⚠ ' + c.reset + msg);
const err  = (msg) => console.log(c.red + '✗ ' + c.reset + msg);
const info = (msg) => console.log(c.cyan + '→ ' + c.reset + msg);

// ── Demo users ────────────────────────────────────────────────
const DEMO_USERS = [
  {
    firstName: 'Aryan',
    lastName:  'Sharma',
    email:     'aryan@timewise.io',
    password:  'password123',
    plan:      'pro',
    settings: {
      timezone:      'Asia/Kolkata',
      workStartTime: '09:00',
      workEndTime:   '18:00',
      pomoDuration:  25,
      shortBreak:    5,
      longBreak:     15,
      dailyPomoGoal: 8,
    },
    notifications: {
      pomodoro: true, tasks: true, habits: true,
      calendar: true, weeklyReport: true,
    },
  },
  {
    firstName: 'Priya',
    lastName:  'Patel',
    email:     'priya@timewise.io',
    password:  'password123',
    plan:      'free',
    settings: {
      timezone:      'Asia/Kolkata',
      workStartTime: '10:00',
      workEndTime:   '19:00',
      pomoDuration:  50,
      shortBreak:    10,
      longBreak:     30,
      dailyPomoGoal: 6,
    },
  },
];

// ── Seed data generators ──────────────────────────────────────
const today = new Date();
const dStr  = (d) => d.toISOString().split('T')[0];
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

const generateTasks = (userId) => [
  { user: userId, title: 'Review design system PR', category: 'Work',     priority: 'High',   status: 'completed',   dueDate: addDays(-1),  dueTime: '09:00', estimatedHours: 1,   completedAt: addDays(-1) },
  { user: userId, title: 'Morning workout — 30 min',category: 'Health',   priority: 'Medium', status: 'completed',   dueDate: today,         dueTime: '07:00', estimatedHours: 0.5, completedAt: today },
  { user: userId, title: 'Write weekly stakeholder report', category: 'Work', priority: 'High', status: 'in_progress', dueDate: today, dueTime: '14:00', estimatedHours: 2,
    subtasks: [{ title: 'Gather sprint metrics', done: true }, { title: 'List blockers', done: true }, { title: 'Write narrative summary', done: false }, { title: 'Format slides', done: false }] },
  { user: userId, title: 'Study — Chapter 7: Graph Algorithms', category: 'Study', priority: 'Medium', status: 'pending', dueDate: today, dueTime: '16:00', estimatedHours: 2 },
  { user: userId, title: 'Call with Priya re: project scope',   category: 'Work',  priority: 'Low',    status: 'pending', dueDate: today, dueTime: '17:30', estimatedHours: 0.75 },
  { user: userId, title: 'Implement search feature — backend API', category: 'Work', priority: 'High', status: 'in_progress', dueDate: addDays(2), estimatedHours: 4 },
  { user: userId, title: 'Design system documentation', category: 'Work',   priority: 'Medium', status: 'pending', dueDate: addDays(1), estimatedHours: 3 },
  { user: userId, title: 'Prepare DSA mock interview questions', category: 'Study', priority: 'Low', status: 'pending', dueDate: addDays(3), estimatedHours: 2 },
  { user: userId, title: 'Quarterly performance self-review',  category: 'Work',  priority: 'High', status: 'pending', dueDate: addDays(5), estimatedHours: 1.5 },
  { user: userId, title: 'Read Atomic Habits chapter 5-8',     category: 'Study', priority: 'Low',  status: 'pending', dueDate: addDays(2), estimatedHours: 1 },
];

const generateEvents = (userId) => [
  { user: userId, title: 'Team Standup',       date: dStr(today),       startTime: '09:00', endTime: '09:30', category: 'accent', location: 'Google Meet' },
  { user: userId, title: 'Sprint Review',      date: dStr(today),       startTime: '10:00', endTime: '11:00', category: 'coral',  location: 'Zoom' },
  { user: userId, title: 'Study Block',        date: dStr(today),       startTime: '14:00', endTime: '16:00', category: 'teal',   location: '' },
  { user: userId, title: 'Priya — Scope Call', date: dStr(today),       startTime: '17:30', endTime: '18:15', category: 'amber',  location: 'Zoom' },
  { user: userId, title: 'Product Design Review', date: dStr(addDays(1)), startTime: '10:00', endTime: '11:30', category: 'blue', location: 'Figma' },
  { user: userId, title: 'Weekly Retrospective',  date: dStr(addDays(1)), startTime: '15:00', endTime: '16:00', category: 'accent', location: 'Google Meet' },
  { user: userId, title: 'Tech Talk: Microservices', date: dStr(addDays(3)), startTime: '11:00', endTime: '12:00', category: 'blue', location: 'YouTube Live' },
  { user: userId, title: 'Dentist Appointment', date: dStr(addDays(5)), startTime: '09:00', endTime: '10:00', category: 'amber', location: 'City Dental Clinic' },
];

const generateHabits = (userId) => {
  // Generate completion history for the last 30 days
  const getCompletions = (hitRate) => {
    const completions = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(-i);
      if (Math.random() < hitRate) completions.push({ date: dStr(d), status: 'done' });
      else if (Math.random() < 0.3) completions.push({ date: dStr(d), status: 'missed' });
    }
    return completions;
  };

  return [
    { user: userId, name: 'Drink 8 glasses of water', icon: '💧', color: 'rgba(44,201,160,0.12)',  frequency: 'Daily', target: '8 glasses', streak: 14, bestStreak: 21, completions: getCompletions(0.9) },
    { user: userId, name: 'Read 20 pages',             icon: '📚', color: 'rgba(245,166,35,0.10)', frequency: 'Daily', target: '20 pages',  streak: 9,  bestStreak: 14, completions: getCompletions(0.7) },
    { user: userId, name: 'Meditate 10 minutes',       icon: '🧘', color: 'rgba(124,107,240,0.12)',frequency: 'Daily', target: '10 min',    streak: 5,  bestStreak: 12, completions: getCompletions(0.6) },
    { user: userId, name: '30 min exercise',           icon: '🏃', color: 'rgba(74,158,245,0.10)', frequency: 'Daily', target: '30 min',    streak: 7,  bestStreak: 10, completions: getCompletions(0.75) },
    { user: userId, name: 'Sleep before 11 PM',        icon: '🌙', color: 'rgba(232,112,168,0.10)',frequency: 'Daily', target: '',          streak: 0,  bestStreak: 4,  completions: getCompletions(0.45) },
  ];
};

const generatePomodoros = (userId) => {
  const sessions = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(-i);
    const count = Math.floor(Math.random() * 6) + 2;
    for (let j = 0; j < count; j++) {
      const startH = 9 + j * 2;
      const startedAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startH, 0, 0);
      sessions.push({
        user: userId, type: 'focus', duration: 25, completed: true,
        startedAt, endedAt: new Date(startedAt.getTime() + 25 * 60 * 1000),
        date: dStr(d),
      });
    }
  }
  return sessions;
};

const generateNotifications = (userId) => [
  { user: userId, type: 'pomo', category: 'reminders', title: 'Pomodoro session complete! 🍅', message: 'You completed session 2 of 4. Take a 5-minute break before continuing.', read: false },
  { user: userId, type: 'task', category: 'tasks',     title: 'Task overdue: Design review notes', message: 'This task was due at 9:00 AM. Update or reschedule to keep your streak.', read: false },
  { user: userId, type: 'habit',category: 'reminders', title: '🔥 Habit milestone: 14 days!', message: "You've completed your water habit for 14 days straight — a new personal best!", read: false },
  { user: userId, type: 'report',category:'reminders', title: 'Weekly report is ready 📊', message: 'Your analytics summary for the past week has been generated. Check your insights!', read: true },
  { user: userId, type: 'task', category: 'tasks',     title: 'Upcoming: Sprint Review in 30 min', message: 'Your Sprint Review meeting starts in 30 minutes on Zoom.', read: true },
  { user: userId, type: 'habit',category: 'reminders', title: 'Don\'t break your streak! ⭐', message: "You haven't logged 'Meditate 10 minutes' yet today. Streak: 5 days.", read: true },
];

// ── Destroy all data ──────────────────────────────────────────
const destroyData = async () => {
  warn('Destroying all data...');
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Event.deleteMany({}),
    Habit.deleteMany({}),
    Pomodoro.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  log('All data destroyed');
};

// ── Seed data ─────────────────────────────────────────────────
const seedData = async () => {
  info('Starting seed...\n');

  for (const userData of DEMO_USERS) {
    info(`Creating user: ${userData.email}`);
    const user = await User.create(userData);
    log(`User created: ${user.fullName} (${user._id})`);

    // Tasks
    const tasks = generateTasks(user._id);
    const createdTasks = await Task.insertMany(tasks);
    log(`${createdTasks.length} tasks created`);

    // Events
    const events = generateEvents(user._id);
    await Event.insertMany(events);
    log(`${events.length} events created`);

    // Habits
    const habits = generateHabits(user._id);
    await Habit.insertMany(habits);
    log(`${habits.length} habits created`);

    // Pomodoro sessions
    const sessions = generatePomodoros(user._id);
    await Pomodoro.insertMany(sessions);
    log(`${sessions.length} pomodoro sessions created`);

    // Notifications
    const notifs = generateNotifications(user._id);
    await Notification.insertMany(notifs);
    log(`${notifs.length} notifications created\n`);
  }

  console.log(c.green + '\n✅ Database seeded successfully!\n' + c.reset);
  console.log('Demo accounts:');
  DEMO_USERS.forEach(u => {
    console.log(`  ${c.cyan}${u.email}${c.reset}  password: ${c.yellow}${u.password}${c.reset}  plan: ${u.plan}`);
  });
  console.log('');
};

// ── Main ──────────────────────────────────────────────────────
const run = async () => {
  const args    = process.argv.slice(2);
  const destroy = args.includes('--destroy');
  const fresh   = args.includes('--fresh');

  if (!process.env.MONGO_URI) {
    err('MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    log('Connected\n');

    if (destroy || fresh) await destroyData();
    if (!destroy)         await seedData();

    await mongoose.disconnect();
    log('Disconnected from MongoDB');
    process.exit(0);
  } catch (e) {
    err('Seed failed: ' + e.message);
    console.error(e);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();
