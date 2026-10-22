import { useState, useMemo } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Loading, Empty, Badge, fmtCurrency, fmtDate, useApi } from "../components/UI";

// ── Shared helpers ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }) {
  return (
    <div className={`ip-stat-card ${accent}`}>
      <div className="ip-stat-icon">{icon}</div>
      <div className="ip-stat-value">{value}</div>
      <div className="ip-stat-label">{label}</div>
    </div>
  );
}

// ── CSS Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({ bars, height = 130 }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: height, padding: "0 4px" }}>
      {bars.map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{value}</div>
          <div style={{
            width: "100%",
            height: `${Math.max((value / max) * (height - 36), value > 0 ? 4 : 2)}px`,
            background: color,
            borderRadius: "6px 6px 0 0",
            transition: "height 0.5s ease",
            opacity: value === 0 ? 0.25 : 1,
          }} />
          <div style={{ fontSize: 10, color: "var(--quiet)", textAlign: "center", lineHeight: 1.3, wordBreak: "break-word", maxWidth: 60 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Progress bar row ──────────────────────────────────────────────────────────

function ProgressRow({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: "var(--text)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>
          {value} <span style={{ color: "var(--quiet)", fontWeight: 400, fontSize: 11 }}>({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div style={{ height: 7, background: "var(--rim)", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Recent Claims widget ──────────────────────────────────────────────────────

function RecentClaims({ customerId }) {
  const { hasRole } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");
  const filter = customerId ? `&customerId=${customerId}` : "";
  const { data, loading } = useApi(
    () => {
      // Policyholders must have their customerId resolved before we call — otherwise the
      // backend throws 403. Admins/staff always call without a filter (customerId stays null).
      if (isPolicyholder && !customerId) return Promise.resolve([]);
      return api.get(`/api/v1/claims?size=5&sortBy=createdAt&direction=desc${filter}`).then(r => r.data?.content || r.data);
    },
    [customerId, isPolicyholder]
  );
  return (
    <div className="ip-card">
      <div className="ip-card-header">
        <div>
          <div className="ip-card-title">Recent Claims</div>
          <div className="ip-card-sub">{customerId ? "Your latest claims" : "Latest claim submissions"}</div>
        </div>
      </div>
      {loading ? <Loading /> : !data?.length ? <Empty icon="📑" text="No claims yet" /> : (
        <div className="ip-table-wrap">
          <table className="ip-table">
            <thead><tr><th>Claim #</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {data.slice(0, 5).map(c => (
                <tr key={c.claimId}>
                  <td><span className="ip-mono">{c.claimNumber}</span></td>
                  <td>{c.claimType}</td>
                  <td>{fmtCurrency(c.amountRequested)}</td>
                  <td><Badge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Recent Policies widget ────────────────────────────────────────────────────

function RecentPolicies({ customerId }) {
  const { hasRole } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");
  const filter = customerId ? `&customerId=${customerId}` : "";
  const { data, loading } = useApi(
    () => {
      // Policyholders must have their customerId resolved before we call — otherwise the
      // backend throws 403. Admins/staff always call without a filter (customerId stays null).
      if (isPolicyholder && !customerId) return Promise.resolve([]);
      return api.get(`/api/v1/policies?size=5&sortBy=createdAt&direction=desc${filter}`).then(r => r.data?.content || r.data);
    },
    [customerId, isPolicyholder]
  );
  return (
    <div className="ip-card">
      <div className="ip-card-header">
        <div>
          <div className="ip-card-title">Recent Policies</div>
          <div className="ip-card-sub">{customerId ? "Your active policies" : "Latest policy issuances"}</div>
        </div>
      </div>
      {loading ? <Loading /> : !data?.length ? <Empty icon="📋" text="No policies yet" /> : (
        <div className="ip-table-wrap">
          <table className="ip-table">
            <thead><tr><th>Policy #</th><th>Type</th><th>Coverage</th><th>Status</th></tr></thead>
            <tbody>
              {data.slice(0, 5).map(p => (
                <tr key={p.policyId}>
                  <td><span className="ip-mono">{p.policyNumber}</span></td>
                  <td>{p.policyTypeName}</td>
                  <td>{fmtCurrency(p.coverageAmount)}</td>
                  <td><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Policyholder Dashboard ────────────────────────────────────────────────────

function PolicyholderDashboard({ customerId, user, onNavigate }) {
  const { data: profile } = useApi(
    () => customerId
      ? api.get("/api/v1/customers/my-profile").then(r => r.data).catch(() => null)
      : Promise.resolve(null),
    [customerId]
  );

  const greeting = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening";
  const kycVerified = profile?.kycStatus === "VERIFIED";

  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, #0f3460 0%, #16213e 60%, #1a1a2e 100%)",
        borderRadius: 16, padding: "32px 36px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, fontSize: 140, opacity: 0.05 }}>🛡️</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Good {greeting}, {user?.fullName?.split(" ")[0] || "there"} </div>
          <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {kycVerified
              ? <span style={{ background: "rgba(39,174,96,0.2)", border: "1px solid #27ae6060", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#27ae60" }}>✓ KYC Verified</span>
              : <span style={{ background: "rgba(243,156,18,0.2)", border: "1px solid #f39c1260", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#f39c12" }}>⏳ KYC Pending</span>
            }
            {customerId && <span style={{ background: "rgba(52,152,219,0.2)", border: "1px solid #3498db60", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#3498db" }}>Policyholder #{customerId}</span>}
          </div>
        </div>
      </div>

      {!customerId && (
        <div style={{ background: "#fef9e7", border: "1px solid #f39c12", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#856404", marginBottom: 2 }}>Complete Your Profile</div>
            <div style={{ fontSize: 13, color: "#666" }}>Create your policyholder profile to purchase policies and submit claims.</div>
          </div>
          <button className="ip-btn primary" style={{ background: "#f39c12", borderColor: "#f39c12", whiteSpace: "nowrap" }} onClick={() => onNavigate?.("customers")}>
            Create Profile →
          </button>
        </div>
      )}

      {customerId && !kycVerified && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <div style={{ fontSize: 13, color: "#b91c1c" }}>
            <strong>KYC verification pending.</strong> An agent must verify your documents before policies can be issued to you.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { icon: "🛒", label: "Buy Insurance", color: "#3498db", page: "marketplace", hint: "Browse plans" },
          { icon: "📋", label: "My Policies",   color: "#27ae60", page: "policies",    hint: "View coverage" },
          { icon: "📑", label: "File a Claim",  color: "#e74c3c", page: "claims",      hint: "Submit claim" },
          { icon: "💳", label: "Payments",      color: "#8e44ad", page: "payments",    hint: "Pay premium" },
          { icon: "📁", label: "Documents",     color: "#f39c12", page: "documents",   hint: "Manage docs" },
          { icon: "⚙️", label: "My Profile",    color: "#2c3e50", page: "profile",     hint: "Settings" },
        ].map(({ icon, label, color, page, hint }) => (
          <div
            key={page}
            onClick={() => onNavigate?.(page)}
            style={{ background: "#fff", borderRadius: 12, padding: "20px 16px", textAlign: "center", cursor: "pointer", border: "1px solid var(--rim)", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`; e.currentTarget.style.borderColor = color; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "var(--rim)"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: "var(--quiet)" }}>{hint}</div>
          </div>
        ))}
      </div>

      <div className="ip-two-col">
        <RecentPolicies customerId={customerId} />
        <RecentClaims   customerId={customerId} />
      </div>
    </div>
  );
}

// ── Role label formatters ─────────────────────────────────────────────────────

const ROLE_LABELS = {
  ROLE_ADMIN: "Admin",
  ROLE_AGENT: "Agent", ROLE_ADJUSTER: "Claims Adjuster",
  ROLE_UNDERWRITER: "Underwriter", ROLE_COMPLIANCE_OFFICER: "Compliance Officer",
  ROLE_COMPLIANCE: "Compliance Officer", ROLE_FINANCE: "Finance",
  ROLE_POLICYHOLDER: "Policyholder",
};

const STATUS_LABEL = s => {
  const map = {
    SUBMITTED: "Submitted", UNDER_REVIEW: "Under Review", APPROVED: "Approved",
    REJECTED: "Rejected", SETTLED: "Settled", CLOSED: "Closed",
    PENDING_UNDERWRITING: "Pending Underwriting", PARTIALLY_APPROVED: "Partially Approved",
    ACTIVE: "Active", EXPIRED: "Expired", CANCELLED: "Cancelled",
    PENDING: "Pending", IN_PROGRESS: "In Progress", VERIFIED: "Verified",
    INACTIVE: "Inactive", LOCKED: "Locked",
  };
  return map[s] || (s || "—");
};

// ── Admin/Staff search section ────────────────────────────────────────────────

function SearchSection({ title, icon, placeholder, apiPath, columns, renderRow }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, loading } = useApi(
    () => submitted ? api.get(`${apiPath}${submitted ? `&search=${encodeURIComponent(submitted)}` : ""}`).then(r => r.data?.content || r.data || []) : Promise.resolve([]),
    [submitted]
  );

  return (
    <div className="ip-card" style={{ marginBottom: 16 }}>
      <div className="ip-card-header">
        <div className="ip-card-title">{icon} {title}</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          className="ip-input"
          style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--rim)", fontSize: 13 }}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && setSubmitted(query)}
        />
        <button className="ip-btn primary" onClick={() => setSubmitted(query)}>Search</button>
        {submitted && <button className="ip-btn ghost" onClick={() => { setQuery(""); setSubmitted(""); }}>Clear</button>}
      </div>
      {loading ? <Loading /> : !data?.length ? (
        submitted ? <Empty icon="🔍" text="No results found" /> : <div style={{ fontSize: 13, color: "var(--quiet)", textAlign: "center", padding: "20px 0" }}>Enter a search term above</div>
      ) : (
        <div className="ip-table-wrap">
          <table className="ip-table">
            <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{data.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

function AdminDashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all analytics data
  const { data: customersData, loading: loadingCustomers } = useApi(
    () => api.get("/api/v1/customers?page=0&size=5&sortBy=createdAt&direction=desc").then(r => r.data)
  );
  const { data: claimsData, loading: loadingClaims } = useApi(
    () => api.get("/api/v1/claims?page=0&size=200&sortBy=createdAt&direction=desc").then(r => r.data)
  );
  const { data: policiesData, loading: loadingPolicies } = useApi(
    () => api.get("/api/v1/policies?page=0&size=5&sortBy=createdAt&direction=desc").then(r => r.data)
  );
  const { data: staffData, loading: loadingStaff } = useApi(
    () => api.get("/api/v1/auth/users?page=0&size=50").then(r => r.data?.content || r.data || [])
  );

  // Computed stats
  const totalPolicyholders = customersData?.totalElements || 0;
  const totalPolicies      = policiesData?.totalElements  || 0;
  const totalClaims        = claimsData?.totalElements    || 0;

  const claimContent = claimsData?.content || [];

  const claimsByStatus = useMemo(() => {
    const statuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED"];
    return statuses.map(s => ({
      status: s,
      label: STATUS_LABEL(s),
      count: claimContent.filter(c => c.status === s).length,
    }));
  }, [claimContent]);

  const claimStatusColors = {
    SUBMITTED: "#3498db", UNDER_REVIEW: "#f39c12", APPROVED: "#27ae60",
    REJECTED: "#e74c3c", SETTLED: "#8e44ad",
  };

  const policyStatuses = useMemo(() => {
    const content = policiesData?.content || [];
    const all = ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING_UNDERWRITING"];
    return all.map(s => ({
      status: s,
      label: STATUS_LABEL(s),
      count: content.filter(p => p.status === s).length,
    }));
  }, [policiesData]);

  const policyStatusColors = { ACTIVE: "#27ae60", EXPIRED: "#e74c3c", CANCELLED: "#95a5a6", PENDING_UNDERWRITING: "#f39c12" };

  // Staff stats
  const staff = useMemo(() => {
    const list = Array.isArray(staffData) ? staffData : [];
    return list.filter(u => {
      const roles = u.roles || [];
      return !roles.includes("ROLE_POLICYHOLDER") && !roles.includes("POLICYHOLDER");
    });
  }, [staffData]);

  const staffByRole = useMemo(() => {
    const roleMap = {};
    staff.forEach(u => {
      const roles = u.roles || [];
      const primaryRole = roles.find(r => r !== "ROLE_POLICYHOLDER") || "UNKNOWN";
      roleMap[primaryRole] = (roleMap[primaryRole] || 0) + 1;
    });
    return Object.entries(roleMap).map(([role, count]) => ({ role, count, label: ROLE_LABELS[role] || role.replace("ROLE_", "") }));
  }, [staff]);

  const greeting = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening";

  const tabs = [
    { id: "overview",     label: "Overview",          icon: "⬡" },
    { id: "charts",       label: "Analytics Charts",  icon: "📊" },
    { id: "staff",        label: "Staff Performance", icon: "👥" },
    { id: "search",       label: "Search",            icon: "🔍" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="ip-section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="ip-section-title">Good {greeting}, Admin</div>
          <div className="ip-section-sub">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            &nbsp;· System Overview
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="ip-stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="👤" label="Total Policyholders" value={loadingCustomers ? "…" : totalPolicyholders.toLocaleString()} accent="amber" />
        <StatCard icon="📋" label="Total Policies"      value={loadingPolicies  ? "…" : totalPolicies.toLocaleString()}      accent="sapphire" />
        <StatCard icon="📑" label="Total Claims"        value={loadingClaims    ? "…" : totalClaims.toLocaleString()}         accent="emerald" />
        <StatCard icon="👥" label="Staff Members"       value={loadingStaff     ? "…" : staff.length.toLocaleString()}        accent="violet" />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid var(--rim)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 20px", border: "none", cursor: "pointer", fontWeight: 600,
              fontSize: 13, borderRadius: "8px 8px 0 0", transition: "all 0.2s",
              background: activeTab === t.id ? "var(--amber)" : "transparent",
              color: activeTab === t.id ? "#fff" : "var(--quiet)",
              borderBottom: activeTab === t.id ? "2px solid var(--amber)" : "2px solid transparent",
              marginBottom: -2,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div>
          <div className="ip-two-col">
            <RecentPolicies customerId={null} />
            <RecentClaims   customerId={null} />
          </div>

          {/* Recent Policyholders */}
          <div className="ip-card" style={{ marginTop: 0 }}>
            <div className="ip-card-header">
              <div className="ip-card-title">Recent Policyholders</div>
              <button className="ip-btn ghost sm" onClick={() => onNavigate?.("customers")}>View All →</button>
            </div>
            {loadingCustomers ? <Loading /> : !customersData?.content?.length ? <Empty icon="👤" text="No policyholders yet" /> : (
              <div className="ip-table-wrap">
                <table className="ip-table">
                  <thead><tr><th>Name</th><th>Email</th><th>KYC Status</th><th>Registered</th><th>Created By</th></tr></thead>
                  <tbody>
                    {customersData.content.map(c => (
                      <tr key={c.customerId}>
                        <td><strong>{c.fullName}</strong></td>
                        <td style={{ fontSize: 12, color: "var(--quiet)" }}>{c.email}</td>
                        <td><Badge status={c.kycStatus} /></td>
                        <td style={{ fontSize: 12, color: "var(--quiet)" }}>{fmtDate(c.createdAt)}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                            background: c.userId ? "rgba(39,174,96,0.1)" : "rgba(52,152,219,0.1)",
                            color: c.userId ? "#27ae60" : "#3498db",
                          }}>
                            {c.userId ? "Self-Registered" : (c.createdBy ? `By #${c.createdBy}` : "Admin-Created")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHARTS TAB ────────────────────────────────────────────────────── */}
      {activeTab === "charts" && (
        <div>
          <div className="ip-two-col">
            {/* Claims by Status Bar Chart */}
            <div className="ip-card">
              <div className="ip-card-header">
                <div>
                  <div className="ip-card-title">Claims by Status</div>
                  <div className="ip-card-sub">Distribution across all claim statuses</div>
                </div>
              </div>
              {loadingClaims ? <Loading /> : (
                <>
                  <BarChart bars={claimsByStatus.map(s => ({ label: s.label, value: s.count, color: claimStatusColors[s.status] || "#95a5a6" }))} />
                  <div style={{ marginTop: 20 }}>
                    {claimsByStatus.map(s => (
                      <ProgressRow
                        key={s.status}
                        label={s.label}
                        value={s.count}
                        total={Math.max(claimContent.length, 1)}
                        color={claimStatusColors[s.status] || "#95a5a6"}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Policy Status Distribution */}
            <div className="ip-card">
              <div className="ip-card-header">
                <div>
                  <div className="ip-card-title">Policy Status Distribution</div>
                  <div className="ip-card-sub">Active vs expired vs pending policies</div>
                </div>
              </div>
              {loadingPolicies ? <Loading /> : (
                <>
                  <BarChart bars={policyStatuses.map(s => ({ label: s.label, value: s.count, color: policyStatusColors[s.status] || "#95a5a6" }))} />
                  <div style={{ marginTop: 20 }}>
                    {policyStatuses.map(s => (
                      <ProgressRow
                        key={s.status}
                        label={s.label}
                        value={s.count}
                        total={Math.max(policiesData?.content?.length || 0, 1)}
                        color={policyStatusColors[s.status] || "#95a5a6"}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* KYC Verification Chart */}
          <div className="ip-card">
            <div className="ip-card-header">
              <div>
                <div className="ip-card-title">Policyholder KYC Verification Status</div>
                <div className="ip-card-sub">Identity verification completion across all policyholders</div>
              </div>
            </div>
            {loadingCustomers ? <Loading /> : (() => {
              const content = customersData?.content || [];
              const kycCounts = [
                { label: "Verified",     color: "#27ae60", status: "VERIFIED" },
                { label: "Pending",      color: "#f39c12", status: "PENDING" },
                { label: "In Progress",  color: "#3498db", status: "IN_PROGRESS" },
                { label: "Rejected",     color: "#e74c3c", status: "REJECTED" },
                { label: "Expired",      color: "#95a5a6", status: "EXPIRED" },
              ].map(s => ({ ...s, value: content.filter(c => c.kycStatus === s.status).length }));
              const totalKyc = content.length;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div>
                    <BarChart bars={kycCounts.map(s => ({ label: s.label, value: s.value, color: s.color }))} height={110} />
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    {kycCounts.map(s => (
                      <ProgressRow key={s.status} label={s.label} value={s.value} total={Math.max(totalKyc, 1)} color={s.color} />
                    ))}
                    <div style={{ fontSize: 11, color: "var(--quiet)", marginTop: 8 }}>
                      * Showing data from latest {content.length} records of {totalPolicyholders} total
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Staff by Role Chart */}
          <div className="ip-card">
            <div className="ip-card-header">
              <div>
                <div className="ip-card-title">Staff by Role</div>
                <div className="ip-card-sub">Team composition by role type</div>
              </div>
            </div>
            {loadingStaff ? <Loading /> : staffByRole.length === 0 ? <Empty icon="👥" text="No staff data" /> : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <BarChart
                  bars={staffByRole.map(r => ({ label: r.label, value: r.count, color: "#3498db" }))}
                  height={120}
                />
                <div>
                  {staffByRole.map(r => (
                    <ProgressRow key={r.role} label={r.label} value={r.count} total={Math.max(staff.length, 1)} color="#3498db" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STAFF PERFORMANCE TAB ─────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <div>
          {/* Role Summary Cards */}
          <div className="ip-stats-grid" style={{ marginBottom: 20 }}>
            {staffByRole.map(r => (
              <StatCard key={r.role} icon="👤" label={r.label} value={r.count} accent="sapphire" />
            ))}
          </div>

          {/* Staff Members Table */}
          <div className="ip-card">
            <div className="ip-card-header">
              <div>
                <div className="ip-card-title">Staff Directory & Performance</div>
                <div className="ip-card-sub">All non-policyholder system users</div>
              </div>
            </div>
            {loadingStaff ? <Loading /> : staff.length === 0 ? <Empty icon="👥" text="No staff found" /> : (
              <div className="ip-table-wrap">
                <table className="ip-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Member Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(u => {
                      const primaryRole = (u.roles || []).find(r => r !== "ROLE_POLICYHOLDER") || "";
                      return (
                        <tr key={u.userId}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--amber), var(--amber-dim))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
                              }}>
                                {(u.fullName || u.username || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.fullName || u.username}</div>
                                <div style={{ fontSize: 11, color: "var(--quiet)" }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="ip-mono" style={{ fontSize: 12 }}>{u.username}</span></td>
                          <td>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                              background: "rgba(52,152,219,0.1)", color: "#2980b9",
                            }}>
                              {ROLE_LABELS[primaryRole] || primaryRole.replace("ROLE_", "")}
                            </span>
                          </td>
                          <td><Badge status={u.status} /></td>
                          <td style={{ fontSize: 12, color: "var(--quiet)" }}>{fmtDate(u.lastLoginAt) || "Never"}</td>
                          <td style={{ fontSize: 12, color: "var(--quiet)" }}>{fmtDate(u.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Agent Activity */}
          <div className="ip-card" style={{ marginTop: 0 }}>
            <div className="ip-card-header">
              <div>
                <div className="ip-card-title">Agent Activity — Policyholders Created</div>
                <div className="ip-card-sub">Policyholders registered by each agent (latest 5 records)</div>
              </div>
            </div>
            {loadingCustomers ? <Loading /> : (() => {
              const content = customersData?.content || [];
              const agentActivity = {};
              content.forEach(c => {
                if (c.createdBy && !c.userId) {
                  agentActivity[c.createdBy] = (agentActivity[c.createdBy] || 0) + 1;
                }
              });
              const entries = Object.entries(agentActivity);
              if (entries.length === 0) return <Empty icon="📊" text="No agent-created policyholders in recent records" />;
              return (
                <div className="ip-table-wrap">
                  <table className="ip-table">
                    <thead><tr><th>Agent ID</th><th>Policyholders Created</th><th>Contribution</th></tr></thead>
                    <tbody>
                      {entries.sort((a, b) => b[1] - a[1]).map(([agentId, count]) => (
                        <tr key={agentId}>
                          <td><span className="ip-mono">#{agentId}</span></td>
                          <td><strong>{count}</strong></td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: "var(--rim)", borderRadius: 99 }}>
                                <div style={{ height: "100%", width: `${(count / content.length) * 100}%`, background: "var(--amber)", borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 11, color: "var(--quiet)", minWidth: 36 }}>{((count / content.length) * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── SEARCH TAB ────────────────────────────────────────────────────── */}
      {activeTab === "search" && (
        <div>
          {/* Search Policyholders */}
          <SearchSection
            title="Search Policyholders"
            icon="👤"
            placeholder="Search by name, email or phone…"
            apiPath="/api/v1/customers?page=0&size=10"
            columns={["Name", "Email", "Phone", "KYC Status", "Registered"]}
            renderRow={c => (
              <tr key={c.customerId}>
                <td><strong>{c.fullName}</strong></td>
                <td style={{ fontSize: 12 }}>{c.email}</td>
                <td style={{ fontSize: 12 }}>{c.phone}</td>
                <td><Badge status={c.kycStatus} /></td>
                <td style={{ fontSize: 12, color: "var(--quiet)" }}>{fmtDate(c.createdAt)}</td>
              </tr>
            )}
          />

          {/* Search Policies */}
          <SearchSection
            title="Search Policies"
            icon="📋"
            placeholder="Search by policy number or type…"
            apiPath="/api/v1/policies?page=0&size=10"
            columns={["Policy #", "Type", "Coverage", "Premium", "Status"]}
            renderRow={p => (
              <tr key={p.policyId}>
                <td><span className="ip-mono">{p.policyNumber}</span></td>
                <td>{p.policyTypeName}</td>
                <td>{fmtCurrency(p.coverageAmount)}</td>
                <td>{fmtCurrency(p.premiumAmount)}</td>
                <td><Badge status={p.status} /></td>
              </tr>
            )}
          />

          {/* Search Claims */}
          <SearchSection
            title="Search Claims"
            icon="📑"
            placeholder="Search by claim number or type…"
            apiPath="/api/v1/claims?page=0&size=10"
            columns={["Claim #", "Type", "Amount", "Status", "Submitted"]}
            renderRow={c => (
              <tr key={c.claimId}>
                <td><span className="ip-mono">{c.claimNumber}</span></td>
                <td>{c.claimType}</td>
                <td>{fmtCurrency(c.amountRequested)}</td>
                <td><Badge status={c.status} /></td>
                <td style={{ fontSize: 12, color: "var(--quiet)" }}>{fmtDate(c.createdAt)}</td>
              </tr>
            )}
          />

          {/* Search Staff */}
          <div className="ip-card">
            <div className="ip-card-header">
              <div className="ip-card-title">👥 Browse Staff</div>
            </div>
            {loadingStaff ? <Loading /> : staff.length === 0 ? <Empty icon="👥" text="No staff found" /> : (
              <div className="ip-table-wrap">
                <table className="ip-table">
                  <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>
                    {staff.map(u => {
                      const primaryRole = (u.roles || []).find(r => r !== "ROLE_POLICYHOLDER") || "";
                      return (
                        <tr key={u.userId}>
                          <td><strong>{u.fullName}</strong></td>
                          <td><span className="ip-mono">{u.username}</span></td>
                          <td style={{ fontSize: 12, color: "var(--quiet)" }}>{u.email}</td>
                          <td><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "rgba(52,152,219,0.1)", color: "#2980b9" }}>{ROLE_LABELS[primaryRole] || primaryRole.replace("ROLE_", "")}</span></td>
                          <td><Badge status={u.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff Dashboard (for non-admin, non-policyholder staff) ──────────────────

function StaffDashboard({ user }) {
  const roleLabel = () => {
    const map = {
      ROLE_ADMIN: "Admin",
      ROLE_AGENT: "Insurance Agent", ROLE_ADJUSTER: "Claims Adjuster",
      ROLE_UNDERWRITER: "Underwriter", ROLE_COMPLIANCE: "Compliance Officer",
      ROLE_FINANCE: "Finance",
    };
    const role = [...(user?.roles || [])][0] || "";
    return map[role] || role.replace("ROLE_", "");
  };

  const greeting = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening";

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Good {greeting}, {user?.fullName?.split(" ")[0]} </div>
          <div className="ip-section-sub">
            {roleLabel()} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="ip-two-col">
        <RecentClaims   customerId={null} />
        <RecentPolicies customerId={null} />
      </div>
    </div>
  );
}

// ── Root Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
  const { user, hasRole, customerId: myCustomerId } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");
  const isAdmin = hasRole("ADMIN");

  if (isPolicyholder) {
    return <PolicyholderDashboard customerId={myCustomerId} user={user} onNavigate={onNavigate} />;
  }

  if (isAdmin) {
    return <AdminDashboard onNavigate={onNavigate} />;
  }

  return <StaffDashboard user={user} />;
}
