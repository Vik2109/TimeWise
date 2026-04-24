import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/common/UI";
import Icon from "../components/common/Icon";
import api from "../utils/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const MODES = [
  {
    key: "focus",
    label: "🍅 Focus",
    settingKey: "pomoDuration",
    def: 25,
    colorClass: "text-coral-300",
    ring: "#F06464",
    bg: "bg-coral-300/10",
  },
  {
    key: "short",
    label: "☕ Short Break",
    settingKey: "shortBreak",
    def: 5,
    colorClass: "text-teal-300",
    ring: "#2CC9A0",
    bg: "bg-teal-300/10",
  },
  {
    key: "long",
    label: "🌿 Long Break",
    settingKey: "longBreak",
    def: 15,
    colorClass: "text-primary-300",
    ring: "#7C6BF0",
    bg: "bg-primary-400/10",
  },
];

const MODE_TO_TYPE = {
  focus: "focus",
  short: "short_break",
  long: "long_break",
};

const TYPE_TO_MODE = {
  focus: "focus",
  short_break: "short",
  long_break: "long",
};

export default function Pomodoro() {
  const { openSidebar } = useOutletContext() || {};
  const { user, updateProfile } = useAuth();
  const settings = user?.settings || {};

  const [localSettings, setLocalSettings] = useState({
    pomoDuration: settings.pomoDuration || 25,
    shortBreak: settings.shortBreak || 5,
    longBreak: settings.longBreak || 15,
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [manualSession, setManualSession] = useState(0);

  const getDur = useCallback(
    (m) => {
      const mode = MODES.find((x) => x.key === m);
      return (localSettings[mode?.settingKey] || mode?.def || 25) * 60;
    },
    [localSettings],
  );

  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(() => getDur("focus"));
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const modeRef = useRef("focus");
  const skipModeResetRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const currentMode = MODES.find((m) => m.key === mode);
  const total = getDur(mode);
  const progress = 1 - remaining / total;
  const C = 2 * Math.PI * 95;
  const offset = C * (1 - progress);
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const todayFocus = sessions.filter(
    (s) => s.type === "focus" && s.completed,
  ).length;
  const effectiveSessions = todayFocus + manualSession;
  const sessionInCycle = effectiveSessions % 4;
  const currentCycle = Math.floor(effectiveSessions / 4) + 1;

  // ── Fetch today's sessions ───────────────────────────────────
  const fetchSessions = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    api
      .get(`/pomodoro?date=${today}`)
      .then((r) => setSessions(r.data.data || []))
      .catch(() => {});
  }, []);

  // useEffect(() => {
  //   fetchSessions();
  // }, [fetchSessions]);

  // ── Handle session expired while away ───────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    api
      .get(`/pomodoro?date=${today}`)
      .then((r) => {
        const allSessions = r.data.data || [];
        setSessions(allSessions);
        const active = allSessions.find((s) => !s.completed);
        if (active) {
          const elapsed = Math.floor(
            (Date.now() - new Date(active.startedAt).getTime()) / 1000,
          );
          const rem = active.duration * 60 - elapsed;
          if (rem > 0) {
            const restoredMode = TYPE_TO_MODE[active.type] || "focus";
            skipModeResetRef.current = true;
            setMode(restoredMode);
            setRemaining(rem);
            setSessionId(active._id);
            sessionIdRef.current = active._id;
            modeRef.current = restoredMode;
            setRunning(true);
          } else {
            api.patch(`/pomodoro/${active._id}/complete`).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reset timer on mode change — skip if active session ─────
  useEffect(() => {
    if (skipModeResetRef.current) {
      skipModeResetRef.current = false;
      return;
    }
    if (sessionIdRef.current) return;
    setRemaining(getDur(mode));
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [mode, getDur]);

  // ── Session complete ─────────────────────────────────────────
  const onComplete = useCallback(async () => {
    const sid = sessionIdRef.current;
    const m = modeRef.current;
    if (sid) {
      try {
        await api.patch(`/pomodoro/${sid}/complete`);
      } catch {}
    }
    toast.success(m === "focus" ? "🍅 Focus session complete!" : "Break over!");
    fetchSessions();
    setSessionId(null);
    sessionIdRef.current = null;
  }, [fetchSessions]);

  // ── Interval ticker ──────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            onComplete();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, onComplete]);

  // ── Start ────────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      const res = await api.post("/pomodoro", {
        type: MODE_TO_TYPE[mode],
        duration: Math.round(getDur(mode) / 60),
      });
      const id = res.data.data._id;
      setSessionId(id);
      sessionIdRef.current = id;
      fetchSessions();
    } catch {}
    setRunning(true);
  };

  // ── Reset ────────────────────────────────────────────────────
  const handleReset = () => {
    setRunning(false);
    setSessionId(null);
    sessionIdRef.current = null;
    setRemaining(getDur(mode));
    clearInterval(intervalRef.current);
  };

  // ── Click active session to restore timer ────────────────────
  const handleSessionClick = (s) => {
    if (s.completed) return;
    const elapsed = Math.floor(
      (Date.now() - new Date(s.startedAt).getTime()) / 1000,
    );
    const rem = s.duration * 60 - elapsed;
    if (rem <= 0) return;
    const restoredMode = TYPE_TO_MODE[s.type] || "focus";
    skipModeResetRef.current = true;
    setMode(restoredMode);
    setRemaining(rem);
    setSessionId(s._id);
    sessionIdRef.current = s._id;
    modeRef.current = restoredMode;
    setRunning(true);
  };

  // ── Settings ─────────────────────────────────────────────────
  const handleSettingChange = (key, value) => {
    setLocalSettings((p) => ({ ...p, [key]: Number(value) }));
    const modeKey = {
      pomoDuration: "focus",
      shortBreak: "short",
      longBreak: "long",
    };
    if (modeKey[key] === mode && !running) setRemaining(Number(value) * 60);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateProfile({ settings: localSettings });
      toast.success("Timer settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="flex items-center min-w-0">
          <button className="hamburger-btn" onClick={openSidebar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-4 h-4"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              Pomodoro Timer
            </h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">
              {todayFocus} sessions today ·{" "}
              {Math.round(
                ((todayFocus * (settings.pomoDuration || 25)) / 60) * 10,
              ) / 10}
              h focused
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            {/* Main timer card */}
            <div className="card flex flex-col items-center py-10">
              <div className="flex gap-2 mb-8 flex-wrap justify-center">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => !running && setMode(m.key)}
                    className={clsx("pill", mode === m.key && "active")}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="relative w-56 h-56 mb-6">
                <svg
                  width="224"
                  height="224"
                  viewBox="0 0 224 224"
                  className="rotate-[-90deg]"
                >
                  <circle
                    cx="112"
                    cy="112"
                    r="95"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r="95"
                    fill="none"
                    stroke={currentMode.ring}
                    strokeWidth="10"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dashoffset 0.5s ease, stroke 0.3s",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={clsx(
                      "text-6xl font-light tracking-[-4px] font-mono",
                      currentMode.colorClass,
                    )}
                  >
                    {mins}:{secs}
                  </span>
                  <span className="text-xs text-white/25 uppercase tracking-widest mt-1">
                    {mode === "focus"
                      ? "Focus Time"
                      : mode === "short"
                        ? "Short Break"
                        : "Long Break"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={handleReset}
                  className="w-12 h-12 rounded-full bg-surface-100 border border-white/[0.07] flex items-center justify-center hover:bg-surface-200 transition-colors"
                >
                  <Icon
                    name="refresh"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                  />
                </button>
                <button
                  onClick={running ? () => setRunning(false) : handleStart}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{ background: currentMode.ring }}
                >
                  {running ? (
                    <Icon name="pause" size={22} color="white" />
                  ) : (
                    <Icon name="play" size={22} color="white" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!running)
                      setMode((p) => (p === "focus" ? "short" : "focus"));
                  }}
                  className="w-12 h-12 rounded-full bg-surface-100 border border-white/[0.07] flex items-center justify-center hover:bg-surface-200 transition-colors"
                >
                  <Icon
                    name="chevRight"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                  />
                </button>
              </div>

              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      i < sessionInCycle
                        ? "opacity-100"
                        : i === sessionInCycle && running
                          ? "opacity-100 animate-pulse-soft"
                          : "bg-surface-200 opacity-40",
                    )}
                    style={
                      i < sessionInCycle || (i === sessionInCycle && running)
                        ? { background: currentMode.ring }
                        : undefined
                    }
                  />
                ))}
              </div>
              <div className="flex flex-col items-center gap-1 mt-2">
                <p className="text-xs text-white/25">
                  Session {sessionInCycle + 1} of 4 · Cycle {currentCycle}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setManualSession((p) => p - 1)}
                    className="w-6 h-6 rounded-full bg-surface-100 border border-white/[0.07] flex items-center justify-center hover:bg-surface-200 transition-colors"
                  >
                    <Icon
                      name="chevLeft"
                      size={12}
                      color="rgba(255,255,255,0.4)"
                    />
                  </button>
                  <button
                    onClick={() => setManualSession((p) => p + 1)}
                    className="w-6 h-6 rounded-full bg-surface-100 border border-white/[0.07] flex items-center justify-center hover:bg-surface-200 transition-colors"
                  >
                    <Icon
                      name="chevRight"
                      size={12}
                      color="rgba(255,255,255,0.4)"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Session log */}
            <div className="card">
              <h3 className="section-title mb-4">Today's Sessions</h3>
              {sessions.length === 0 ? (
                <p className="text-sm text-white/25 text-center py-4">
                  No sessions yet — start one!
                </p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => handleSessionClick(s)}
                    className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl mb-2 border transition-colors",
                      !s.completed &&
                        "cursor-pointer hover:bg-primary-400/[0.08]",
                      s.completed
                        ? "bg-teal-300/[0.04] border-teal-300/10"
                        : "bg-primary-400/[0.04] border-primary-400/10",
                    )}
                  >
                    <div
                      className={clsx(
                        "w-2 h-2 rounded-full shrink-0",
                        s.completed ? "bg-teal-300" : "bg-primary-400",
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {s.type === "focus"
                          ? "Focus Session"
                          : s.type === "short_break"
                            ? "Short Break"
                            : "Long Break"}
                      </p>
                      <p className="text-[11px] text-white/30 font-mono mt-0.5">
                        {new Date(s.startedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {s.duration} min
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "badge",
                        s.completed ? "badge-green" : "badge-accent",
                      )}
                    >
                      {s.completed ? "Done" : "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settings & stats */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title mb-4">Timer Settings</h3>
              {[
                ["Focus duration", "pomoDuration", 5, 90],
                ["Short break", "shortBreak", 1, 20],
                ["Long break", "longBreak", 5, 45],
              ].map(([label, key, min, max]) => (
                <div key={key} className="mb-5">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/50">{label}</span>
                    <span className="text-sm font-medium font-mono text-white">
                      {localSettings[key]} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={localSettings[key]}
                    onChange={(e) => handleSettingChange(key, e.target.value)}
                    disabled={running}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/20">{min}m</span>
                    <span className="text-[10px] text-white/20">{max}m</span>
                  </div>
                </div>
              ))}
              <button
                className="btn btn-primary w-full mt-2"
                onClick={saveSettings}
                disabled={savingSettings || running}
              >
                {savingSettings ? (
                  <>
                    <Spinner size={14} /> Saving…
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
              {running && (
                <p className="text-xs text-white/25 text-center mt-2">
                  Stop timer to change settings
                </p>
              )}
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Today's Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    label: "Sessions",
                    value: todayFocus,
                    color: "stat-accent",
                  },
                  {
                    label: "Focus",
                    value: `${Math.round(((todayFocus * (settings.pomoDuration || 25)) / 60) * 10) / 10}h`,
                    color: "stat-teal",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={clsx("stat-card", s.color, "p-4")}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      {s.label}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight mt-1">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
