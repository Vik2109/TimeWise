const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const Task    = require('../models/Task');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { status, category, priority, tab, search, startDate, endDate } = req.query;
    const query = { user: req.user._id, isArchived: false };

    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);

    if (tab === 'today') {
      query.dueDate = { $gte: today, $lt: tomorrow };
      query.status  = { $ne: 'completed' };
    } else if (tab === 'upcoming') {
      query.dueDate = { $gte: tomorrow };
      query.status  = { $ne: 'completed' };
    } else if (tab === 'completed') {
      query.status = 'completed';
    }

    if (status  && tab !== 'today' && tab !== 'upcoming' && tab !== 'completed') query.status   = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search)   query.title    = { $regex: search, $options: 'i' };
    if (startDate && endDate) {
      query.dueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, priority: -1, createdAt: -1 });
    const total = await Task.countDocuments({ user: req.user._id, isArchived: false });
    const pending = await Task.countDocuments({ user: req.user._id, status: { $ne: 'completed' }, isArchived: false });

    res.json({ success: true, count: tasks.length, total, pending, data: tasks });
  } catch (err) { next(err); }
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const task = await Task.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// PATCH /api/tasks/:id/toggle
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.status = task.status === 'completed' ? 'pending' : 'completed';
    task.completedAt = task.status === 'completed' ? new Date() : undefined;
    await task.save();
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// PATCH /api/tasks/:id/subtask/:subtaskId
router.patch('/:id/subtask/:subtaskId', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const sub = task.subtasks.id(req.params.subtaskId);
    if (!sub) return res.status(404).json({ success: false, message: 'Subtask not found' });
    sub.done = !sub.done;
    await task.save();
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
