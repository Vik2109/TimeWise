import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spinner, Field } from "../components/common/UI";
import Icon from "../components/common/Icon";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.password) e.password = "Password is required";
    if (form.password.length < 6) e.password = "Password must be 6+ characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const { token } = useParams(); // get token from URL /reset-password/:token

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, form.password);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid or expired reset link",
      );
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

          <h1 className="text-xl text-white text-center mb-7 font-semibold">
            Enter new password
          </h1>

          <form onSubmit={handleSubmit} className="space-y-0">
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

            <Field label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <input
                  className={`input pr-10 ${errors.confirmPassword ? "input-error" : ""}`}
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <Icon name="eye" size={16} color="currentColor" />
                </button>
              </div>
              {/* Live match hint */}
              {form.confirmPassword && !errors.confirmPassword && (
                <p
                  className={`text-xs mt-1 ${
                    form.password === form.confirmPassword
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {form.password === form.confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </Field>

            <button
              type="submit"
              className="btn btn-primary btn-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size={16} /> Password reseting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
