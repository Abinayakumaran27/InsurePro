import { useState } from "react";
import { useAuth } from "../AuthContext";
import { Alert, Spinner } from "../components/UI";
import api from "../api";

function EyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordToggle({ show, onToggle }) {
  return (
    <button type="button" className="ip-eye-btn" onClick={onToggle} tabIndex={-1} aria-label={show ? "Hide password" : "Show password"}>
      {show ? <EyeOpen /> : <EyeClosed />}
    </button>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)           score++;
  if (password.length >= 12)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: "Very Weak",   color: "#C02010" },
    { label: "Weak",        color: "#E06020" },
    { label: "Fair",        color: "#C08000" },
    { label: "Strong",      color: "#1A7A36" },
    { label: "Very Strong", color: "#0D5A28" },
  ];
  const lvl = levels[Math.min(score, 4)];
  return (
    <div className="ip-pwd-strength">
      <div className="ip-pwd-bars">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="ip-pwd-bar" style={{ background: i <= score ? lvl.color : undefined }} />
        ))}
      </div>
      <span style={{ color: lvl.color }}>{lvl.label}</span>
    </div>
  );
}

function ForgotPasswordPanel({ onBack }) {
  const [username,   setUsername]   = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState(""); 
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

  const resetPassword = async () => {
    if (!username.trim()) { setError("Please enter your username."); return; }
    if (!newPwd)          { setError("Please enter a new password."); return; }
    if (newPwd.length < 12) { setError("Password must be at least 12 characters."); return; }
    if (newPwd !== confirmPwd) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      await api.post(
        `/api/v1/auth/reset-password-by-username?username=${encodeURIComponent(username)}&newPassword=${encodeURIComponent(newPwd)}`
      );
      setDone(true);
    } catch (e) {
      setError(e?.data?.message || "Username not found. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="ip-form">
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#1A7A36" }}>Password Reset!</div>
          <div style={{ fontSize: 13, color: "var(--quiet)", marginBottom: 20 }}>
            Your password has been updated. You can now sign in.
          </div>
          <button className="ip-btn primary lg" style={{ width: "100%", justifyContent: "center" }} onClick={onBack}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ip-form">
      <button type="button" onClick={onBack}
        style={{ background: "none", border: "none", color: "var(--amber)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        ← Back to Sign In
      </button>
      <div style={{ marginBottom: 20 }}>
        
        <div style={{ fontSize: 13, color: "var(--quiet)" }}>Enter your username and choose a new password.</div>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      <div className="ip-field">
        <label>Username</label>
        <input
          value={username}
          onChange={e => { setUsername(e.target.value); setError(""); }}
          placeholder="Enter your username"
          autoComplete="username"
        />
      </div>
      <div className="ip-field">
        <label>New Password</label>
        <div className="ip-password-wrap">
          <input
            type={showPwd ? "text" : "password"}
            value={newPwd}
            onChange={e => { setNewPwd(e.target.value); setError(""); }}
            placeholder="Min 12 characters"
            autoComplete="new-password"
          />
          <PasswordToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} />
        </div>
        <PasswordStrength password={newPwd} />
      </div>
      <div className="ip-field">
        <label>Confirm New Password</label>
        <div className="ip-password-wrap">
          <input
            type={showPwd ? "text" : "password"}
            value={confirmPwd}
            onChange={e => { setConfirmPwd(e.target.value); setError(""); }}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            onKeyDown={e => e.key === "Enter" && resetPassword()}
            style={
              confirmPwd && newPwd === confirmPwd ? { borderColor: "#1A7A36", boxShadow: "0 0 0 3px rgba(26,122,54,0.1)" } :
              confirmPwd && newPwd !== confirmPwd ? { borderColor: "#C02010", boxShadow: "0 0 0 3px rgba(192,32,16,0.1)" } : {}
            }
          />
          <PasswordToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} />
        </div>
        {confirmPwd && newPwd === confirmPwd && <div className="ip-field-hint success">✓ Passwords match</div>}
        {confirmPwd && newPwd !== confirmPwd && <div className="ip-field-hint error">Passwords do not match</div>}
      </div>
      <button className="ip-btn primary lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        onClick={resetPassword} disabled={loading}>
        {loading ? <Spinner /> : "Reset Password"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { login, register } = useAuth();

  // tab: "login" | "register" | "forgot"
  const [tab,   setTab]   = useState("login");
  const [form,  setForm]  = useState({
    username: "", password: "", confirmPassword: "",
    email: "", fullName: "", phone: "", totpCode: "",
  });
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState("");
  const [showPwd,        setShowPwd]        = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [fieldErrs,      setFieldErrs]      = useState({});

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (fieldErrs[k]) setFieldErrs(fe => { const n = { ...fe }; delete n[k]; return n; });
  };
  const FieldErr = ({ name }) => fieldErrs[name]
    ? <div style={{ color: "#C02010", fontSize: 12, marginTop: 4 }}>{fieldErrs[name]}</div>
    : null;

  const switchTab = t => { setTab(t); setError(""); setSuccess(""); setFieldErrs({}); };

  const doLogin = async () => {
    if (!form.username || !form.password) { setError("Please enter your username and password."); return; }
    setError(""); setLoading(true);
    try {
      await login(form.username, form.password, form.totpCode);
    } catch (e) {
      setError(e?.data?.message || "We could not verify your credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    const fe = {};
    if (!form.fullName.trim()) fe.fullName = "Full name is required.";
    if (!form.username.trim()) fe.username = "Username is required.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim())       fe.email = "Email address is required.";
    else if (!emailRe.test(form.email)) fe.email = "Please enter a valid email address.";
    if (form.phone.trim() && !/^\+?[\d\s\-(). ]{7,20}$/.test(form.phone.trim()))
      fe.phone = "Phone number is not valid. Use format: +91 98765 43210";
    if (!form.password)           fe.password = "Password is required.";
    else if (form.password.length < 12) fe.password = "Password must be at least 12 characters.";
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
      fe.confirmPassword = "Passwords do not match. Please re-enter.";
    if (Object.keys(fe).length) { setFieldErrs(fe); setError(""); return; }
    setError(""); setFieldErrs({}); setLoading(true);
    try {
      await register({ ...form, role: "ROLE_POLICYHOLDER" });
      setSuccess("Your account has been created. You can now sign in.");
      switchTab("login");
      setForm(f => ({ ...f, password: "", confirmPassword: "" }));
    } catch (e) {
      const d = e?.data || {};
      if (d.fieldErrors?.length) {
        const serverFe = {};
        d.fieldErrors.forEach(fe => { if (fe.field) serverFe[fe.field] = fe.message; });
        if (Object.keys(serverFe).length) { setFieldErrs(serverFe); return; }
      }
      setError(d.message || "We could not complete your registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch    = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const formTitle = tab === "login" ? "Welcome back" : tab === "register" ? "Create your account" : "Reset password";
  const formSub = tab === "login" ? "Sign in to access your dashboard." : tab === "register" ? "Fill in your details to get started." : "";
  return (
    <div className="ip-login-page">
      <div className="ip-login-bg" />

      <div className="ip-login-panel">

        {/* ── Left brand panel ── */}
        <div className="ip-login-brand">
          <div className="ip-brand-top">
            <div className="ip-brand-logo">
              <div className="ip-brand-logo-icon">🛡️</div>
              <div className="ip-brand-logo-text">InsurePro</div>
            </div>
            <div className="ip-brand-headline">Your complete insurance management solution</div>
            <div className="ip-brand-sub">
              Empowering insurers, brokers, and policyholders with a unified platform built for the modern enterprise.
            </div>
            <ul className="ip-brand-features">
              <li>Policy administration and lifecycle management</li>
              <li>End-to-end claims processing and settlement</li>
              <li>Regulatory compliance and audit reporting</li>
              <li>Real-time analytics and performance insights</li>
              <li>Role-based access for every team member</li>
            </ul>
          </div>
          <div className="ip-brand-bottom">
            <div className="ip-brand-tagline">Trusted by insurance professionals across the industry</div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="ip-login-form-panel">
          <div className="ip-login-form-header">
            <div className="ip-login-form-title">{formTitle}</div>
            <div className="ip-login-form-sub">{formSub}</div>
          </div>

          {/* Tabs — only show Sign In / Register, not for forgot */}
          {tab !== "forgot" && (
            <div className="ip-login-tabs">
              <div className={`ip-login-tab${tab === "login" ? " active" : ""}`} onClick={() => switchTab("login")}>Sign In</div>
              <div className={`ip-login-tab${tab === "register" ? " active" : ""}`} onClick={() => switchTab("register")}>Register</div>
            </div>
          )}

          {error   && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          {/* ── Forgot Password panel ── */}
          {tab === "forgot" && (
            <ForgotPasswordPanel onBack={() => switchTab("login")} />
          )}

          {/* ── Sign In form ── */}
          {tab === "login" && (
            <div className="ip-form">
              <div className="ip-field">
                <label>Username</label>
                <input
                  value={form.username}
                  onChange={set("username")}
                  placeholder="Enter your username"
                  autoComplete="username"
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                />
              </div>

              <div className="ip-field">
                <label>
                  <span style={{ flex: 1 }}>Password</span>
                </label>
                <div className="ip-password-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    onKeyDown={e => e.key === "Enter" && doLogin()}
                  />
                  <PasswordToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} />
                </div>
                {/* Forgot password link sits just below the password field */}
                <div style={{ textAlign: "right", marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => switchTab("forgot")}
                    style={{ background: "none", border: "none", color: "var(--amber)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="ip-field">
                <label>
                  Verification Code&nbsp;
                  <span style={{ color: "var(--ink-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(if enabled)</span>
                </label>
                <input
                  value={form.totpCode}
                  onChange={set("totpCode")}
                  placeholder="6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                  onKeyDown={e => e.key === "Enter" && doLogin()}
                />
              </div>

              <button
                className="ip-btn primary lg"
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                onClick={doLogin}
                disabled={loading}
              >
                {loading ? <Spinner /> : "Sign In"}
              </button>
            </div>
          )}

          {/* ── Register form ── */}
          {tab === "register" && (
            <div className="ip-form">
              <div className="ip-field">
                <label>Full Name</label>
                <input value={form.fullName} onChange={set("fullName")} placeholder="Enter your full name" autoComplete="name" style={fieldErrs.fullName ? { borderColor: "#C02010" } : {}} />
                <FieldErr name="fullName" />
              </div>

              <div className="ip-form-row">
                <div className="ip-field">
                  <label>Username</label>
                  <input value={form.username} onChange={set("username")} placeholder="Enter a username" autoComplete="username" style={fieldErrs.username ? { borderColor: "#C02010" } : {}} />
                  <FieldErr name="username" />
                </div>
                <div className="ip-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="Enter your email address" autoComplete="email" style={fieldErrs.email ? { borderColor: "#C02010" } : {}} />
                  <FieldErr name="email" />
                </div>
              </div>

              <div className="ip-field">
                <label>Phone</label>
                <input value={form.phone} onChange={set("phone")} placeholder="Enter your mobile number" autoComplete="tel" style={fieldErrs.phone ? { borderColor: "#C02010" } : {}} />
                <FieldErr name="phone" />
              </div>

              <div className="ip-field">
                <label>Password</label>
                <div className="ip-password-wrap">
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Create a strong password" autoComplete="new-password" style={fieldErrs.password ? { borderColor: "#C02010" } : {}} />
                  <PasswordToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} />
                </div>
                <PasswordStrength password={form.password} />
                <FieldErr name="password" />
              </div>

              <div className="ip-field">
                <label>Confirm Password</label>
                <div className="ip-password-wrap">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    style={
                      fieldErrs.confirmPassword ? { borderColor: "#C02010", boxShadow: "0 0 0 3px rgba(192,32,16,0.1)" } :
                      passwordsMismatch ? { borderColor: "#C02010", boxShadow: "0 0 0 3px rgba(192,32,16,0.1)" } :
                      passwordsMatch    ? { borderColor: "#1A7A36", boxShadow: "0 0 0 3px rgba(26,122,54,0.1)" } : {}
                    }
                  />
                  <PasswordToggle show={showConfirmPwd} onToggle={() => setShowConfirmPwd(v => !v)} />
                </div>
                {fieldErrs.confirmPassword
                  ? <div className="ip-field-hint error">{fieldErrs.confirmPassword}</div>
                  : passwordsMismatch ? <div className="ip-field-hint error">Passwords do not match</div>
                  : passwordsMatch    ? <div className="ip-field-hint success">✓ Passwords match</div>
                  : null}
              </div>

              <button
                className="ip-btn primary lg"
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                onClick={doRegister}
                disabled={loading}
              >
                {loading ? <Spinner /> : "Create Account"}
              </button>
            </div>
          )}

          <div className="ip-login-footer-note">
            © {new Date().getFullYear()} InsurePro. All rights reserved.
          </div>
        </div>

      </div>
    </div>
  );
}