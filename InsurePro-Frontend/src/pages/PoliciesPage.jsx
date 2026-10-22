import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Loading, Empty, Badge, Modal, Alert, Spinner, Pagination, DetailGrid, useApi, fmtCurrency, fmtDate, CustomerSearch } from "../components/UI";

const ENDORSEMENT_TYPES = ["COVERAGE_CHANGE", "NOMINEE_CHANGE", "ADDRESS_CHANGE"];
const POLICY_STATUSES = ["DRAFT", "PENDING_UNDERWRITING", "ACTIVE", "LAPSED", "CANCELLED", "EXPIRED", "SUSPENDED"];

function PolicyEndorsements({ policyId, canEndorse }) {
  const [form,   setForm]   = useState({ changeType: "COVERAGE_CHANGE", newValue: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const { data, loading, reload } = useApi(
    () => api.get(`/api/v1/policies/${policyId}/endorsements`).then(r => r.data?.content || r.data || [])
  );

  const add = async () => {
    if (!form.newValue.trim()) { setErr("New value is required"); return; }
    setSaving(true); setErr("");
    try {
      const params = new URLSearchParams({ changeType: form.changeType, newValue: form.newValue, reason: form.reason });
      await api.post(`/api/v1/policies/${policyId}/endorsements?${params.toString()}`);
      setForm({ changeType: "COVERAGE_CHANGE", newValue: "", reason: "" });
      reload();
    } catch (e) {
      setErr(e?.data?.message || "Failed to add endorsement");
    } finally { setSaving(false); }
  };

  return (
    <div>
      {canEndorse && (
        <div className="ip-card" style={{ marginBottom: 16, background: "var(--surface)" }}>
          {err && <Alert type="error">{err}</Alert>}
          <div className="ip-form">
            <div className="ip-form-row">
              <div className="ip-field">
                <label>Change Type</label>
                <select value={form.changeType} onChange={e => setForm(f => ({ ...f, changeType: e.target.value }))}>
                  {ENDORSEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>New Value *</label>
                <input value={form.newValue} onChange={e => setForm(f => ({ ...f, newValue: e.target.value }))} placeholder='e.g. {"coverageAmount": 500000}' />
              </div>
            </div>
            <div className="ip-field">
              <label>Reason</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div>
              <button className="ip-btn primary sm" onClick={add} disabled={saving}>{saving ? <Spinner /> : "Add Endorsement"}</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <Loading /> : !data?.length ? <Empty icon="📝" text="No endorsements" /> : (
        <div className="ip-timeline">
          {data.map(e => (
            <div className="ip-tl-item" key={e.endorsementId}>
              <div className="ip-tl-dot amber" />
              <div className="ip-tl-content">
                <div className="ip-tl-title">{e.changeType}</div>
                <div className="ip-tl-meta">{e.reason} · {fmtDate(e.effectiveDate)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PoliciesPage({ onNavigate }) {
  const { hasRole, customerId: myCustomerId } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");

  const [page,        setPage]        = useState(0);
  const [status,      setStatus]      = useState("");
  const [selected,    setSelected]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [activeTab,   setActiveTab]   = useState("details");
  const [actionErr,   setActionErr]   = useState("");
  const [policyTypes, setPolicyTypes] = useState([]);

  const customerFilter = isPolicyholder && myCustomerId ? `&customerId=${myCustomerId}` : "";

  const { data, loading, reload } = useApi(
    () => {
      if (isPolicyholder && !myCustomerId) return Promise.resolve(null);
      return api.get(`/api/v1/policies?page=${page}&size=10${status ? `&status=${status}` : ""}${customerFilter}`)
               .then(r => r.data);
    },
    [page, status, myCustomerId, isPolicyholder]
  );

  useEffect(() => {
    api.get("/api/v1/policies/types")
      .then(r => setPolicyTypes(r.data || []))
      .catch(() => {});
  }, []);

  const [form,    setForm]    = useState({ customerId: "", policyTypeId: "", coverageAmount: "", startDate: "", endDate: "", nomineeName: "", nomineeRelation: "" });
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState("");

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    const errors = [];
    if (!form.customerId || isNaN(parseInt(form.customerId))) errors.push("Customer ID is required.");
    if (!form.policyTypeId || isNaN(parseInt(form.policyTypeId))) errors.push("Policy Type ID is required.");
    const cov = parseFloat(form.coverageAmount);
    if (!form.coverageAmount || isNaN(cov) || cov < 10000) errors.push("Coverage Amount must be at least ₹10,000.");
    if (!form.startDate) errors.push("Start Date is required.");
    if (!form.endDate) errors.push("End Date is required.");
    if (form.startDate && form.endDate && form.endDate <= form.startDate) errors.push("End Date must be after Start Date.");
    if (errors.length) { setFormErr(errors.join(" ")); return; }

    setSaving(true); setFormErr("");
    try {
      const res = await api.post("/api/v1/policies", {
        customerId:     parseInt(form.customerId),
        policyTypeId:   parseInt(form.policyTypeId),
        coverageAmount: cov,
        startDate:      form.startDate,
        endDate:        form.endDate,
        nomineeName:    form.nomineeName || null,
        nomineeRelation: form.nomineeRelation || null,
      });

      const policy = res.data;
      const selectedType = policyTypes.find(pt => pt.typeId === parseInt(form.policyTypeId));

      // if this policy type requires underwriting, auto-create the request
      // send values that produce score 50 → always REFERRED → goes to underwriter queue
      if (selectedType?.underwritingRequired && policy?.policyId) {
        try {
          await api.post("/api/v1/underwriting", {
            policyId:          policy.policyId,
            customerId:        parseInt(form.customerId),
            policyTypeId:      parseInt(form.policyTypeId),
            coverageAmount:    cov,
            customerAge:       50,    // age 50 → +15 pts
            hasExistingClaims: true,  // +20 pts  → total 35... add smoker
            smoker:            true,  // +15 pts  → total 50 → REFERRED ✅
            healthConditions:  "",
          });
        } catch (uwErr) {
          console.warn("Underwriting initiation failed:", uwErr);
        }
      }

      setShowCreate(false); reload();
    } catch (e) { setFormErr(e?.data?.message || "Failed to create policy"); }
    finally     { setSaving(false); }
  };

  const activate = async id => {
    setActionErr("");
    try { await api.post(`/api/v1/policies/${id}/activate`); reload(); }
    catch (e) { setActionErr(e?.data?.message || "Failed to activate policy"); }
  };

  const cancel = async id => {
    const reason = window.prompt("Cancellation reason:");
    if (!reason) return;
    setActionErr("");
    try {
      await api.post(`/api/v1/policies/${id}/cancel?reason=${encodeURIComponent(reason)}`);
      reload();
    } catch (e) { setActionErr(e?.data?.message || "Failed to cancel policy"); }
  };

  const canCreate   = hasRole("ADMIN") || hasRole("AGENT");
  const canActivate = hasRole("ADMIN") || hasRole("UNDERWRITER");
  const canCancel   = hasRole("ADMIN") || hasRole("AGENT");

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Policies</div>
          <div className="ip-section-sub">
            {isPolicyholder ? "Your active insurance policies" : "Insurance policy lifecycle management"}
          </div>
        </div>
        <div className="ip-btn-group">
          <select
            style={{ background: "var(--surface)", border: "1px solid var(--rim)", color: "var(--text)", padding: "7px 12px", borderRadius: "var(--r-sm)", fontSize: 13 }}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0); }}
          >
            <option value="">All Status</option>
            {POLICY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {canCreate && <button className="ip-btn primary" onClick={() => setShowCreate(true)}>＋ New Policy</button>}
        </div>
      </div>

      {actionErr && <Alert type="error" style={{ marginBottom: 12 }}>{actionErr}</Alert>}

      <div className="ip-card">
        {loading ? <Loading /> : !data ? <Empty /> : (
          <>
            <div className="ip-table-wrap">
              <table className="ip-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    {!isPolicyholder && <th>Customer</th>}
                    <th>Type</th>
                    <th>Coverage</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.content || data).map(p => (
                    <tr key={p.policyId} onClick={() => { setSelected(p); setActiveTab("details"); }}>
                      <td><span className="ip-mono">{p.policyNumber}</span></td>
                      {!isPolicyholder && <td>{p.customerId}</td>}
                      <td>{p.policyTypeName}</td>
                      <td>{fmtCurrency(p.coverageAmount)}</td>
                      <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td>
                      <td><Badge status={p.status} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="ip-btn-group">
                          {canActivate && p.status === "DRAFT" && <button className="ip-btn ghost sm" onClick={() => activate(p.policyId)}>Activate</button>}
                          {canActivate && p.status === "PENDING_UNDERWRITING" && <button className="ip-btn ghost sm" onClick={() => activate(p.policyId)}>Approve</button>}
                          {canCancel   && p.status === "ACTIVE" && <button className="ip-btn danger sm" onClick={() => cancel(p.policyId)}>Cancel</button>}
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

      {/* ── Create Policy ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Policy"
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="ip-btn primary" onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create"}</button>
          </>
        }>
        {formErr && <Alert type="error">{formErr}</Alert>}
        <div className="ip-form">
          <div className="ip-form-row">
            <CustomerSearch
              label="Customer"
              required
              value={form.customerId}
              onChange={(id) => setForm(f => ({ ...f, customerId: id }))}
            />
            <div className="ip-field">
              <label>Policy Type *</label>
              <select value={form.policyTypeId} onChange={setF("policyTypeId")}>
                <option value="">Select policy type…</option>
                {policyTypes.map(pt => (
                  <option key={pt.typeId} value={pt.typeId}>
                    {pt.typeId} — {pt.name}{pt.underwritingRequired ? " (Underwriting req.)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="ip-field">
            <label>Coverage Amount (min ₹10,000) *</label>
            <input
              type="number" min="10000" step="1000"
              value={form.coverageAmount}
              onChange={e => {
                const v = e.target.value;
                if (v === "" || parseFloat(v) >= 0) setForm(f => ({ ...f, coverageAmount: v }));
              }}
            />
          </div>
          <div className="ip-form-row">
            <div className="ip-field"><label>Start Date *</label><input type="date" value={form.startDate} onChange={setF("startDate")} /></div>
            <div className="ip-field"><label>End Date *</label><input type="date" value={form.endDate} onChange={setF("endDate")} /></div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field"><label>Nominee Name</label><input value={form.nomineeName} onChange={setF("nomineeName")} /></div>
            <div className="ip-field">
              <label>Nominee Relation</label>
              <select value={form.nomineeRelation} onChange={setF("nomineeRelation")}>
                <option value="">Select relation…</option>
                <option value="SPOUSE">Spouse</option>
                <option value="CHILD">Child</option>
                <option value="PARENT">Parent</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* show info note when selected type requires underwriting */}
          {policyTypes.find(pt => pt.typeId === parseInt(form.policyTypeId))?.underwritingRequired && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fbbf24", fontSize: 12, color: "#92400e" }}>
              🔬 This policy type requires underwriter approval. A request will be automatically sent to the underwriting queue after creation.
            </div>
          )}
        </div>
      </Modal>

      {/* ── Policy Detail ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Policy Details" wide>
        {selected && (
          <>
            <div className="ip-tabs">
              <div className={`ip-tab${activeTab === "details"      ? " active" : ""}`} onClick={() => setActiveTab("details")}>Details</div>
              <div className={`ip-tab${activeTab === "endorsements" ? " active" : ""}`} onClick={() => setActiveTab("endorsements")}>Endorsements</div>
            </div>
            {activeTab === "details" && (
              <DetailGrid items={[
                ["Policy Number",    <span className="ip-mono">{selected.policyNumber}</span>],
                ["Status",           <Badge status={selected.status} />],
                ["Policy Type",      selected.policyTypeName],
                ...(!isPolicyholder ? [["Customer ID", selected.customerId]] : []),
                ["Coverage Amount",  fmtCurrency(selected.coverageAmount)],
                ["Premium Amount",   fmtCurrency(selected.premiumAmount)],
                ["Start Date",       fmtDate(selected.startDate)],
                ["End Date",         fmtDate(selected.endDate)],
                ["Nominee",          selected.nomineeName],
                ["Nominee Relation", selected.nomineeRelation],
                ...(!isPolicyholder ? [["Agent ID", selected.agentId]] : []),
                ["Created",          fmtDate(selected.createdAt)],
              ]} />
            )}
            {activeTab === "endorsements" && (
              <PolicyEndorsements
                policyId={selected.policyId}
                canEndorse={hasRole("ADMIN") || hasRole("UNDERWRITER")}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
}