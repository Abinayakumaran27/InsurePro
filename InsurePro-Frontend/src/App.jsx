import { useState, Component } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import STYLES from "./styles";
import { Modal } from "./components/UI";

import LoginPage    from "./pages/LoginPage";
import Dashboard    from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import PoliciesPage  from "./pages/PoliciesPage";
import ClaimsPage    from "./pages/ClaimsPage";
import PaymentsPage  from "./pages/PaymentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import { UnderwritingPage }  from "./pages/UnderwritingPage";
import { AnalyticsPage, AuditPage, NotificationsPage, UsersPage, ProfilePage, ForceChangePasswordPage } from "./pages/OtherPages";
import PolicyMarketPage from "./pages/PolicyMarketPage";

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",      label: "Dashboard",       icon: "⬡",  roles: [] },
  { section: "Operations" },
  { id: "marketplace",    label: "Buy Insurance",    icon: "🛒", roles: ["POLICYHOLDER"] },
  { id: "customers",      label: "Policyholders",   icon: "👤", roles: ["ADMIN","AGENT","ADJUSTER","UNDERWRITER","COMPLIANCE"] },
  { id: "policies",       label: "Policies",        icon: "📋", roles: ["ADMIN","AGENT","POLICYHOLDER","UNDERWRITER","ADJUSTER"] },
  { id: "claims",         label: "Claims",          icon: "📑", roles: ["ADMIN","AGENT","POLICYHOLDER","ADJUSTER","COMPLIANCE"] },
  { section: "Finance" },
  { id: "payments",       label: "Payments",        icon: "💳", roles: ["ADMIN","FINANCE","AGENT","POLICYHOLDER"] },
  { section: "Risk & Compliance" },
  { id: "underwriting",   label: "Underwriting",    icon: "🔬", roles: ["ADMIN","UNDERWRITER"] },
  { id: "documents",      label: "Documents",       icon: "📁", roles: ["ADMIN","AGENT","ADJUSTER","UNDERWRITER","POLICYHOLDER"] },
  { id: "audit",          label: "Audit Logs",      icon: "🔍", roles: ["ADMIN","COMPLIANCE"] },
  { section: "Intelligence" },
  { id: "analytics",      label: "Analytics",       icon: "📊", roles: ["ADMIN","FINANCE","COMPLIANCE"] },
  { id: "notifications",  label: "Notifications",   icon: "🔔", roles: [] },
  { section: "Admin" },
  { id: "users",          label: "User Management", icon: "👥", roles: ["ADMIN"] },
  { id: "profile",        label: "My Profile",      icon: "⚙",  roles: [] },
];

const PAGE_MAP = {
  dashboard:     Dashboard,
  customers:     CustomersPage,
  policies:      PoliciesPage,
  claims:        ClaimsPage,
  payments:      PaymentsPage,
  underwriting:  UnderwritingPage,
  documents:     DocumentsPage,
  marketplace:   PolicyMarketPage,
  audit:         AuditPage,
  analytics:     AnalyticsPage,
  notifications: NotificationsPage,
  users:         UsersPage,
  profile:       ProfilePage,
};

const PAGE_TITLES = {
  dashboard:     "Dashboard",
  customers:     "Policyholders",
  policies:      "Policies",
  claims:        "Claims",
  payments:      "Payments",
  underwriting:  "Underwriting",
  documents:     "Documents",
  marketplace:   "Insurance Marketplace",
  audit:         "Audit Logs",
  analytics:     "Analytics",
  notifications: "Notifications",
  users:         "User Management",
  profile:       "My Profile",
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY  — catches render errors in the page subtree
// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ color: "var(--danger, #e74c3c)", marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "var(--ghost, #888)", marginBottom: 20 }}>{this.state.error?.message}</p>
          <button
            className="ip-btn primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL  (sidebar + topbar + page content)
// ─────────────────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, logout, hasRole, unreadCount } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const canView = roles => !roles?.length || roles.some(r => hasRole(r));

  const PageComponent = PAGE_MAP[page] || Dashboard;

  const initials = (user?.fullName || user?.username || "?")
    .split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const roleDisplay = [...(user?.roles || [])][0]?.replace("ROLE_","") || "USER";

  return (
    <div className="ip-app">
      {/* ── Sidebar ── */}
      <nav className="ip-sidebar">
        <div className="ip-logo">
          <div className="ip-logo-icon">🛡️</div>
          <div className="ip-logo-text">Insure<span>Pro</span></div>
        </div>

        <div className="ip-nav">
          {NAV_ITEMS.map((item, idx) => {
            if (item.section) return <div key={idx} className="ip-nav-section">{item.section}</div>;
            if (!canView(item.roles)) return null;
            return (
              <div
                key={item.id}
                className={`ip-nav-item${page === item.id ? " active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="ip-nav-badge">{unreadCount}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="ip-user-card">
          <div className="ip-user-avatar">{initials}</div>
          <div className="ip-user-info">
            <div className="ip-user-name">{user?.fullName || user?.username}</div>
            <div className="ip-user-role">{roleDisplay}</div>
          </div>
          <span className="ip-logout-btn" title="Logout" onClick={() => setShowLogoutConfirm(true)}>⏻</span>
        </div>
      </nav>

      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Logout"
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
            <button className="ip-btn primary" onClick={logout}>Log Out</button>
          </>
        }
      >
        <p style={{ margin: "8px 0 16px", fontSize: 15 }}>Are you sure you want to log out?</p>
      </Modal>

      {/* ── Main ── */}
      <div className="ip-main">
        <div className="ip-topbar">
          <div className="ip-topbar-title">{PAGE_TITLES[page]}</div>
          <div className="ip-topbar-actions">
            <div className="ip-notif-btn" onClick={() => setPage("notifications")}>
              🔔{unreadCount > 0 && <span className="ip-notif-dot" />}
            </div>
          </div>
        </div>
        <div className="ip-content">
          <ErrorBoundary key={page}>
            <PageComponent onNavigate={setPage} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER  (login vs app shell)
// ─────────────────────────────────────────────────────────────────────────────
function AppRouter() {
  const { user, forcePasswordChange } = useAuth();
  if (!user) return <LoginPage />;
  if (forcePasswordChange) return <ForceChangePasswordPage />;
  return <AppShell />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <AppRouter />
    </AuthProvider>
  );
}
