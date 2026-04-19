// export.js
const express = require('express');
const router  = express.Router();
const Task    = require('../models/Task');
const { Event, Habit, Pomodoro } = require('../models/index');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/export/tasks.csv
router.get('/tasks.csv', async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id, isArchived: false });
    const headers = ['Title', 'Category', 'Priority', 'Status', 'Due Date', 'Estimated Hours', 'Created At'];
    const rows = tasks.map(t => [
      `"${t.title}"`, t.category, t.priority, t.status,
      t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
      t.estimatedHours || 0,
      t.createdAt.toISOString().split('T')[0],
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=timewise-tasks.csv');
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/export/data.json
router.get('/data.json', async (req, res, next) => {
  try {
    const [tasks, events, habits, pomodoros] = await Promise.all([
      Task.find({ user: req.user._id }),
      Event.find({ user: req.user._id }),
      Habit.find({ user: req.user._id }),
      Pomodoro.find({ user: req.user._id }),
    ]);
    res.setHeader('Content-Disposition', 'attachment; filename=timewise-data.json');
    res.json({ exportedAt: new Date(), tasks, events, habits, pomodoros });
  } catch (err) { next(err); }
});

// GET /api/export/calendar.ics
router.get('/calendar.ics', async (req, res, next) => {
  try {
    const events = await Event.find({ user: req.user._id });
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TimeWise//EN\n';
    events.forEach(e => {
      const dt = e.date.replace(/-/g, '');
      const st = e.startTime.replace(':', '') + '00';
      const et = e.endTime.replace(':', '') + '00';
      ics += `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${dt}T${st}\nDTEND:${dt}T${et}\nLOCATION:${e.location || ''}\nEND:VEVENT\n`;
    });
    ics += 'END:VCALENDAR';
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=timewise-calendar.ics');
    res.send(ics);
  } catch (err) { next(err); }
});

module.exports = router;
