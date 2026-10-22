// ─── AnalyticsPage ───────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../AuthContext";
import api, { BASE_URL } from "../api";
import { Loading, Empty, Badge, Alert, Spinner, Modal, Pagination, DetailGrid, useApi, fmtDate } from "../components/UI";

const KPI_NAMES = ["TOTAL_CLAIMS","APPROVED_CLAIMS","SETTLED_CLAIMS","PREMIUM_COLLECTION","CLAIM_RATIO"];
const REPORT_TYPES = ["MONTHLY","QUARTERLY","ANNUAL"];
const REPORT_SCOPES = ["", "ALL","HEALTH","LIFE","MOTOR","TRAVEL","PROPERTY"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseMetrics(metricsJson) {
  if (!metricsJson) return "—";
  try {
    const obj = typeof metricsJson === "string" ? JSON.parse(metricsJson) : metricsJson;
    const labelMap = {
      totalClaims: "Total Claims", approvedClaims: "Approved", settledClaims: "Settled",
      rejectedClaims: "Rejected", pendingClaims: "Pending",
      claimRatio: "Claim Ratio", settlementRatio: "Settlement Ratio",
      approvalRate: "Approval Rate", premiumCollection: "Premium Collection",
    };
    const parts = Object.entries(obj)
      .filter(([k]) => k !== "unit" && k !== "currency" && k !== "note")
      .map(([k, v]) => {
        const label = labelMap[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
        const val   = typeof v === "number" && k.toLowerCase().includes("rate") ? `${v}%`
                    : typeof v === "number" && k.toLowerCase().includes("premium") ? `₹${v}`
                    : String(v);
        return `${label}: ${val}`;
      });
    return parts.join(" · ") || JSON.stringify(obj);
  } catch { return typeof metricsJson === "string" ? metricsJson : JSON.stringify(metricsJson); }
}

function parseScopeJson(scopeJson) {
  if (!scopeJson) return "ALL";
  try {
    const obj = typeof scopeJson === "string" ? JSON.parse(scopeJson) : scopeJson;
    return obj.scope || JSON.stringify(obj);
  } catch { return typeof scopeJson === "string" ? scopeJson : "—"; }
}

function MetricBar({ label, value, max, color, icon }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-light)", display: "flex", gap: 6, alignItems: "center" }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {value} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--quiet)" }}>/ {max}</span>
        </span>
      </div>
      <div style={{ height: 8, background: "var(--rim-solid)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: color,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <div style={{ fontSize: 10, color: "var(--quiet)", marginTop: 3, textAlign: "right" }}>{pct.toFixed(1)}%</div>
    </div>
  );
}

function RateGauge({ label, value, color, icon, description }) {
  const pct = Math.min(100, parseFloat(value) || 0);
  return (
    <div style={{
      background: "var(--raise)", border: "1px solid var(--rim)", borderRadius: 12, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--quiet)" }}>{label}</div>
          <div style={{ fontSize: 10, color: "var(--ink-muted)" }}>{description}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 22, fontWeight: 800, color, fontFamily: "var(--font-head)", fontStyle: "italic" }}>
          {pct.toFixed(1)}%
        </div>
      </div>
      <div style={{ height: 10, background: "var(--rim-solid)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 99, transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "var(--quiet)" }}>0%</span>
        <span style={{ fontSize: 10, color: "var(--quiet)" }}>100%</span>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { hasRole } = useAuth();
  const [reportForm,     setReportForm]     = useState({ kpiName: "TOTAL_CLAIMS", reportType: "MONTHLY", scope: "" });
  const [generating,     setGenerating]     = useState(false);
  const [genErr,         setGenErr]         = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [genSuccess,     setGenSuccess]     = useState("");

  const { data: kpis, loading: kpiLoading, error: kpiError, reload: reloadKpis } = useApi(
    () => api.get("/api/v1/analytics/kpis").then(r => r.data)
  );
  const { data: reports, loading: reportsLoading, reload: reloadReports } = useApi(
    () => api.get("/api/v1/analytics/reports?page=0&size=20").then(r => r.data?.content || r.data || [])
  );
  const reload = () => { reloadKpis(); reloadReports(); };

  const generate = async () => {
    setGenerating(true); setGenErr("");
    try {
      const params = new URLSearchParams({ kpiName: reportForm.kpiName, reportType: reportForm.reportType });
      if (reportForm.scope) params.set("scope", reportForm.scope);
      await api.post(`/api/v1/analytics/reports?${params.toString()}`);
      setGenSuccess(`${reportForm.kpiName.replace(/_/g, " ")} report generated — scroll down to view it.`);
      reload();
    } catch (e) { setGenErr(e?.data?.message || "Failed to generate report. Please try again."); }
    finally { setGenerating(false); }
  };

  const kpiList = Array.isArray(kpis) ? kpis : [];
  const kpiMap  = {};
  kpiList.forEach(k => { kpiMap[k.kpiName] = k; });

  const total        = parseInt(kpiMap.TOTAL_CLAIMS?.value    || 0);
  const approved     = parseInt(kpiMap.APPROVED_CLAIMS?.value || 0);
  const settled      = parseInt(kpiMap.SETTLED_CLAIMS?.value  || 0);
  const rejected     = parseInt(kpiMap.REJECTED_CLAIMS?.value || 0);
  const pending      = parseInt(kpiMap.PENDING_CLAIMS?.value  || 0);
  const approvalRate = kpiMap.APPROVAL_RATE?.value   || "0.0";
  const settleRate   = kpiMap.SETTLEMENT_RATE?.value || "0.0";

  const KPI_HERO = [
    { label: "Total Claims",   value: total,    icon: "📋", color: "sapphire",  accent: "#1A6E9A" },
    { label: "Approved",       value: approved, icon: "✅", color: "emerald",   accent: "#1A7A36" },
    { label: "Settled",        value: settled,  icon: "💰", color: "amber",     accent: "#FFAA00" },
    { label: "Rejected",       value: rejected, icon: "❌", color: "crimson",   accent: "#C02010" },
    { label: "Pending Review", value: pending,  icon: "⏳", color: "violet",    accent: "#6B3FA0" },
  ];

  const KPI_NAME_LABELS = {
    TOTAL_CLAIMS: "Total Claims", APPROVED_CLAIMS: "Approved Claims",
    SETTLED_CLAIMS: "Settled Claims", REJECTED_CLAIMS: "Rejected Claims",
    PENDING_CLAIMS: "Pending Claims", APPROVAL_RATE: "Approval Rate",
    SETTLEMENT_RATE: "Settlement Rate", CLAIM_RATIO: "Claim Ratio",
    PREMIUM_COLLECTION: "Premium Collection",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header ── */}
      <div className="ip-section-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="ip-section-title">Analytics & Reports</div>
          <div className="ip-section-sub">Live KPI dashboards · Claim pipeline health · Report generation</div>
        </div>
        <button className="ip-btn secondary" onClick={reload} style={{ gap: 6 }}>
          ↻ Refresh Data
        </button>
      </div>

      {/* ── KPI Hero Cards ── */}
      {kpiLoading ? <Loading /> : kpiError ? <Alert type="error">{kpiError}</Alert> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14 }}>
          {KPI_HERO.map(({ label, value, icon, color, accent }) => (
            <div key={label} className={`ip-stat-card ${color}`} style={{ padding: "20px 18px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <div className="ip-stat-value" style={{ fontSize: 32, color: accent }}>{value}</div>
              <div className="ip-stat-label" style={{ marginTop: 6, color: "var(--quiet)" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pipeline Health ── */}
      {!kpiLoading && !kpiError && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Claims volume breakdown */}
          <div className="ip-card" style={{ padding: "22px 24px" }}>
            <div className="ip-card-header" style={{ marginBottom: 20 }}>
              <div className="ip-card-title">Claims Volume Breakdown</div>
              <div style={{ fontSize: 11, color: "var(--quiet)" }}>of {total} total</div>
            </div>
            {total === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--quiet)", fontSize: 13 }}>No claims data yet</div>
            ) : (
              <>
                <MetricBar label="Approved"       value={approved} max={total} color="#1A7A36" icon="✅" />
                <MetricBar label="Settled"        value={settled}  max={total} color="#FFAA00" icon="💰" />
                <MetricBar label="Pending Review" value={pending}  max={total} color="#6B3FA0" icon="⏳" />
                <MetricBar label="Rejected"       value={rejected} max={total} color="#C02010" icon="❌" />
              </>
            )}
          </div>

          {/* Rate gauges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RateGauge
              label="Approval Rate"
              value={approvalRate}
              color="#1A7A36"
              icon="🎯"
              description="Approved claims out of total"
            />
            <RateGauge
              label="Settlement Rate"
              value={settleRate}
              color="#FFAA00"
              icon="💳"
              description="Settled claims out of total"
            />
            {/* Health Score card */}
            <div style={{
              background: "linear-gradient(135deg, var(--sun-gold) 0%, var(--sun-orange) 100%)",
              borderRadius: 12, padding: "16px 18px", color: "white",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", opacity: 0.85, marginBottom: 6 }}>CLAIMS HEALTH SCORE</div>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--font-head)", fontStyle: "italic", lineHeight: 1 }}>
                {total === 0 ? "—" : `${Math.round((parseFloat(approvalRate) + parseFloat(settleRate)) / 2)}%`}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                avg of approval & settlement rates
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Report ── */}
      {(hasRole("ADMIN") || hasRole("COMPLIANCE") || hasRole("FINANCE")) && (
        <div className="ip-card">
          <div className="ip-card-header">
            <div>
              <div className="ip-card-title">Generate Report</div>
              <div className="ip-card-sub">Snapshot the current KPI data into a persisted report record</div>
            </div>
          </div>
          {genErr && <Alert type="error">{genErr}</Alert>}
          <div className="ip-form">
            <div className="ip-form-row three">
              <div className="ip-field">
                <label>KPI Metric</label>
                <select value={reportForm.kpiName} onChange={e => setReportForm(f => ({ ...f, kpiName: e.target.value }))}>
                  {KPI_NAMES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>Report Period</label>
                <select value={reportForm.reportType} onChange={e => setReportForm(f => ({ ...f, reportType: e.target.value }))}>
                  {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>Scope (optional)</label>
                <select value={reportForm.scope} onChange={e => setReportForm(f => ({ ...f, scope: e.target.value }))}>
                  {REPORT_SCOPES.map(s => <option key={s} value={s}>{s || "All"}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="ip-btn primary" onClick={generate} disabled={generating}>
                {generating ? <><Spinner /> Generating…</> : "📊 Generate Report"}
              </button>
              <span style={{ fontSize: 12, color: "var(--quiet)" }}>
                Reports capture a live snapshot of the selected KPI right now
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Generated Reports History ── */}
      <div className="ip-card">
        <div className="ip-card-header">
          <div>
            <div className="ip-card-title">Generated Reports</div>
            <div className="ip-card-sub">{reports?.length || 0} report{reports?.length !== 1 ? "s" : ""} on record</div>
          </div>
        </div>

        {genSuccess && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(76,217,100,0.1)", border: "1px solid rgba(76,217,100,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1A7A36",
          }}>
            <span>✅ {genSuccess}</span>
            <button onClick={() => setGenSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700, fontSize: 14 }}>✕</button>
          </div>
        )}

        {reportsLoading ? <Loading /> : !reports?.length ? (
          <Empty icon="📊" text="No reports generated yet — use the Generate Report form above" />
        ) : (
          <div className="ip-table-wrap">
            <table className="ip-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>KPI</th>
                  <th>Period</th>
                  <th>Scope</th>
                  <th>Key Metrics</th>
                  <th>Generated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.reportId}>
                    <td><span className="ip-mono">{r.reportId}</span></td>
                    <td>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 99,
                        background: "rgba(255,170,0,0.12)", color: "#8A5A00",
                        fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,170,0,0.3)",
                      }}>
                        {KPI_NAME_LABELS[r.kpiName] || r.kpiName}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--quiet)" }}>
                      {fmtDate(r.periodStart)} → {fmtDate(r.periodEnd)}
                    </td>
                    <td>
                      <Badge status={parseScopeJson(r.scope)} />
                    </td>
                    <td style={{ fontSize: 12, color: "var(--ink-muted)", maxWidth: 260, whiteSpace: "normal", lineHeight: 1.5 }}>
                      {parseMetrics(r.metrics)}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--quiet)", whiteSpace: "nowrap" }}>
                      {fmtDate(r.generatedAt)}
                    </td>
                    <td>
                      <button className="ip-btn ghost sm" onClick={() => setSelectedReport(r)}>Details →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Report Detail Modal ── */}
      <Modal
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `Report #${selectedReport.reportId} — ${KPI_NAME_LABELS[selectedReport?.kpiName] || selectedReport?.kpiName}` : "Report Details"}
        footer={<button className="ip-btn ghost" onClick={() => setSelectedReport(null)}>Close</button>}
      >
        {selectedReport && (() => {
          let metricsObj = {};
          try { metricsObj = typeof selectedReport.metrics === "string" ? JSON.parse(selectedReport.metrics) : (selectedReport.metrics || {}); } catch {}
          const metricLabelMap = {
            totalClaims: { label: "Total Claims", icon: "📋", color: "#1A6E9A" },
            approvedClaims: { label: "Approved Claims", icon: "✅", color: "#1A7A36" },
            settledClaims: { label: "Settled Claims", icon: "💰", color: "#FFAA00" },
            rejectedClaims: { label: "Rejected Claims", icon: "❌", color: "#C02010" },
            pendingClaims: { label: "Pending Claims", icon: "⏳", color: "#6B3FA0" },
            approvalRate: { label: "Approval Rate", icon: "🎯", color: "#1A7A36" },
            settlementRate: { label: "Settlement Rate", icon: "💳", color: "#FFAA00" },
            claimRatio: { label: "Claim Ratio", icon: "📈", color: "#1A6E9A" },
            settlementRatio: { label: "Settlement Ratio", icon: "📊", color: "#FFAA00" },
            premiumCollection: { label: "Premium Collection", icon: "💎", color: "#6B3FA0" },
          };
          const primaryMetrics = Object.entries(metricsObj).filter(([k]) => k !== "unit" && k !== "currency" && k !== "note");
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Meta info strip */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Period", value: `${fmtDate(selectedReport.periodStart)} → ${fmtDate(selectedReport.periodEnd)}` },
                  { label: "Scope", value: parseScopeJson(selectedReport.scope) },
                  { label: "Generated", value: fmtDate(selectedReport.generatedAt) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "var(--raise)", border: "1px solid var(--rim)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--quiet)", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-light)" }}>{value}</div>
                  </div>
                ))}
              </div>
              {/* Metrics spotlight */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--quiet)", marginBottom: 10 }}>Snapshot Metrics</div>
                {primaryMetrics.length === 0 ? (
                  <div style={{ color: "var(--quiet)", fontSize: 13, padding: "12px 0" }}>No metric data recorded.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {primaryMetrics.map(([k, v]) => {
                      const meta  = metricLabelMap[k] || { label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()), icon: "📌", color: "var(--ink-muted)" };
                      const isRate = k.toLowerCase().includes("rate") || k.toLowerCase().includes("ratio");
                      const displayVal = isRate ? `${v}%` : typeof v === "number" && k.toLowerCase().includes("premium") ? `₹${v}` : String(v);
                      return (
                        <div key={k} style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}30`, borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>{meta.icon}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--quiet)" }}>{meta.label}</span>
                          </div>
                          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-head)", fontStyle: "italic", color: meta.color }}>
                            {displayVal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Notes */}
              {metricsObj.note && (
                <div style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#8A5A00" }}>
                  ℹ️ {metricsObj.note}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

// ─── AuditPage ────────────────────────────────────────────────────────────────
export function AuditPage() {
  const [page,    setPage]    = useState(0);
 const [filters, setFilters] = useState({ userId: "", action: "", resource: "" });
 const [applied, setApplied] = useState({});
  const buildQuery = () => {
    const p = new URLSearchParams({ page, size: 20 });
    Object.entries(applied).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  };

  const { data, loading } = useApi(
    () => api.get(`/api/v1/audit-logs?${buildQuery()}`).then(r => r.data),
    [page, JSON.stringify(applied)]
  );

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Audit Logs</div>
          <div className="ip-section-sub">Immutable system activity log</div>
        </div>
        <button className="ip-btn secondary"
          onClick={() => window.open(`${BASE_URL}/api/v1/audit-logs/export?${new URLSearchParams(applied)}`, "_blank")}>
          ↓ Export CSV
        </button>
      </div>

      <div className="ip-card" style={{ marginBottom: 16 }}>
        <div className="ip-search-bar">
          <div className="ip-field">
            <label>User ID</label>
            <input value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} placeholder="Filter by user" />
          </div>
          <div className="ip-field">
            <label>Action</label>
            <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
              <option value="">All Actions</option>
              {[
                "POLICY_CREATED", "POLICY_ENDORSED",
                "CLAIM_SUBMITTED", "CLAIM_STATUS_UPDATED",
                "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_DELETED",
                "KYC_STATUS_UPDATED",
                "USER_LOGIN", "USER_LOGOUT"
              ].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="ip-field">
            <label>Resource Type</label>
            <input value={filters.resource} onChange={e => setFilters(f => ({ ...f, resource: e.target.value }))} placeholder="POLICY, CLAIM..." />
          </div>
          <button className="ip-btn primary" style={{ alignSelf: "flex-end" }} onClick={() => { setApplied({ ...filters }); setPage(0); }}>Filter</button>
          <button className="ip-btn ghost"   style={{ alignSelf: "flex-end" }} onClick={() => { setFilters({ userId: "", action: "", resource: "" }); setApplied({}); setPage(0); }}>Clear</button>
        </div>
      </div>

      <div className="ip-card">
        {loading ? <Loading /> : !data ? <Empty /> : (
          <>
            <div className="ip-table-wrap">
              <table className="ip-table">
                <thead><tr><th>Audit ID</th><th>User</th><th>Action</th><th>Resource</th><th>Resource ID</th><th>IP Address</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {(data.content || data).map(l => (
                    <tr key={l.auditId}>
                      <td>{l.auditId}</td>
                      <td>{l.userId}</td>
                      <td>
                        <span style={{ color: l.action === "DELETE" ? "var(--crimson)" : l.action === "CREATE" ? "var(--emerald)" : "var(--amber)", fontWeight: 600, fontSize: 11 }}>
                          {l.action}
                        </span>
                      </td>
                      <td>{l.resourceType}</td>
                      <td><span className="ip-mono">{l.resourceId}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--quiet)" }}>{l.ipAddress}</td>
                      <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(l.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalElements > 0 && <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} onPage={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── NotificationsPage ────────────────────────────────────────────────────────
export function NotificationsPage() {
  const { unreadCount: count, refreshUnreadCount } = useAuth();
  const { data, loading, reload } = useApi(
    () => api.get("/api/v1/notifications?page=0&size=20").then(r => r.data?.content || r.data || [])
  );

  const markRead = async id => {
    try { await api.patch(`/api/v1/notifications/${id}/read`); reload(); refreshUnreadCount(); } catch {}
  };

  const markAll = async () => {
    if (!data) return;
    await Promise.all(
      data.filter(n => n.status !== "READ").map(n => api.patch(`/api/v1/notifications/${n.notificationId}/read`).catch(() => {}))
    );
    reload(); refreshUnreadCount();
  };

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Notifications</div>
          <div className="ip-section-sub">{count ?? 0} unread messages</div>
        </div>
        <button className="ip-btn secondary" onClick={markAll}>Mark All Read</button>
      </div>

      <div className="ip-card">
        {loading ? <Loading /> : !data?.length ? <Empty icon="🔔" text="No notifications" /> : (
          <div>
            {data.map(n => (
              <div key={n.notificationId} style={{
                padding: "14px 0", borderBottom: "1px solid var(--rim)",
                opacity: n.status === "READ" ? 0.5 : 1,
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: n.status === "READ" ? "var(--rim)" : "var(--amber)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: n.status !== "READ" ? 600 : 400 }}>{n.message}</span>
                    <span style={{ fontSize: 11, color: "var(--quiet)", flexShrink: 0, marginLeft: 12 }}>{fmtDate(n.createdAt)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge status={n.category} />
                    <Badge status={n.status} />
                    {n.status !== "READ" && <button className="ip-btn ghost sm" onClick={() => markRead(n.notificationId)}>Mark Read</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UsersPage ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const [page,       setPage]       = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState({ username: "", email: "", fullName: "", phone: "", password: "", role: "ROLE_AGENT" });
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");
  const [fieldErrs,  setFieldErrs]  = useState({});

  const { data, loading, reload } = useApi(
    () => api.get(`/api/v1/auth/users?page=${page}&size=10`).then(r => r.data), [page]
  );

  const setF = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (fieldErrs[k]) setFieldErrs(fe => { const n = { ...fe }; delete n[k]; return n; });
  };

  // Inline error beneath a field
  const FErr = ({ name }) => fieldErrs[name]
    ? <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 3 }}>{fieldErrs[name]}</div>
    : null;
  const fStyle = name => fieldErrs[name] ? { border: "1.5px solid #e74c3c", borderRadius: 6 } : {};

  const create = async () => {
    const fe = {};
    if (!form.username.trim())  fe.username = "Username is required.";
    else if (form.username.trim().length < 3) fe.username = "Username must be at least 3 characters.";
    if (!form.fullName.trim())  fe.fullName = "Full Name is required.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim())     fe.email = "Email is required.";
    else if (!emailRe.test(form.email)) fe.email = "Please enter a valid email address.";
    if (form.phone.trim() && !/^\+?[\d\s\-(). ]{7,20}$/.test(form.phone.trim()))
      fe.phone = "Phone number is not valid. Use format: +91 98765 43210";
    if (!form.password)         fe.password = "Password is required.";
    else {
      const pwdRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;
      if (!pwdRules.test(form.password))
        fe.password = "Password must be ≥12 chars with uppercase, lowercase, digit, and special character.";
    }
    if (Object.keys(fe).length) { setFieldErrs(fe); setErr(""); return; }
    setSaving(true); setErr(""); setFieldErrs({});
    try {
      await api.post("/api/v1/auth/admin/users", form);
      setShowCreate(false); reload();
    } catch (e) {
      const d = e?.data || {};
      // Map backend field-level validation errors to specific fields
      if (d.fieldErrors?.length) {
        const serverFe = {};
        d.fieldErrors.forEach(fe => { if (fe.field) serverFe[fe.field] = fe.message; });
        if (Object.keys(serverFe).length) { setFieldErrs(serverFe); return; }
      }
      setErr(d.message || "Failed to create user. Please check all fields and try again.");
    } finally { setSaving(false); }
  };

  const deactivate = async id => {
    if (!window.confirm("Deactivate this user? They will lose access immediately.")) return;
    try { await api.delete(`/api/v1/auth/users/${id}`); reload(); } catch {}
  };

  const reactivate = async id => {
    if (!window.confirm("Reactivate this user? They will regain access.")) return;
    try { await api.patch(`/api/v1/auth/users/${id}/reactivate`); reload(); } catch {}
  };

  const unlock = async id => {
    try { await api.post(`/api/v1/auth/users/${id}/unlock`); reload(); } catch {}
  };

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">User Management</div>
          <div className="ip-section-sub">Manage platform users and roles</div>
        </div>
        <button className="ip-btn primary" onClick={() => setShowCreate(true)}>＋ New User</button>
      </div>

      <div className="ip-card">
        {loading ? <Loading /> : !data ? <Empty /> : (
          <>
            <div className="ip-table-wrap">
              <table className="ip-table">
                <thead><tr><th>ID</th><th>Username</th><th>Full Name</th><th>Email</th><th>Roles</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
                <tbody>
                  {(data.content || data).map(u => (
                    <tr key={u.userId}>
                      <td>{u.userId}</td>
                      <td><span className="ip-mono">{u.username}</span></td>
                      <td>{u.fullName}</td>
                      <td style={{ fontSize: 12, color: "var(--quiet)" }}>{u.email}</td>
                      <td>
                        <div className="ip-chips">
                          {[...(u.roles || [])].map(r => <span key={r} className="ip-chip">{r.replace("ROLE_","")}</span>)}
                        </div>
                      </td>
                      <td><Badge status={u.status} /></td>
                      <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(u.lastLoginAt)}</td>
                      <td>
                        <div className="ip-btn-group">
                          {u.status === "LOCKED" && (
                            <button className="ip-btn ghost sm" onClick={() => unlock(u.userId)}>Unlock</button>
                          )}
                          {u.status === "INACTIVE" ? (
                            <button className="ip-btn ghost sm" onClick={() => reactivate(u.userId)}>Reactivate</button>
                          ) : (
                            !u.roles?.includes("ROLE_ADMIN") && (
                              <button className="ip-btn danger sm" onClick={() => deactivate(u.userId)}>Deactivate</button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalElements > 0 && <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPage={setPage} />}
          </>
        )}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFieldErrs({}); setErr(""); }} title="Create User"
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => { setShowCreate(false); setFieldErrs({}); setErr(""); }}>Cancel</button>
            <button className="ip-btn primary" onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create"}</button>
          </>
        }>
        {err && <Alert type="error">{err}</Alert>}
        <div className="ip-form">
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Username *</label>
              <input value={form.username} onChange={setF("username")} placeholder="Enter a username" style={fStyle("username")} />
              <FErr name="username" />
            </div>
            <div className="ip-field">
              <label>Full Name *</label>
              <input value={form.fullName} onChange={setF("fullName")} placeholder="Enter full name" style={fStyle("fullName")} />
              <FErr name="fullName" />
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={setF("email")} placeholder="Enter email address" style={fStyle("email")} />
              <FErr name="email" />
            </div>
            <div className="ip-field">
              <label>Phone <span style={{ fontWeight: 400, fontSize: 11, color: "var(--quiet)" }}>(optional)</span></label>
              <input value={form.phone} onChange={setF("phone")} placeholder="+91 98765 43210" style={fStyle("phone")} />
              <FErr name="phone" />
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={setF("password")}
                placeholder="Set a password for this user"
                style={fStyle("password")} />
              <FErr name="password" />
            </div>
            <div className="ip-field"><label>Role *</label>
              <select value={form.role} onChange={setF("role")}>
                {[
                  { value: "ROLE_AGENT",       label: "Agent" },
                  { value: "ROLE_ADJUSTER",    label: "Claims Adjuster" },
                  { value: "ROLE_UNDERWRITER", label: "Underwriter" },
                  { value: "ROLE_COMPLIANCE",  label: "Compliance Officer" },
                  { value: "ROLE_FINANCE",     label: "Finance" },
                  { value: "ROLE_ADMIN",       label: "Admin" },
                ].map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
// ─── ForceChangePasswordPage ─────────────────────────────────────────────────
export function ForceChangePasswordPage() {
  const { user, logout, clearForcePasswordChange } = useAuth();
  const [form,   setForm]   = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;

  const submit = async () => {
    setErr("");
    if (!form.current) { setErr("Enter your temporary password."); return; }
    if (!passwordRules.test(form.next)) {
      setErr("New password must be at least 12 characters and include uppercase, lowercase, a digit, and a special character.");
      return;
    }
    if (form.next !== form.confirm) { setErr("Passwords do not match."); return; }
    setSaving(true);
    try {
      await api.patch(
        `/api/v1/auth/users/${user.userId}/password` +
        `?currentPassword=${encodeURIComponent(form.current)}` +
        `&newPassword=${encodeURIComponent(form.next)}`
      );
      clearForcePasswordChange();
    } catch (e) {
      setErr(e?.data?.message || "Failed to change password. Check your temporary password and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg, #f5f5f0)",
    }}>
      <div style={{
        background: "var(--surface, #fff)", borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,.15)", padding: "40px 44px",
        width: "100%", maxWidth: 440,
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
            Change Your Password
          </div>
          <div style={{ fontSize: 13, color: "var(--quiet)", marginTop: 6 }}>
            Your account has a temporary password. You must set a new password before continuing.
          </div>
        </div>

        {err && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: 6, padding: "10px 14px", color: "#b91c1c",
            fontSize: 13, marginBottom: 18,
          }}>
            {err}
          </div>
        )}

        <div className="ip-form">
          <div className="ip-field">
            <label>Temporary Password *</label>
            <input
              type="password"
              value={form.current}
              onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
              placeholder="Enter the temporary password you received"
              autoFocus
            />
          </div>
          <div className="ip-field">
            <label>New Password *</label>
            <input
              type="password"
              value={form.next}
              onChange={e => setForm(f => ({ ...f, next: e.target.value }))}
              placeholder="Enter your new password"
            />
          </div>
          <div className="ip-field">
            <label>Confirm New Password *</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Repeat new password"
            />
          </div>
          <button
            className="ip-btn primary"
            style={{ width: "100%", marginTop: 4 }}
            onClick={submit}
            disabled={saving}
          >
            {saving ? <Spinner /> : "Set New Password & Continue"}
          </button>
          <button
            className="ip-btn ghost"
            style={{ width: "100%", marginTop: 8 }}
            onClick={logout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, hasRole } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState("");

  const changePw = async () => {
    setSaving(true); setMsg("");
    try {
      await api.patch(
        `/api/v1/auth/users/${user.userId}/password` +
        `?currentPassword=${encodeURIComponent(pwForm.currentPassword)}` +
        `&newPassword=${encodeURIComponent(pwForm.newPassword)}`
      );
      setMsg("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (e) { setMsg(e?.data?.message || "Failed to change password"); }
    finally     { setSaving(false); }
  };

  // Fields shown to policyholders — no internal IDs or system roles
  const policyholderItems = [
    ["Full Name", user?.fullName],
    ["Username",  user?.username],
    ["Email",     user?.email],
  ];

  // Full details for staff/admin
  const staffItems = [
    ["User ID",     user?.userId],
    ["Username",    user?.username],
    ["Full Name",   user?.fullName],
    ["Email",       user?.email],
    ["Roles",       <div className="ip-chips">{[...(user?.roles||[])].map(r => <span key={r} className="ip-chip">{r.replace("ROLE_","")}</span>)}</div>],
    ["MFA Enabled", user?.mfaEnabled ? "Yes" : "No"],
  ];

  return (
    <div>
      <div className="ip-section-header">
        <div><div className="ip-section-title">My Profile</div></div>
      </div>
      <div className="ip-two-col">
        <div className="ip-card">
          <div className="ip-card-header"><div className="ip-card-title">Account Details</div></div>
          <DetailGrid items={isPolicyholder ? policyholderItems : staffItems} />
        </div>
        <div className="ip-card">
          <div className="ip-card-header"><div className="ip-card-title">Change Password</div></div>
          {msg && <Alert type={msg.includes("success") ? "success" : "error"}>{msg}</Alert>}
          <div className="ip-form">
            <div className="ip-field"><label>Current Password</label><input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} /></div>
            <div className="ip-field"><label>New Password</label><input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Enter your new password" /></div>
            <button className="ip-btn primary" onClick={changePw} disabled={saving}>{saving ? <Spinner /> : "Update Password"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
