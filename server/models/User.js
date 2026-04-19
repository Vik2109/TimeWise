const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName:  { type: String, required: true, trim: true, maxlength: 50 },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  avatar:    { type: String, default: '' },
  plan:      { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
  settings: {
    timezone:       { type: String, default: 'Asia/Kolkata' },
    workStartTime:  { type: String, default: '09:00' },
    workEndTime:    { type: String, default: '18:00' },
    pomoDuration:   { type: Number, default: 25 },
    shortBreak:     { type: Number, default: 5 },
    longBreak:      { type: Number, default: 15 },
    dailyPomoGoal:  { type: Number, default: 8 },
    theme:          { type: String, default: 'dark' },
  },
  notifications: {
    pomodoro:    { type: Boolean, default: true },
    tasks:       { type: Boolean, default: true },
    habits:      { type: Boolean, default: true },
    calendar:    { type: Boolean, default: true },
    weeklyReport:{ type: Boolean, default: false },
    quietStart:  { type: String, default: '22:00' },
    quietEnd:    { type: String, default: '08:00' },
  },
  isVerified: { type: Boolean, default: false },
  lastLogin:  { type: Date },

  resetPasswordToken:  { type: String },
  resetPasswordExpire: { type: Date },

}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('initials').get(function () {
  return `${this.firstName[0] || ''}${this.lastName[0] || ''}`.toUpperCase();
});

userSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('User', userSchema);
