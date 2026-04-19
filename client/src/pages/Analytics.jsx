import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useAnalytics } from "../hooks/index";
import { PageLoading, Progress } from "../components/common/UI";
import clsx from "clsx";

const PERIODS = [["7days", "7 Days"], ["30days", "30 Days"], ["3months", "3 Months"]];
const PIE_COLORS = ["#7C6BF0", "#2CC9A0", "#F5A623", "#4A9EF5", "#F06464"];

const TOOLTIP = {
  contentStyle: {
    background: "#1A1B22", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, fontSize: 12, color: "#F0F0F5", fontFamily: "DM Sans",
  },
  cursor: { fill: "rgba(255,255,255,0.03)" },
};

export default function Analytics() {
  const { openSidebar } = useOutletContext() || {};
  const [period, setPeriod] = useState("7days");
  const { data, loading } = useAnalytics(period);

  const STATS = data ? [
    { label: "Avg Daily Focus", value: `${data.pomodoros.avgDailyHours}h`, change: `${data.pomodoros.total} sessions`, up: true, color: "stat-accent" },
    { label: "Task Completion", value: `${data.tasks.rate}%`, change: `${data.tasks.completed}/${data.tasks.total} done`, up: true, color: "stat-teal" },
    { label: "Habit Rate", value: `${data.habits.avgRate}%`, change: `${data.habits.count} habits`, color: "stat-amber" },
    { label: "Pomodoros", value: data.pomodoros.total, change: `${data.pomodoros.focusMinutes}min total`, color: "stat-coral" },
  ] : [];

  return (
    <>
      <div className="topbar">
        <div className="flex items-center min-w-0">
          <button className="hamburger-btn" onClick={openSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Analytics & Reports</h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">
              Productivity insights · {PERIODS.find((p) => p[0] === period)?.[1]}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 bg-surface-100 p-1 rounded-lg shrink-0">
          {PERIODS.map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={clsx("px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                period === v ? "bg-surface-50 text-white shadow-sm" : "text-white/40 hover:text-white")}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in">
        {loading || !data ? <PageLoading /> : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 mb-5">
              {STATS.map((s) => (
                <div key={s.label} className={clsx("stat-card", s.color)}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1.5 mb-1 leading-none">{s.value}</p>
                  <p className={clsx("text-xs", s.up ? "text-teal-300" : "text-white/40")}>{s.change}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Bar chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title">
                    {period === "7days" ? "Daily" : period === "30days" ? "Weekly" : "Monthly"} Focus Hours
                  </h3>
                  <span className="badge badge-accent">Avg {data.pomodoros.avgDailyHours}h/day</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.dailyBreakdown} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP} formatter={(v) => [`${v}h`, "Focus"]} />
                    <Bar dataKey="focusHours" fill="#7C6BF0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie */}
              <div className="card">
                <h3 className="section-title mb-4">Category Breakdown</h3>
                {data.categoryBreakdown?.length > 0 ? (
                  <div className="flex items-center gap-5">
                    <PieChart width={120} height={120}>
                      <Pie data={data.categoryBreakdown} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="count" paddingAngle={2}>
                        {data.categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...TOOLTIP} formatter={(v, n, p) => [v, p.payload._id]} />
                    </PieChart>
                    <div className="space-y-2">
                      {data.categoryBreakdown.map((c, i) => (
                        <div key={c._id} className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-white/60">{c._id}</span>
                          <span className="font-semibold">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/25 text-center py-8">Complete tasks to see breakdown</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Peak hours */}
              <div className="card">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Peak Hours</h3>
                {data.peakHours?.length > 0 ? (
                  <>
                    {data.peakHours.map(({ label, percent }) => (
                      <div key={label} className="flex items-center gap-2 mb-2.5">
                        <span className="text-[11px] text-white/30 w-10 font-mono shrink-0">{label}</span>
                        <Progress value={percent} variant="amber" className="flex-1" />
                        <span className="text-[10px] text-white/25 w-7 text-right">{percent}%</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-white/25 mt-3">🔥 Most productive at {data.peakHours[0]?.label}</p>
                  </>
                ) : (
                  <p className="text-sm text-white/25 text-center py-8">No focus sessions yet</p>
                )}
              </div>

              {/* Insights */}
              <div className="card">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Insights</h3>
                <div className="space-y-2.5">
                  {[
                    { c: "#2CC9A0", bg: "rgba(44,201,160,0.06)", title: "Focus improved", sub: `${data.pomodoros.total} sessions` },
                    { c: "#F5A623", bg: "rgba(245,166,35,0.06)", title: `${data.habits.maxStreak}d streak`, sub: "Best habit streak" },
                    {
                      c: data.tasks.rate > 70 ? "#2CC9A0" : "#F06464",
                      bg: data.tasks.rate > 70 ? "rgba(44,201,160,0.06)" : "rgba(240,100,100,0.06)",
                      title: `${data.tasks.rate}% completion`, sub: "Tasks completed",
                    },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: item.bg, borderLeft: `3px solid ${item.c}` }}>
                      <p className="text-sm font-medium" style={{ color: item.c }}>{item.title}</p>
                      <p className="text-xs text-white/35 mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task categories */}
              <div className="card sm:col-span-2 lg:col-span-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Task Categories</h3>
                {data.taskCategories?.length > 0 ? (
                  data.taskCategories.map(({ name, percent }, i) => (
                    <div key={name} className="mb-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/60 capitalize">{name}</span>
                        <span className="font-semibold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{percent}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${percent}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/25 text-center py-8">No completed tasks yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
