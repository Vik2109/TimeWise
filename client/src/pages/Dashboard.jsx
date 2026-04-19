import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotif } from "../context/NotifContext";
import { useAnalytics } from "../hooks/index";
import { PageLoading, Progress } from "../components/common/UI";
import Icon from "../components/common/Icon";
import api from "../utils/api";
import clsx from "clsx";

const CAT_BORDER = {
  accent: "border-l-primary-400",
  teal: "border-l-teal-300",
  amber: "border-l-amber-300",
  coral: "border-l-coral-300",
  blue: "border-l-blue-400",
};

function StatCard({ label, value, change, up, color, icon }) {
  return (
    <div className={clsx("stat-card", color)}>
      <div
        className={clsx(
          "absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center",
          color === "stat-accent"
            ? "bg-primary-400/15 text-primary-300"
            : color === "stat-teal"
              ? "bg-teal-300/10 text-teal-300"
              : color === "stat-amber"
                ? "bg-amber-300/10 text-amber-300"
                : "bg-coral-300/10 text-coral-300",
        )}
      >
        <Icon name={icon} size={18} color="currentColor" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
        {label}
      </p>
      <p className="text-3xl font-semibold tracking-tight mt-1.5 mb-1 leading-none">
        {value}
      </p>
      {change && (
        <p className={clsx("text-xs", up ? "text-teal-300" : "text-white/40")}>
          {change}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { unread: unreadCount, refresh: refreshNotif } = useNotif();
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext() || {};
  const { data: analytics } = useAnalytics("7days");
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    refreshNotif();
  }, [refreshNotif]);

  useEffect(() => {
    Promise.all([api.get("/tasks?tab=today"), api.get(`/events?date=${today}`)])
      .then(([t, e]) => {
        setTasks(t.data.data || []);
        setEvents(e.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const priColor = {
    High: "bg-coral-300",
    Medium: "bg-amber-300",
    Low: "bg-teal-300",
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center min-w-0">
          <button className="hamburger-btn" onClick={openSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
              {greeting}, {user?.firstName} 👋
            </h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/tasks")}
          >
            <Icon name="plus" size={14} /> <span className="hidden sm:inline">New Task</span>
          </button>
          <button
            className="icon-btn relative"
            onClick={() => navigate("/notifications")}
          >
            <Icon name="bell" size={17} color="rgba(255,255,255,0.5)" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral-300 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-7 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 mb-6">
          <StatCard
            label="Tasks Done"
            value={analytics?.tasks?.completed ?? "—"}
            change={`${analytics?.tasks?.rate ?? 0}% rate`}
            up
            color="stat-accent"
            icon="tasks"
          />
          <StatCard
            label="Focus Hours"
            value={`${analytics?.pomodoros?.avgDailyHours ?? "—"}h`}
            change="avg per day"
            up
            color="stat-teal"
            icon="clock"
          />
          <StatCard
            label="Habit Streak"
            value={`${analytics?.habits?.maxStreak ?? 0}d`}
            change="🔥 keep going!"
            up
            color="stat-amber"
            icon="star"
          />
          <StatCard
            label="Pomodoros"
            value={analytics?.pomodoros?.total ?? "—"}
            change="this week"
            color="stat-coral"
            icon="clock"
          />
        </div>

        {loading ? (
          <PageLoading />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
            {/* Tasks */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Today's Tasks</h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate("/tasks")}
                >
                  View all →
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-10 text-white/25 text-sm">
                  No tasks for today 🎉
                </div>
              ) : (
                tasks.slice(0, 7).map((t) => (
                  <div key={t._id} className="task-row">
                    <div
                      className={clsx(
                        "w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        t.status === "completed"
                          ? "bg-teal-300 border-teal-300"
                          : "border-white/20",
                      )}
                    >
                      {t.status === "completed" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          className="w-2.5 h-2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          "text-sm truncate",
                          t.status === "completed" &&
                            "line-through text-white/30",
                        )}
                      >
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`tag tag-${t.category}`}>
                          {t.category}
                        </span>
                        {t.dueTime && (
                          <span className="text-[11px] text-white/25 font-mono">
                            {t.dueTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "w-2 h-2 rounded-full shrink-0",
                        priColor[t.priority],
                      )}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Schedule */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title">Today's Schedule</h3>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate("/calendar")}
                  >
                    Calendar →
                  </button>
                </div>
                {events.length === 0 ? (
                  <p className="text-sm text-white/25 text-center py-4">
                    No events today
                  </p>
                ) : (
                  events.slice(0, 4).map((ev) => (
                    <div
                      key={ev._id}
                      className={clsx(
                        "event-item",
                        CAT_BORDER[ev.category] || "border-l-primary-400",
                      )}
                    >
                      <span className="text-[11px] font-mono text-white/30 w-12 shrink-0 pt-0.5">
                        {ev.startTime}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{ev.title}</p>
                        <p className="text-xs text-white/35 mt-0.5">
                          {ev.endTime}
                          {ev.location ? " · " + ev.location : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick actions */}
              <div className="card">
                <h3 className="section-title mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    {
                      label: "Start Pomodoro",
                      path: "/pomodoro",
                      dot: "bg-coral-300",
                    },
                    {
                      label: "Log a Habit",
                      path: "/habits",
                      dot: "bg-teal-300",
                    },
                    {
                      label: "View Analytics",
                      path: "/analytics",
                      dot: "bg-primary-300",
                    },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => navigate(a.path)}
                      className="btn btn-ghost w-full justify-start gap-3"
                    >
                      <div className={clsx("w-2 h-2 rounded-full", a.dot)} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus chart mini */}
              {analytics?.dailyBreakdown && (
                <div className="card">
                  <h3 className="section-title mb-3">Weekly Focus</h3>
                  <div className="flex items-end gap-1.5 h-16">
                    {analytics.dailyBreakdown.slice(-7).map((d, i) => {
                      const max = Math.max(
                        ...analytics.dailyBreakdown.map((x) => x.focusHours),
                        1,
                      );
                      const pct = (d.focusHours / max) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full rounded-t bg-primary-400/30 hover:bg-primary-400/50 transition-colors"
                            style={{ height: `${Math.max(4, pct)}%` }}
                          />
                          <span className="text-[9px] text-white/25 font-mono">
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
