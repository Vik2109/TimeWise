const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const { sendFeedbackEmail } = require('../utils/sendEmail');

// POST /api/feedback — submit feedback
router.post(
  '/',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
    body('category').optional().isIn(['General', 'Bug Report', 'Feature Request', 'UI/UX', 'Performance']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { rating, message, category } = req.body;

      const feedback = await Feedback.create({
        user:    req.user._id,
        rating,
        message,
        category: category || 'General',
      });

      // Send email notification — non-blocking
      sendFeedbackEmail(req.user, feedback).catch(() => {});

      res.status(201).json({ success: true, feedback });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/feedback/mine — get logged-in user's feedback history
router.get('/mine', protect, async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, feedbacks });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
