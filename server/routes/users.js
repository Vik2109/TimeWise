const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Task = require("../models/Task");
const { Event, Habit, Pomodoro, Notification } = require("../models/index");
const { protect } = require("../middleware/auth");

router.use(protect);

// PUT /api/users/profile
router.put("/profile", async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, avatar, settings } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (avatar !== undefined) user.avatar = avatar; // ← saves base64 to MongoDB
    if (settings) user.settings = { ...user.settings, ...settings };

    if (password) user.password = password; // bcrypt hook runs automatically

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/settings
router.put("/settings", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: req.body },
      { new: true },
    );
    res.json({ success: true, data: user.settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/notification-settings
router.put("/notification-settings", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notifications: req.body },
      { new: true },
    );
    res.json({ success: true, data: user.notifications });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/account  (full account deletion)
router.delete("/account", async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      Task.deleteMany({ user: userId }),
      Event.deleteMany({ user: userId }),
      Habit.deleteMany({ user: userId }),
      Pomodoro.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);
    res.json({ success: true, message: "Account and all data deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
