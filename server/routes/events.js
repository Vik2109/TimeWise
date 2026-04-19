const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { Event } = require('../models/index');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/events?month=2026-03  or  ?date=2026-03-17  or  ?startDate=&endDate=
router.get('/', async (req, res, next) => {
  try {
    const { month, date, startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: `^${month}` };
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const events = await Event.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) { next(err); }
});

// POST /api/events
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('date').notEmpty().withMessage('Date required'),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const event = await Event.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
});

// PUT /api/events/:id
router.put('/:id', async (req, res, next) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
