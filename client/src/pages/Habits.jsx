// ═══════════════════════════════════════════════════
// Habits.jsx
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useHabits } from "../hooks/index";
import {
  Modal,
  ConfirmDelete,
  EmptyState,
  PageLoading,
  Progress,
  Field,
} from "../components/common/UI";
import Icon from "../components/common/Icon";
import clsx from "clsx";

const COLORS = [
  { label: "Teal", value: "rgba(44,201,160,0.12)" },
  { label: "Amber", value: "rgba(245,166,35,0.10)" },
  { label: "Purple", value: "rgba(124,107,240,0.12)" },
  { label: "Blue", value: "rgba(74,158,245,0.10)" },
  { label: "Pink", value: "rgba(232,112,168,0.10)" },
];


function HabitForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(
    initial || {
      name: "",
      icon: "⭐",
      color: COLORS[2].value,
      frequency: "Daily",
      target: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const s = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    setSaving(true);
    try {
      await onSave(f);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit}>
      <Field label="Habit Name *">
        <input
          className="input"
          value={f.name}
          onChange={s("name")}
          autoFocus
          required
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Icon (emoji)">
          <input
            className="input text-xl text-center"
            value={f.icon}
            onChange={s("icon")}
            maxLength={2}
          />
        </Field>
        <Field label="Color">
          <select className="input" value={f.color} onChange={s("color")}>
            {COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Frequency">
        <select className="input" value={f.frequency} onChange={s("frequency")}>
          {["Daily", "Weekdays", "Weekends"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </Field>
      <Field label="Target (optional)">
        <input
          className="input"
          value={f.target}
          onChange={s("target")}
          placeholder="e.g. 8 glasses"
        />
      </Field>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : initial?._id ? "Update" : "Add Habit"}
        </button>
      </div>
    </form>
  );
}

export default function Habits() {
  const { openSidebar } = useOutletContext() || {};
  const { habits, loading, create, update, remove, log } = useHabits();
  const [modal, setModal] = useState(null);
  const [editH, setEditH] = useState(null);
  const [delH, setDelH] = useState(null);
  const today = new Date().toISOString().split("T")[0];
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const maxStreak = useMemo(
    () => Math.max(0, ...habits.map((h) => h.streak || 0)),
    [habits],
  );

  const getStatus = (h) =>
    h.completions?.find((c) => c.date === today)?.status || null;
  const getLast7 = (h) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return (
        h.completions?.find((c) => c.date === d.toISOString().split("T")[0])
          ?.status || null
      );
    });
  const save = async (form) => {
    editH ? await update(editH._id, form) : await create(form);
    setModal(null);
    setEditH(null);
  };
  const del = async () => {
    await remove(delH._id);
    setModal(null);
    setDelH(null);
  };

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
            <h1 className="text-xl font-semibold tracking-tight">Habit Tracker</h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">{habits.length} active · {maxStreak}d max streak</p>
          </div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => { setEditH(null); setModal("form"); }}>
            <Icon name="plus" size={14} />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Today's Habits</h3>
                <span className="text-sm text-white/30">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {loading ? (
                <PageLoading />
              ) : habits.length === 0 ? (
                <EmptyState
                  icon="⭐"
                  message="No habits yet — add your first one!"
                />
              ) : (
                habits.map((h) => {
                  const status = getStatus(h);
                  const last7 = getLast7(h);
                  return (
                    <div key={h._id} className="habit-row group">
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0"
                        style={{ background: h.color }}
                      >
                        {h.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium">{h.name}</span>
                          <span
                            className={clsx(
                              "badge",
                              status === "done"
                                ? "badge-green"
                                : status === "missed"
                                  ? "badge-red"
                                  : "badge-gray",
                            )}
                          >
                            {status === "done"
                              ? "Done"
                              : status === "missed"
                                ? "Missed"
                                : "Pending"}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/25 mb-2">
                          {h.streak > 0
                            ? `🔥 ${h.streak}-day streak`
                            : "No streak"}{" "}
                          · Best: {h.bestStreak || 0}d
                        </p>
                        <div className="flex gap-1">
                          {last7.map((s, i) => (
                            <div
                              key={i}
                              className={clsx(
                                "w-5.5 h-5.5 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center",
                                s === "done"
                                  ? "bg-teal-300/25"
                                  : s === "missed"
                                    ? "bg-coral-300/10"
                                    : "bg-surface-200",
                              )}
                              title={DAYS[i]}
                            >
                              {s === "done" && (
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#2CC9A0"
                                  strokeWidth={2.5}
                                  strokeLinecap="round"
                                  className="w-2.5 h-2.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {s === "missed" && (
                                <span className="text-coral-300 text-[10px] font-bold">
                                  ×
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {status !== "done" && (
                          <button
                            className="btn btn-primary btn-sm py-1"
                            onClick={() => log(h._id, today, "done")}
                          >
                            ✓ Done
                          </button>
                        )}
                        {status !== "missed" && (
                          <button
                            className="btn btn-ghost btn-sm py-1"
                            onClick={() => log(h._id, today, "missed")}
                          >
                            Skip
                          </button>
                        )}
                        <button
                          className="icon-btn w-7 h-7"
                          onClick={() => {
                            setEditH(h);
                            setModal("form");
                          }}
                        >
                          <Icon
                            name="edit"
                            size={12}
                            color="rgba(255,255,255,0.4)"
                          />
                        </button>
                        <button
                          className="icon-btn icon-btn-danger w-7 h-7"
                          onClick={() => {
                            setDelH(h);
                            setModal("delete");
                          }}
                        >
                          <Icon name="trash" size={12} color="#F06464" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Year Overview</h3>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: "repeat(52,1fr)" }}
              >
                {Array.from({ length: 364 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - 363 + i);
                  const dateStr = d.toISOString().split("T")[0];
                  // Count how many habits were done on this day
                  const doneCount = habits.reduce((sum, h) => {
                    const found = h.completions?.find(
                      (c) => c.date === dateStr && c.status === "done",
                    );
                    return sum + (found ? 1 : 0);
                  }, 0);
                  // Map count to level 0-4
                  const total = habits.length || 1;
                  const ratio = doneCount / total;
                  const level =
                    ratio === 0
                      ? 0
                      : ratio <= 0.25
                        ? 1
                        : ratio <= 0.5
                          ? 2
                          : ratio <= 0.75
                            ? 3
                            : 4;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "hm-cell aspect-square",
                        level > 0 && `hm-l${level}`,
                      )}
                      title={dateStr}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-[11px] text-white/25">Less</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div
                    key={l}
                    className={clsx("hm-cell w-2.5 h-2.5", l > 0 && `hm-l${l}`)}
                  />
                ))}
                <span className="text-[11px] text-white/25">More</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title mb-4">Habit Scores</h3>
              {habits.length === 0 ? (
                <p className="text-sm text-white/25 text-center py-4">
                  Add habits to see scores
                </p>
              ) : (
                habits.map((h) => (
                  <div key={h._id} className="mb-3">
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="truncate">
                        {h.icon} {h.name}
                      </span>
                      <span className="text-teal-300 font-semibold shrink-0 ml-2">
                        {h.streak || 0}d
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, ((h.streak || 0) / 30) * 100)}
                      variant="teal"
                    />
                  </div>
                ))
              )}
            </div>
            <div className="card text-center">
              <h3 className="section-title mb-4">This Month</h3>
              {(() => {
                // Calculate real avg completion rate for this month
                const now = new Date();
                const monthStart = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1,
                )
                  .toISOString()
                  .split("T")[0];
                const daysElapsed = now.getDate();

                const avgRate =
                  habits.length === 0
                    ? 0
                    : Math.round(
                        habits.reduce((sum, h) => {
                          const done =
                            h.completions?.filter(
                              (c) =>
                                c.date >= monthStart && c.status === "done",
                            ).length || 0;
                          return (
                            sum +
                            Math.min(
                              100,
                              Math.round((done / daysElapsed) * 100),
                            )
                          );
                        }, 0) / habits.length,
                      );

                const circumference = 301;
                const offset = circumference - (circumference * avgRate) / 100;

                return (
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    className="mx-auto"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke="#2CC9A0"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text
                      x="60"
                      y="65"
                      textAnchor="middle"
                      fill="white"
                      fontSize="18"
                      fontWeight="600"
                      fontFamily="DM Mono"
                    >
                      {avgRate}%
                    </text>
                  </svg>
                );
              })()}
              <p className="text-xs text-white/30 mt-3">Avg completion rate</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modal === "form"}
        onClose={() => {
          setModal(null);
          setEditH(null);
        }}
        title={editH ? "Edit Habit" : "New Habit"}
      >
        <HabitForm
          initial={editH}
          onSave={save}
          onClose={() => {
            setModal(null);
            setEditH(null);
          }}
        />
      </Modal>
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title=""
        maxWidth="max-w-sm"
      >
        <ConfirmDelete
          onConfirm={del}
          onClose={() => setModal(null)}
          title="Delete this habit?"
          sub="Your streak data will be lost."
        />
      </Modal>
    </>
  );
}
