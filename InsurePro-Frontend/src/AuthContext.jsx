import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

/** Parse a JWT and return its payload, or null if malformed. */
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

/** Clear all auth keys from localStorage. */
function clearStorage() {
  localStorage.removeItem("ip_access");
  localStorage.removeItem("ip_refresh");
  localStorage.removeItem("ip_user");
  localStorage.removeItem("ip_customer_id");
  localStorage.removeItem("ip_force_pwd_change");
}

export function AuthProvider({ children }) {
  const stored = () => {
    try {
      const u = JSON.parse(localStorage.getItem("ip_user") || "null");
      if (!u) return null;
      // Reject the stored session if the access token has already expired.
      const token = localStorage.getItem("ip_access");
      if (token) {
        const payload = parseJwt(token);
        if (payload?.exp && Date.now() / 1000 > payload.exp) {
          clearStorage();
          return null;
        }
      }
      return u;
    } catch { return null; }
  };

  const storedCustomerId = () => {
    const v = localStorage.getItem("ip_customer_id");
    return v ? parseInt(v, 10) : null;
  };

  const [user,               setUser]               = useState(stored);
  const [customerId,         setCustomerId]         = useState(storedCustomerId);
  const [forcePasswordChange, setForcePasswordChange] = useState(
    () => localStorage.getItem("ip_force_pwd_change") === "true"
  );
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count — called after login, mark-as-read, and mark-all-read.
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/notifications/unread-count");
      setUnreadCount(res.data ?? res ?? 0);
    } catch {
      // Silently ignore — badge missing is not a critical failure.
    }
  }, []);

  // Keep the badge current while the user is logged in (poll every 60 s).
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    refreshUnreadCount();
    const id = setInterval(refreshUnreadCount, 60_000);
    return () => clearInterval(id);
  }, [user, refreshUnreadCount]);

  // After login, policyholders need their customer-service customerId for data scoping.
  const fetchCustomerId = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/customers/my-profile");
      const id  = res.data?.customerId ?? res.customerId ?? null;
      if (id) {
        localStorage.setItem("ip_customer_id", String(id));
        setCustomerId(id);
      }
    } catch {
      // Non-policyholder roles won't have a customer profile — that's expected.
    }
  }, []);

  const login = useCallback(async (username, password, totpCode) => {
    const res = await api.post("/api/v1/auth/login", { username, password, totpCode });
    const d   = res.data;
    localStorage.setItem("ip_access",  d.accessToken);
    localStorage.setItem("ip_refresh", d.refreshToken);
    localStorage.setItem("ip_user",    JSON.stringify(d));
    localStorage.setItem("ip_force_pwd_change", String(!!d.forcePasswordChange));
    setUser(d);
    setForcePasswordChange(!!d.forcePasswordChange);

    const roles = d.roles || [];
    const isPolicyholder = roles.includes("ROLE_POLICYHOLDER") || roles.includes("POLICYHOLDER");
    if (isPolicyholder) {
      // Resolve this user's customer record so pages can scope data correctly.
      setTimeout(fetchCustomerId, 0);
    }

    return d;
  }, [fetchCustomerId]);

  const register = useCallback(async (payload) => {
    const res = await api.post("/api/v1/auth/register", payload);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/api/v1/auth/logout"); } catch {}
    clearStorage();
    setUser(null);
    setCustomerId(null);
    setForcePasswordChange(false);
  }, []);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.roles?.includes(`ROLE_${role}`) || user.roles?.includes(role);
  }, [user]);

  const clearForcePasswordChange = useCallback(() => {
    localStorage.setItem("ip_force_pwd_change", "false");
    setForcePasswordChange(false);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, customerId, login, register, logout, hasRole, forcePasswordChange, clearForcePasswordChange, unreadCount, refreshUnreadCount }}>
      {children}
    </AuthCtx.Provider>
  );
}
