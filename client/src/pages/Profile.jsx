import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Modal, Avatar, Field, Progress } from "../components/common/UI";
import Icon from "../components/common/Icon";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function Profile() {
  const { openSidebar } = useOutletContext() || {};
  const { user, updateProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    password: "",
    settings: {
      timezone: user?.settings?.timezone || "Asia/Kolkata",
      workStartTime: user?.settings?.workStartTime || "09:00",
      workEndTime: user?.settings?.workEndTime || "18:00",
      pomoDuration: user?.settings?.pomoDuration || 25,
      shortBreak: user?.settings?.shortBreak || 5,
      longBreak: user?.settings?.longBreak || 15,
      dailyPomoGoal: user?.settings?.dailyPomoGoal || 8,
    },
  });

  const [avatar, setAvatar] = useState(
    () => localStorage.getItem("tw_avatar") || null,
  );

  const [saving, setSaving] = useState(false);
  const [avatarMenu, setAvatarMenu] = useState(false);
  const [viewPic, setViewPic] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setAvatarMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setS = (k) => (e) =>
    setForm((p) => ({
      ...p,
      settings: {
        ...p.settings,
        [k]: isNaN(e.target.value) ? e.target.value : Number(e.target.value),
      },
    }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        settings: form.settings,
      };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      // ← add async here
      const base64 = reader.result;
      localStorage.setItem("tw_avatar", base64);
      setAvatar(base64);
      window.dispatchEvent(new Event("avatar-updated"));

      // ← send to backend
      try {
        await updateProfile({ avatar: base64 }, false);
        toast.success("Profile picture updated!");
      } catch(err) {
        console.log("avatar save error:", err); // ← add this
        console.log("response:", err.response?.data); // ← add this
        toast.error("Failed to save picture");
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Permanently delete ALL your data? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete("/users/account");
      await logout();
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const INFO = [
    ["Timezone", user?.settings?.timezone || "—"],
    ["Daily Goal", `${user?.settings?.dailyPomoGoal || 8} Pomodoros/day`],
    [
      "Work Hours",
      `${user?.settings?.workStartTime || "—"} – ${user?.settings?.workEndTime || "—"}`,
    ],
    ["Focus Duration", `${user?.settings?.pomoDuration || 25} min`],
    [
      "Member Since",
      user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—",
    ],
    ["Plan", user?.plan || "free"],
  ];

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
            <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">Manage your account and preferences</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icon name="edit" size={14} /> <span className="hidden sm:inline">Edit Profile</span>
        </button>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in max-w-[620px] space-y-4">
        {/* Profile card */}
        <div className="card">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setAvatarMenu((p) => !p)}
                className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 focus:outline-none"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar initials={user?.initials} size="lg" />
                )}
              </button>

              {avatarMenu && (
                <div className="absolute left-0 top-16 z-50 bg-surface-50 border border-white/10 rounded-xl shadow-lg overflow-hidden w-44">
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    onClick={() => {
                      setViewPic(true);
                      setAvatarMenu(false);
                    }}
                  >
                    <Icon name="eye" size={14} /> View Picture
                  </button>
                  <label className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors cursor-pointer">
                    <Icon name="edit" size={14} /> Replace Picture
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleImageChange(e);
                        setAvatarMenu(false);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {user?.fullName}
              </h2>
              <p className="text-sm text-white/40 mt-1">{user?.email}</p>
              <div className="mt-2">
                <span className="badge badge-accent capitalize">
                  {user?.plan || "free"} Plan
                </span>
              </div>
            </div>
          </div>
          <div className="divider" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {INFO.map(([l, v]) => (
              <div key={l}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-1">
                  {l}
                </p>
                <p className="font-medium capitalize">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card border-coral-300/20">
          <h3 className="section-title text-coral-300 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between p-4 bg-coral-300/[0.04] border border-coral-300/20 rounded-xl">
            <div>
              <p className="text-sm font-medium text-coral-300">
                Delete Account
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                Permanently deletes all your data. Cannot be undone.
              </p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={deleteAccount}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Edit Profile">
        <form onSubmit={save}>
          {/* Avatar preview */}
          <div className="flex justify-center mb-5">
            <label className="relative cursor-pointer group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-[#E870A8] flex items-center justify-center text-xl font-semibold">
                    {`${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`.toUpperCase() ||
                      "?"}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Icon name="edit" size={14} color="white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {avatar && (
              <div className="flex justify-center -mt-2 mb-3">
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  onClick={() => {
                    localStorage.removeItem("tw_avatar");
                    setAvatar(null);
                    window.dispatchEvent(new Event("avatar-updated"));
                  }}
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First Name">
              <input
                className="input"
                value={form.firstName}
                onChange={set("firstName")}
              />
            </Field>
            <Field label="Last Name">
              <input
                className="input"
                value={form.lastName}
                onChange={set("lastName")}
              />
            </Field>
          </div>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
          </Field>

          <Field label="Timezone">
            <select
              className="input"
              value={form.settings.timezone}
              onChange={setS("timezone")}
            >
              {[
                "Asia/Kolkata",
                "America/New_York",
                "America/Los_Angeles",
                "Europe/London",
                "Asia/Tokyo",
                "Australia/Sydney",
              ].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Work Start">
              <input
                className="input"
                type="time"
                value={form.settings.workStartTime}
                onChange={setS("workStartTime")}
              />
            </Field>
            <Field label="Work End">
              <input
                className="input"
                type="time"
                value={form.settings.workEndTime}
                onChange={setS("workEndTime")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Focus Duration (min)">
              <input
                className="input"
                type="number"
                value={form.settings.pomoDuration}
                onChange={setS("pomoDuration")}
                min="5"
                max="90"
              />
            </Field>
            <Field label="Daily Pomo Goal">
              <input
                className="input"
                type="number"
                value={form.settings.dailyPomoGoal}
                onChange={setS("dailyPomoGoal")}
                min="1"
                max="20"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Short Break (min)">
              <input
                className="input"
                type="number"
                value={form.settings.shortBreak}
                onChange={setS("shortBreak")}
                min="1"
                max="20"
              />
            </Field>
            <Field label="Long Break (min)">
              <input
                className="input"
                type="number"
                value={form.settings.longBreak}
                onChange={setS("longBreak")}
                min="5"
                max="45"
              />
            </Field>
          </div>

          <div className="divider" />
          <Field label="New Password (blank = keep current)">
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
            />
          </Field>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
      {viewPic && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setViewPic(false)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-3 -right-3 w-7 h-7 bg-surface-50 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              onClick={() => setViewPic(false)}
            >
              <Icon name="x" size={12} color="white" />
            </button>
            {avatar ? (
              <img
                src={avatar}
                alt="profile"
                className="w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary-400 to-[#E870A8] flex items-center justify-center text-6xl font-semibold">
                {user?.initials || "?"}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
