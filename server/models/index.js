const mongoose = require('mongoose');

// ── Calendar Event ───────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true, trim: true, maxlength: 200 },
  date:      { type: String, required: true }, // 'YYYY-MM-DD'
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  category:  { type: String, enum: ['accent', 'teal', 'amber', 'coral', 'blue'], default: 'accent' },
  location:  { type: String, trim: true },
  notes:     { type: String },
  isRecurring: { type: Boolean, default: false },
  recurrence:  { type: String, enum: ['daily', 'weekly', 'monthly', 'none'], default: 'none' },
  remindersSet: {
  oneDayBefore:    { type: Boolean, default: false },
  oneHourBefore:   { type: Boolean, default: false },
  thirtyMinBefore: { type: Boolean, default: false },
  fifteenMinBefore:{ type: Boolean, default: false },
  fiveMinBefore:   { type: Boolean, default: false },
},
}, { timestamps: true });

eventSchema.index({ user: 1, date: 1 });

// ── Habit ────────────────────────────────────────────────────
const habitSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true, trim: true, maxlength: 100 },
  icon:      { type: String, default: '⭐' },
  color:     { type: String, default: 'rgba(124,107,240,0.12)' },
  frequency: { type: String, enum: ['Daily', 'Weekdays', 'Weekends'], default: 'Daily' },
  target:    { type: String },
  streak:    { type: Number, default: 0 },
  bestStreak:{ type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  completions: [{
    date:   { type: String },  // 'YYYY-MM-DD'
    status: { type: String, enum: ['done', 'missed', 'skip'], default: 'done' },
  }],
}, { timestamps: true });

habitSchema.index({ user: 1, isActive: 1 });

// ── Pomodoro Session ─────────────────────────────────────────
const pomodoroSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  task:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  taskTitle: { type: String },
  type:      { type: String, enum: ['focus', 'short_break', 'long_break'], default: 'focus' },
  duration:  { type: Number, required: true }, // minutes
  completed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  endedAt:   { type: Date },
  date:      { type: String }, // 'YYYY-MM-DD' for easy querying
}, { timestamps: true });

pomodoroSchema.index({ user: 1, date: 1 });

// ── Notification ─────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:     { type: String, enum: ['pomo', 'task', 'habit', 'report', 'reminder', 'system'], default: 'system' },
  category: { type: String, enum: ['tasks', 'reminders', 'system'], default: 'system' },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  link:     { type: String },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });

module.exports = {
  Event:        mongoose.model('Event', eventSchema),
  Habit:        mongoose.model('Habit', habitSchema),
  Pomodoro:     mongoose.model('Pomodoro', pomodoroSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
