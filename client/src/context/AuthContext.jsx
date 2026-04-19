import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tw_token");
    const saved = localStorage.getItem("tw_user");
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const persist = (userData, token) => {
    localStorage.setItem("tw_token", token);
    localStorage.setItem("tw_user", JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    persist(res.data.user, res.data.token);
    toast.success(`Welcome, ${res.data.user.firstName}! 🎉`);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.removeItem("tw_avatar");
    if (res.data.user.avatar) {
      localStorage.setItem("tw_avatar", res.data.user.avatar);
      window.dispatchEvent(new Event("avatar-updated"));
    }
    persist(res.data.user, res.data.token);
    toast.success(`Welcome back, ${res.data.user.firstName}!`);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    // localStorage.removeItem("tw_avatar");
    localStorage.removeItem("tw_token");
    localStorage.removeItem("tw_user");
    setUser(null);
    toast.success("Signed out");
  };

  const forgotPassword = async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    return await api.post(`/auth/reset-password/${token}`, { password });
  };

  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem("tw_token", token);
    const res = await api.get("/auth/me");
    localStorage.setItem("tw_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    // ← clear previous user's avatar
    localStorage.removeItem("tw_avatar");
    // ← set new user's avatar from DB if exists
    if (res.data.user.avatar) {
      localStorage.setItem("tw_avatar", res.data.user.avatar);
      window.dispatchEvent(new Event("avatar-updated"));
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await api.put("/auth/profile", data);
    const token = localStorage.getItem("tw_token");
    persist(res.data.user, token);
    // if (showToast) toast.success("Profile updated!");
    return res.data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        updateProfile,
        loginWithToken,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
