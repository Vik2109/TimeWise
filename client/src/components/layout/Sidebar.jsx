import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotif } from "../../context/NotifContext";
import { Avatar } from "../common/UI";
import Icon from "../common/Icon";
import clsx from "clsx";

const NAV = [
  {
    group: "Main",
    items: [
      { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
      { to: "/tasks", icon: "tasks", label: "Tasks" },
      { to: "/calendar", icon: "calendar", label: "Calendar" },
      { to: "/pomodoro", icon: "clock", label: "Pomodoro" },
    ],
  },
  {
    group: "Track",
    items: [
      { to: "/habits", icon: "star", label: "Habits" },
      { to: "/analytics", icon: "chart", label: "Analytics" },
    ],
  },
  {
    group: "Tools",
    items: [
      {
        to: "/notifications",
        icon: "bell",
        label: "Notifications",
        notif: true,
      },
      { to: "/export", icon: "download", label: "Export Data" },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const { unread } = useNotif();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [avatar, setAvatar] = useState(
    () => localStorage.getItem("tw_avatar") || null,
  );

  useEffect(() => {
    const handler = () => setAvatar(localStorage.getItem("tw_avatar") || null);
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "w-60 shrink-0 bg-surface-50 border-r border-white/[0.07] flex flex-col py-5",
          "fixed top-0 left-0 h-full transition-transform duration-300 ease-in-out z-40",
          "lg:static lg:translate-x-0 lg:z-auto lg:h-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 pb-6">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary-400 to-teal-300 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5">
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" />
              <path
                d="M12 8v4l2 2"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">TimeWise</span>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6">
          {NAV.map(({ group, items }) => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-1.5">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, icon, label, notif }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      clsx("nav-item", isActive && "active")
                    }
                  >
                    <Icon name={icon} size={16} />
                    {label}
                    {notif && unread > 0 && (
                      <span className="nav-badge">{unread}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div
          ref={ref}
          className="px-3 pt-4 mt-2 border-t border-white/[0.07] relative"
        >
          {open && (
            <div className="absolute bottom-16 left-3 right-3 bg-surface-100 border border-white/[0.12] rounded-xl overflow-hidden z-50 shadow-modal animate-fade-in">
              {[
                {
                  label: "View Profile",
                  icon: "user",
                  action: () => { navigate("/profile"); setOpen(false); if (onClose) onClose(); },
                },
                {
                  label: "Export Data",
                  icon: "download",
                  action: () => { navigate("/export"); setOpen(false); if (onClose) onClose(); },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-white/50 hover:bg-surface-200 hover:text-white transition-colors text-left"
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-white/[0.07] mx-2" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-coral-300 hover:bg-coral-300/10 transition-colors text-left"
              >
                <Icon name="logout" size={14} color="#F06464" />
                Sign Out
              </button>
            </div>
          )}

          <button
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-surface-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Avatar initials={user?.initials} size="sm" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
              <p className="text-[11px] text-white/30 capitalize">{user?.plan || "free"} Plan</p>
            </div>
            <Icon name="chevDown" size={14} color="rgba(255,255,255,0.3)" />
          </button>
        </div>
      </aside>
    </>
  );
}
