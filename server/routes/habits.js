const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { Habit } = require('../models/index');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/habits
router.get('/', async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true }).sort({ createdAt: 1 });
    res.json({ success: true, count: habits.length, data: habits });
  } catch (err) { next(err); }
});

// POST /api/habits
router.post('/', [
  body('name').trim().notEmpty().withMessage('Habit name required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const habit = await Habit.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: habit });
  } catch (err) { next(err); }
});

// PUT /api/habits/:id
router.put('/:id', async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true, data: habit });
  } catch (err) { next(err); }
});

// POST /api/habits/:id/log — log today's completion
router.post('/:id/log', async (req, res, next) => {
  try {
    const { date, status } = req.body; // status: 'done' | 'missed' | 'skip'
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    // Remove existing log for this date, then add new
    habit.completions = habit.completions.filter(c => c.date !== date);
    habit.completions.push({ date, status });

    // Recalculate streak
    if (status === 'done') {
      habit.streak += 1;
      if (habit.streak > habit.bestStreak) habit.bestStreak = habit.streak;
    } else if (status === 'missed') {
      habit.streak = 0;
    }

    await habit.save();
    res.json({ success: true, data: habit });
  } catch (err) { next(err); }
});

// DELETE /api/habits/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true, message: 'Habit removed' });
  } catch (err) { next(err); }
});

module.exports = router;
