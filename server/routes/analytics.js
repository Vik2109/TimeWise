const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { Habit, Pomodoro } = require("../models/index");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/analytics/summary?period=7days|30days|3months
router.get("/summary", async (req, res, next) => {
  try {
    const { period = "7days" } = req.query;
    const userId = req.user._id;

    const periodMap = { "7days": 7, "30days": 30, "3months": 90 };
    const days = periodMap[period] || 7;

    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    // Tasks
    const totalTasks = await Task.countDocuments({
      user: userId,
      createdAt: { $gte: from },
      isArchived: false,
    });
    const completedTasks = await Task.countDocuments({
      user: userId,
      status: "completed",
      completedAt: { $gte: from },
    });
    const taskRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Pomodoros
    const fromStr = from.toISOString().split("T")[0];
    const pomos = await Pomodoro.find({
      user: userId,
      completed: true,
      type: "focus",
      startedAt: { $gte: from },
    });
    const totalPomos = pomos.length;
    const totalFocusMin = pomos.reduce((sum, p) => sum + (p.duration || 0), 0);
    const avgDailyFocus =
      days > 0 ? parseFloat((totalFocusMin / 60 / days).toFixed(1)) : 0;

    // Habits
    const habits = await Habit.find({ user: userId, isActive: true });
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
    const avgHabitRate =
      habits.length > 0
        ? Math.round(
            habits.reduce((sum, h) => {
              const recent = h.completions.filter(
                (c) => c.date >= fromStr && c.status === "done",
              ).length;
              return sum + (recent / days) * 100;
            }, 0) / habits.length,
          )
        : 0;

    // Daily breakdown for bar chart
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayPomos = pomos.filter((p) => p.date === ds);
      const focusH = parseFloat(
        (dayPomos.reduce((s, p) => s + (p.duration || 0), 0) / 60).toFixed(1),
      );
      const label =
        days <= 7
          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]
          : days <= 30
            ? `W${Math.ceil(i / 7 + 1)}`
            : [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ][d.getMonth()];
      dailyData.push({ date: ds, label, focusHours: focusH });
    }

    // Category breakdown
    const tasksByCategory = await Task.aggregate([
      {
        $match: {
          user: userId,
          status: "completed",
          completedAt: { $gte: from },
        },
      },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Peak hours — count pomodoros by hour of day
    const hourCounts = {};
    pomos.forEach((p) => {
      const hour = new Date(p.startedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(hourCounts), 1);
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        label:
          parseInt(hour) === 0
            ? "12 AM"
            : parseInt(hour) < 12
              ? `${hour} AM`
              : parseInt(hour) === 12
                ? "12 PM"
                : `${parseInt(hour) - 12} PM`,
        count,
        percent: Math.round((count / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Task categories with percentage
    const totalCategoryTasks = tasksByCategory.reduce(
      (sum, c) => sum + c.count,
      0,
    );
    const taskCategoriesWithPercent = tasksByCategory.slice(0, 4).map((c) => ({
      name: c._id || "Uncategorized",
      count: c.count,
      percent:
        totalCategoryTasks > 0
          ? Math.round((c.count / totalCategoryTasks) * 100)
          : 0,
    }));

    res.json({
      success: true,
      data: {
        period,
        days,
        tasks: { total: totalTasks, completed: completedTasks, rate: taskRate },
        pomodoros: {
          total: totalPomos,
          focusMinutes: totalFocusMin,
          avgDailyHours: avgDailyFocus,
        },
        habits: { maxStreak, avgRate: avgHabitRate, count: habits.length },
        dailyBreakdown: dailyData,
        categoryBreakdown: tasksByCategory,
        peakHours, 
        taskCategories: taskCategoriesWithPercent,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/habits
router.get("/habits", async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true });
    const heatmapData = {};
    habits.forEach((h) => {
      h.completions.forEach((c) => {
        if (!heatmapData[c.date]) heatmapData[c.date] = 0;
        if (c.status === "done") heatmapData[c.date]++;
      });
    });
    res.json({ success: true, data: { habits, heatmap: heatmapData } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
