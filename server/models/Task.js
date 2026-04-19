const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title:  { type: String, required: true },
  done:   { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  category:    { type: String, enum: ['Work', 'Study', 'Health', 'Personal'], default: 'Work' },
  priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status:      { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  dueDate:     { type: Date },
  dueTime:     { type: String },
  estimatedHours: { type: Number, default: 0 },
  subtasks:    [subtaskSchema],
  tags:        [{ type: String }],
  pomodoroCount: { type: Number, default: 0 },
  completedAt: { type: Date },
  isArchived:  { type: Boolean, default: false },
  overdueNotifiedAt: { type: Date },
}, { timestamps: true });

// Index for common queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Task', taskSchema);
