const express = require("express");
const router = express.Router();
const { Notification } = require("../models/index");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/notifications
router.get("/", async (req, res, next) => {
  try {
    const { category, unread } = req.query;
    const query = { user: req.user._id };
    if (category && category !== "all") query.category = category;
    if (unread === "true") query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all  — must be defined BEFORE /:id/read to avoid route shadowing
router.patch("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true },
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications (internal use / admin seed)
router.post("/", async (req, res, next) => {
  try {
    const notif = await Notification.create({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
