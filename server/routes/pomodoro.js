// pomodoro.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { Pomodoro, Notification } = require("../models/index");
const User = require("../models/User");
const { sendPomoNotif } = require("../utils/sendEmail");

const isQuietHours = (user) => {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = (user.notifications?.quietStart || "22:00")
    .split(":")
    .map(Number);
  const [eh, em] = (user.notifications?.quietEnd || "08:00")
    .split(":")
    .map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end;
};

router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    const query = { user: req.user._id };
    if (date) query.date = date;
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    const sessions = await Pomodoro.find(query)
      .populate("task", "title")
      .sort({ startedAt: -1 });
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = await Pomodoro.countDocuments({
      user: req.user._id,
      date: todayStr,
      type: "focus",
      completed: true,
    });
    res.json({
      success: true,
      count: sessions.length,
      todayCount,
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const session = await Pomodoro.create({
      ...req.body,
      user: req.user._id,
      date: req.body.date || today,
    });

    // ── Session start notification ──
    if (session.type === "focus") {
      await Notification.create({
        user: session.user,
        type: "pomo",
        category: "reminders",
        title: "🍅 Focus session started!",
        message: `Your ${session.duration} min focus session has begun. Stay focused!`,
      });
    }

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/complete", async (req, res, next) => {
  try {
    const session = await Pomodoro.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { completed: true, endedAt: new Date() },
      { new: true },
    );
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    // ── Session complete notification ──
    const typeLabels = {
      focus: {
        title: "🍅 Focus session complete!",
        msg: `Great work! You completed a ${session.duration} min focus session.`,
      },
      short_break: {
        title: "☕ Short break over!",
        msg: `Break time is up. Ready to focus again?`,
      },
      long_break: {
        title: "🌿 Long break over!",
        msg: `Long break complete. Time to get back to it!`,
      },
    };
    const label = typeLabels[session.type] || typeLabels.focus;

    await Notification.create({
      user: session.user,
      type: "pomo",
      category: "reminders",
      title: label.title,
      message: label.msg,
    });

    // Email if enabled and not quiet hours
    const user = await User.findById(session.user);
    if (user?.notifications?.pomodoro && !isQuietHours(user)) {
      await sendPomoNotif(user, label.title, label.msg);
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
