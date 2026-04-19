import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner, Field } from "../components/common/UI";
import Icon from "../components/common/Icon";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "no_account") {
      toast.error("No account found. Please register first.");
    } else if (error === "google") {
      toast.error("Google sign in failed. Please try again.");
    }
  }, []);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
        <div className="bg-surface-50 border border-white/[0.07] rounded-3xl p-10 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-teal-300 flex items-center justify-center mb-3 shadow-glow">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 8v4l2 2"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-[11px] text-white/30 tracking-[3px] uppercase font-medium">
              TimeWise
            </p>
          </div>

          <h1 className="text-2xl font-semibold text-center tracking-tight mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-white/40 text-center mb-7">
            Sign in to continue your productive day
          </p>

          <form onSubmit={handleSubmit} className="space-y-0">
            <Field label="Email" error={errors.email}>
              <input
                className={`input ${errors.email ? "input-error" : ""}`}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                autoFocus
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  className={`input pr-10 ${errors.password ? "input-error" : ""}`}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <Icon name="eye" size={16} color="currentColor" />
                </button>
              </div>
            </Field>

            <div className="flex justify-between items-center py-1 mb-2">
              <label className="flex items-center gap-2 text-sm text-white/40 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary-400 w-3.5 h-3.5"
                />
                Remember me
              </label>

              <Link
                to="/forgotPassword"
                className="text-sm text-primary-300 hover:text-primary-200 transition-colors"
              >
                Forgot Password
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size={16} /> Signing in…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-white/25">or continue with</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Social */}
          <button
            onClick={() =>
              (window.location.href =
                "http://localhost:5000/api/auth/google/login")
            }
            className="btn btn-ghost w-full justify-center gap-3 mb-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-sm text-center text-white/30 mt-5">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary-300 hover:text-primary-200 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
