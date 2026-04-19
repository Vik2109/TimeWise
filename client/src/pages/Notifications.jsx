import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Modal, Toggle, PageLoading } from "../components/common/UI";
import { useNotif } from "../context/NotifContext";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/common/Icon";
import api from "../utils/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const TABS = [
  ["all", "All"],
  ["unread", "Unread"],
  ["tasks", "Tasks"],
  ["reminders", "Reminders"],
];
const TYPE_META = {
  pomo: { bg: "bg-coral-300/20", color: "#F06464", icon: "clock" },
  task: { bg: "bg-primary-400/20", color: "#9B8DF5", icon: "tasks" },
  habit: { bg: "bg-teal-300/15", color: "#2CC9A0", icon: "star" },
  report: { bg: "bg-amber-300/10", color: "#F5A623", icon: "chart" },
  reminder: { bg: "bg-blue-400/15", color: "#4A9EF5", icon: "bell" },
  system: { bg: "bg-primary-400/15", color: "#9B8DF5", icon: "info" },
};

function NotifSettings({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [s, setS] = useState(
    user?.notifications || {
      pomodoro: true,
      tasks: true,
      habits: true,
      calendar: true,
      weeklyReport: false,
      quietStart: "22:00",
      quietEnd: "08:00",
    },
  );
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ notifications: s });
      onClose();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {[
        {
          k: "pomodoro",
          label: "Pomodoro alerts",
          sub: "Session start, end, breaks",
        },
        {
          k: "tasks",
          label: "Task reminders",
          sub: "Overdue and upcoming tasks",
        },
        {
          k: "habits",
          label: "Habit reminders",
          sub: "Daily check-in prompts",
        },
        {
          k: "calendar",
          label: "Calendar events",
          sub: "15 min before events",
        },
        {
          k: "weeklyReport",
          label: "Weekly reports",
          sub: "Analytics digest every Monday",
        },
      ].map(({ k, label, sub }) => (
        <div
          key={k}
          className="flex justify-between items-center py-3.5 border-b border-white/[0.07]"
        >
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-white/35 mt-0.5">{sub}</p>
          </div>
          <Toggle
            on={!!s[k]}
            onChange={(v) => setS((p) => ({ ...p, [k]: v }))}
          />
        </div>
      ))}
      <div className="divider" />
      <div className="mb-4">
        <label className="label">Quiet Hours</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            type="time"
            value={s.quietStart}
            onChange={(e) =>
              setS((p) => ({ ...p, quietStart: e.target.value }))
            }
          />
          <input
            className="input"
            type="time"
            value={s.quietEnd}
            onChange={(e) => setS((p) => ({ ...p, quietEnd: e.target.value }))}
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </>
  );
}

export default function Notifications() {
  const { openSidebar } = useOutletContext() || {};
  const [tab, setTab] = useState("all");
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { refresh: globalRefresh } = useNotif();
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (tab === "unread") p.set("unread", "true");
      if (tab === "tasks" || tab === "reminders") p.set("category", tab);
      const r = await api.get(`/notifications?${p}`);
      setNotifs(r.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    toast.success("All marked as read");
    load();
    globalRefresh();
  };
  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifs((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
    globalRefresh();
  };

  const handleClick = (n) => {
    setSelected(n);
    if (!n.read) markRead(n._id);
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
          <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm sm:btn-md" onClick={markAll}>
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Read all</span>
          </button>
          <button className="btn btn-ghost btn-sm sm:btn-md" onClick={() => setSettingsOpen(true)}>
            <Icon name="settings" size={14} /> <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in max-w-[720px]">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-5">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                tab === key
                  ? "bg-surface-50 text-white shadow-sm"
                  : "text-white/40 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageLoading />
        ) : notifs.length === 0 ? (
          <div className="text-center py-16 text-white/25 text-sm">
            No notifications here
          </div>
        ) : (
          notifs.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={clsx("notif-item", !n.read ? "unread" : "")}
              >
                <div
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    meta.bg,
                  )}
                >
                  <Icon name={meta.icon} size={17} color={meta.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[11px] text-white/25 font-mono mt-1.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0 mt-1" />
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Notification Settings"
      >
        <NotifSettings onClose={() => setSettingsOpen(false)} />
      </Modal>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Notification Detail"
      >
        {selected && (
          <div className="space-y-4">
            {/* Icon + title */}
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  TYPE_META[selected.type]?.bg || TYPE_META.system.bg,
                )}
              >
                <Icon
                  name={TYPE_META[selected.type]?.icon || "bell"}
                  size={18}
                  color={TYPE_META[selected.type]?.color || "#9B8DF5"}
                />
              </div>
              <div>
                <p className="text-sm font-semibold">{selected.title}</p>
                <p className="text-[11px] text-white/30 font-mono mt-0.5">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="divider" />

            {/* Message */}
            <p className="text-sm text-white/60 leading-relaxed">
              {selected.message}
            </p>

            {/* Meta badges */}
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-accent capitalize">
                {selected.type}
              </span>
              <span className="badge badge-green capitalize">
                {selected.category}
              </span>
              <span
                className={clsx(
                  "badge",
                  selected.read ? "badge-green" : "badge-accent",
                )}
              >
                {selected.read ? "✓ Read" : "● Unread"}
              </span>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
