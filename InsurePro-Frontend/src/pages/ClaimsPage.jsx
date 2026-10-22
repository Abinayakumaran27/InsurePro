import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Loading, Empty, Badge, Modal, Alert, Spinner, Pagination, DetailGrid, useApi, fmtCurrency, fmtDate } from "../components/UI";

function ClaimNotes({ claimId, canAddNote }) {
  const [noteText, setNoteText] = useState("");
  const [internal, setInternal] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const { data, loading, reload } = useApi(
    () => api.get(`/api/v1/claims/${claimId}/notes`).then(r => r.data?.content || r.data || []),
    [claimId]
  );

  const add = async () => {
    if (!noteText.trim()) 
      return;
    setSaving(true);
     setErr("");
    try {
       await api.post(`/api/v1/claims/${claimId}/notes`, { noteText, internal }); setNoteText(""); reload(); }
    catch (e) { setErr(e?.data?.message || "Failed to add note"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {canAddNote && (
        <div style={{ marginBottom: 16 }}>
          {err && <Alert type="error">{err}</Alert>}
          <div className="ip-field" style={{ marginBottom: 8 }}>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." rows={3} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--ghost)", cursor: "pointer" }}>
              <input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} /> Internal only
            </label>
            <button className="ip-btn primary sm" onClick={add} disabled={saving}>{saving ? <Spinner /> : "Add Note"}</button>
          </div>
        </div>
      )}
      {loading ? <Loading /> : !data?.length ? <Empty icon="💬" text="No notes yet" /> : (
        <div className="ip-timeline">
          {data.map(n => (
            <div className="ip-tl-item" key={n.noteId}>
              <div className={`ip-tl-dot ${n.internal ? "crimson" : "amber"}`} />
              <div className="ip-tl-content">
                <div className="ip-tl-title">{n.noteText}</div>
                <div className="ip-tl-meta">
                  {n.internal ? "Internal note · " : ""}
                  {fmtDate(n.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function ClaimSettlement({ claimId, canSettle, onSettled }) {
  const [settling,     setSettling]     = useState(false);
  const [settleErr,    setSettleErr]    = useState("");
  const [settleSuccess,setSettleSuccess]= useState(false);

  const { data, loading, error, reload } = useApi(
    () => api.get(`/api/v1/claims/${claimId}/settlement`).then(r => r.data),
    [claimId]
  );

  const handleSettle = async () => {
    if (!window.confirm("Mark this settlement as SETTLED?")) return;
    setSettling(true);
    setSettleErr("");
    try {
      await api.patch(`/api/v1/claims/${claimId}/settlement/settle`);
      setSettleSuccess(true);
      reload();
      if (onSettled) onSettled();
    } catch (e) {
      setSettleErr(e?.data?.message || "Failed to settle.");
    } finally {
      setSettling(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !data) return <Empty icon="💳" text="No settlement record yet" />;

  const netPayout =
    (Number(data.amountApproved) || 0) -
    (Number(data.deductibleApplied) || 0);

  return (
    <>
      <DetailGrid items={[
        ["Status",          <Badge status={data.status} />],
        ["Amount Approved", fmtCurrency(data.amountApproved)],
        ["Deductible",      fmtCurrency(data.deductibleApplied)],
        ["Net Payout",      fmtCurrency(netPayout)],
        ["Settlement Date", fmtDate(data.settlementDate)],
        
        ["Remarks",         data.remarks || "—"],
      ]} />

      {/* Settle button — Admin/Adjuster only — only when PENDING */}
      {canSettle && data.status === "PENDING" && (
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid var(--rim)"
        }}>
          {settleErr && <Alert type="error">{settleErr}</Alert>}
          {settleSuccess && (
            <Alert type="success">
              Claim settled successfully!
            </Alert>
          )}
          <div style={{
            background: "rgba(39,174,96,0.08)",
            border: "1px solid rgba(39,174,96,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 14,
          }}>
            Net payout to policyholder:{" "}
            <strong>{fmtCurrency(netPayout)}</strong>
          </div>
          <button
            className="ip-btn primary"
            style={{ width: "100%", background: "#27ae60" }}
            onClick={handleSettle}
            disabled={settling}
          >
            {settling ? <Spinner /> : "✅ Mark as Settled"}
          </button>
        </div>
      )}

      {/* Already settled — show green badge */}
      {data.status === "SETTLED" && (
        <div style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#f0faf4",
          border: "1px solid #b7e4c7",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          color: "#1a7a4a",
        }}>
          ✅ Settlement completed. Net payout: {fmtCurrency(netPayout)}
        </div>
      )}
    </>
  );
}





const CLAIM_TYPE_LABELS = {
  MEDICAL:         { icon: "🏥", label: "Medical / Hospitalization" },
  ACCIDENT:        { icon: "🚨", label: "Accident / Injury" },
  THEFT:           { icon: "🔓", label: "Theft" },
  PROPERTY_DAMAGE: { icon: "🏠", label: "Property Damage" },
  DEATH:           { icon: "🕊️", label: "Death Benefit" },
  TRAVEL:          { icon: "✈️", label: "Travel Incident" },
};

// Keyword-based mapping — handles any policy type name from the backend
function getClaimTypesForPolicy(policyTypeName) {
  if (!policyTypeName) return Object.keys(CLAIM_TYPE_LABELS);
  const n = policyTypeName.toLowerCase();
  if (n.includes("motor") || n.includes("vehicle") || n.includes("auto") ||
      n.includes("car")   || n.includes("bike")    || n.includes("two-wheel"))
    return ["ACCIDENT", "THEFT", "PROPERTY_DAMAGE"];
  if (n.includes("health") || n.includes("medical") || n.includes("hospital") || n.includes("critical"))
    return ["MEDICAL", "ACCIDENT"];
  if (n.includes("life") || n.includes("term") || n.includes("endowment") || n.includes("ulip"))
    return ["DEATH", "ACCIDENT"];
  if (n.includes("travel"))
    return ["MEDICAL", "ACCIDENT", "THEFT", "TRAVEL"];
  if (n.includes("property") || n.includes("home") || n.includes("house") || n.includes("fire"))
    return ["PROPERTY_DAMAGE", "THEFT"];
  return Object.keys(CLAIM_TYPE_LABELS);
}

const STATUS_FRIENDLY = {
  SUBMITTED:           { label: "Submitted",           color: "#2980b9" },
  UNDER_REVIEW:        { label: "Under Review",        color: "#8e44ad" },
  PENDING_DOCS:        { label: "Docs Required",       color: "#e67e22" },
  APPROVED:            { label: "Approved",            color: "#27ae60" },
  PARTIALLY_APPROVED:  { label: "Partially Approved",  color: "#f39c12" },
  REJECTED:            { label: "Rejected",            color: "#c0392b" },
  SETTLED:             { label: "Settled",             color: "#16a085" },
  DISPUTED:            { label: "Disputed",            color: "#d35400" },
  CLOSED:              { label: "Closed",              color: "#7f8c8d" },
};

export default function ClaimsPage() {
  const { hasRole, user, customerId: myCustomerId } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");
  // Claims are stored with the IAM userId (submittedBy in backend), not the customer-service customerId.
  // Use user.userId for the claims list filter; myCustomerId (customer-service ID) is used only for
  // the policies dropdown.
  const myClaimsUserId = isPolicyholder ? user?.userId : null;

  const [page,        setPage]        = useState(0);
  const [status,      setStatus]      = useState("");
  const [selected,    setSelected]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [activeTab,   setActiveTab]   = useState("details");
  const [actionErr,   setActionErr]   = useState("");

  // For policyholder's dispute modal (replaces window.prompt)
  const [disputeTarget,  setDisputeTarget]  = useState(null);
  const [disputeReason,  setDisputeReason]  = useState("");
  const [disputeSaving,  setDisputeSaving]  = useState(false);
  const [disputeErr,     setDisputeErr]     = useState("");

  // Status update modal (staff only)
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm,  setStatusForm]  = useState({ status: "APPROVED", remarks: "", approvedAmount: "", deductibleAmount: "" });

  const customerFilter = isPolicyholder && myClaimsUserId ? `&customerId=${myClaimsUserId}` : "";
  // user.userId is available immediately after login (from JWT), so no async wait needed
  const readyToFetch = !isPolicyholder || !!myClaimsUserId;

  const { data, loading, error, reload } = useApi(
    () => readyToFetch
      ? api.get(`/api/v1/claims?page=${page}&size=10${status ? `&status=${status}` : ""}${customerFilter}`).then(r => r.data)
      : Promise.resolve(null),
    [page, status, myClaimsUserId, readyToFetch]
  );

  // Load policyholder's active policies for the claim form dropdown
  const [myPolicies,       setMyPolicies]       = useState([]);
  const [policiesLoading,  setPoliciesLoading]  = useState(false);

  useEffect(() => {
    if (!isPolicyholder || !myCustomerId) return;
    setPoliciesLoading(true);
    api.get(`/api/v1/policies?customerId=${myCustomerId}&status=ACTIVE&size=50`)
      .then(r => setMyPolicies(r.data?.content || r.data || []))
      .catch(() => {})
      .finally(() => setPoliciesLoading(false));
  }, [isPolicyholder, myCustomerId]);

  const [form,    setForm]    = useState({ policyId: "", incidentDate: "", claimType: "MEDICAL", description: "", amountRequested: "" });
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState("");
  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Derive allowed claim types from the currently selected policy's type name
  const selectedPolicy    = myPolicies.find(p => String(p.policyId) === String(form.policyId));
  const allowedClaimTypes = getClaimTypesForPolicy(selectedPolicy?.policyTypeName);

  const openCreate = () => {
    setForm({ policyId: "", incidentDate: "", claimType: "MEDICAL", description: "", amountRequested: "" });
    setFormErr("");
    setShowCreate(true);
  };

  // When the selected policy changes, reset claim type to first valid option for that policy
  const handlePolicyChange = e => {
    const pid = e.target.value;
    const pol = myPolicies.find(p => String(p.policyId) === pid);
    const types = getClaimTypesForPolicy(pol?.policyTypeName);
    setForm(f => ({ ...f, policyId: pid, claimType: types[0] || "MEDICAL" }));
  };

  const submit = async () => {
    const errors = [];
    if (!form.policyId || isNaN(parseInt(form.policyId))) errors.push("Please select a policy.");
    if (!form.incidentDate) errors.push("Incident Date is required.");
    if (form.incidentDate && form.incidentDate > new Date().toISOString().slice(0, 10)) errors.push("Incident Date cannot be in the future.");
    const amt = parseFloat(form.amountRequested);
    if (!form.amountRequested || isNaN(amt) || amt < 100) errors.push("Amount must be at least ₹100.");
    if (!form.description || form.description.trim().length < 20) errors.push("Description must be at least 20 characters.");
    if (errors.length) { setFormErr(errors.join(" ")); return; }
    setSaving(true); setFormErr("");
    try {
      await api.post("/api/v1/claims", {
        ...form,
        policyId:        parseInt(form.policyId),
        amountRequested: amt,
      });
      setShowCreate(false); reload();
    } catch (e) { setFormErr(e?.data?.message || "Failed to submit claim"); }
    finally     { setSaving(false); }
  };

  const updateStatus = async () => {
    setActionErr("");

    // Client-side guard: deductible must not exceed approved amount
    if (["APPROVED", "PARTIALLY_APPROVED"].includes(statusForm.status)) {
      const approvedAmt   = parseFloat(statusForm.approvedAmount)   || 0;
      const deductibleAmt = parseFloat(statusForm.deductibleAmount) || 0;
      if (deductibleAmt < 0) {
        setActionErr("Deductible cannot be negative."); return;
      }
      if (deductibleAmt > approvedAmt) {
        setActionErr(`Deductible (₹${deductibleAmt}) cannot exceed the approved amount (₹${approvedAmt}).`); return;
      }
    }

    try {
      await api.patch(`/api/v1/claims/${statusModal.claimId}/status`, {
        ...statusForm,
        approvedAmount:   statusForm.approvedAmount   ? parseFloat(statusForm.approvedAmount)   : null,
        deductibleAmount: statusForm.deductibleAmount ? parseFloat(statusForm.deductibleAmount) : null,
      });
      setStatusModal(null); reload();
    } catch (e) { setActionErr(e?.data?.message || "Failed to update claim status"); }
  };

  const submitDispute = async () => {
    if (!disputeReason.trim()) { setDisputeErr("Please provide a reason for your dispute."); return; }
    setDisputeSaving(true); setDisputeErr("");
    try {
      await api.post(`/api/v1/claims/${disputeTarget.claimId}/dispute?reason=${encodeURIComponent(disputeReason)}`);
      setDisputeTarget(null); setDisputeReason(""); reload();
    } catch (e) { setDisputeErr(e?.data?.message || "Failed to raise dispute"); }
    finally { setDisputeSaving(false); }
  };

  const canSubmit     = hasRole("ADMIN") || hasRole("AGENT") || hasRole("POLICYHOLDER");
  const canAdjudicate = hasRole("ADMIN") || hasRole("ADJUSTER");
  const canDispute    = hasRole("POLICYHOLDER") || hasRole("AGENT");

  // Policyholder card view for a single claim
  const ClaimCard = ({ c }) => {
    const typeInfo   = CLAIM_TYPE_LABELS[c.claimType] || { icon: "📋", label: c.claimType };
    const statusInfo = STATUS_FRIENDLY[c.status] || { label: c.status, color: "#7f8c8d" };
    const canDisputeThis = canDispute && ["REJECTED", "PARTIALLY_APPROVED"].includes(c.status);
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--rim)",
          borderRadius: 12,
          padding: "18px 20px",
          cursor: "pointer",
          transition: "box-shadow 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
        onClick={() => { setSelected(c); setActiveTab("details"); }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{typeInfo.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{typeInfo.label} Claim</div>
              <div style={{ fontSize: 12, color: "var(--quiet)", fontFamily: "monospace" }}>{c.claimNumber}</div>
            </div>
          </div>
          <span style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: statusInfo.color + "18",
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}40`,
          }}>{statusInfo.label}</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
          <div><span style={{ color: "var(--quiet)" }}>Requested</span><div style={{ fontWeight: 700 }}>{fmtCurrency(c.amountRequested)}</div></div>
          <div><span style={{ color: "var(--quiet)" }}>Incident</span><div style={{ fontWeight: 600 }}>{fmtDate(c.incidentDate)}</div></div>
          <div><span style={{ color: "var(--quiet)" }}>Filed on</span><div style={{ fontWeight: 600 }}>{fmtDate(c.claimDate)}</div></div>
        </div>
        {canDisputeThis && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--rim)" }}>
            <button
              className="ip-btn ghost sm"
              onClick={e => { e.stopPropagation(); setDisputeTarget(c); setDisputeReason(""); setDisputeErr(""); }}
            >
              Raise Dispute
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">
            {isPolicyholder ? "My Claims" : "Claims"}
          </div>
          <div className="ip-section-sub">
            {isPolicyholder
              ? "Track your insurance claim submissions and their status"
              : "Claim submission, adjudication & settlement"}
          </div>
        </div>
        <div className="ip-btn-group">
          <select
            style={{ background: "var(--surface)", border: "1px solid var(--rim)", color: "var(--text)", padding: "7px 12px", borderRadius: "var(--r-sm)", fontSize: 13 }}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0); }}
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_FRIENDLY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {canSubmit && <button className="ip-btn primary" onClick={openCreate}>+ File Claim</button>}
        </div>
      </div>

      {actionErr && <Alert type="error" style={{ marginBottom: 12 }}>{actionErr}</Alert>}

      {/* Policyholder: card grid; Staff: table */}
      {isPolicyholder ? (
        <div>
          {!readyToFetch ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Setting up your account…</div>
              <div style={{ fontSize: 13, color: "var(--quiet)" }}>Loading your profile. Please wait a moment.</div>
            </div>
          ) : loading ? <Loading /> : error ? (
            <Alert type="error">{error}</Alert>
          ) : !data ? <Empty /> : (
            <>
              {(data.content || data).length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No claims yet</div>
                  <div style={{ fontSize: 13, color: "var(--quiet)", marginBottom: 20 }}>File a claim against any of your active policies</div>
                  <button className="ip-btn primary" onClick={openCreate}>+ File Your First Claim</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 16 }}>
                  {(data.content || data).map(c => <ClaimCard key={c.claimId} c={c} />)}
                </div>
              )}
              {data.totalElements > 0 && <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPage={setPage} />}
            </>
          )}
        </div>
      ) : (
        <div className="ip-card">
          {loading ? <Loading /> : !data ? <Empty /> : (
            <>
              <div className="ip-table-wrap">
                <table className="ip-table">
                  <thead>
                    <tr>
                      <th>Claim #</th>
                      <th>Policy</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.content || data).map(c => (
                      <tr key={c.claimId} onClick={() => { setSelected(c); setActiveTab("details"); }}>
                        <td><span className="ip-mono">{c.claimNumber}</span></td>
                        <td>{c.policyId}</td>
                        <td>{c.claimType}</td>
                        <td>{fmtCurrency(c.amountRequested)}</td>
                        <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(c.claimDate)}</td>
                        <td><Badge status={c.status} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="ip-btn-group">
                            {canAdjudicate && ["SUBMITTED","UNDER_REVIEW"].includes(c.status) && (
                              <button className="ip-btn primary sm" onClick={() => {
                                setStatusModal(c);
                                setStatusForm({ status: "APPROVED", remarks: "", approvedAmount: c.amountRequested, deductibleAmount: "" });
                              }}>Review</button>
                            )}
                            {canDispute && ["REJECTED","PARTIALLY_APPROVED"].includes(c.status) && (
                              <button className="ip-btn ghost sm" onClick={() => { setDisputeTarget(c); setDisputeReason(""); setDisputeErr(""); }}>Dispute</button>
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
      )}

      {/* ── File Claim ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="File a Claim"
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="ip-btn primary" onClick={submit} disabled={saving}>{saving ? <Spinner /> : "Submit Claim"}</button>
          </>
        }>
        {formErr && <Alert type="error">{formErr}</Alert>}
        {isPolicyholder && myPolicies.length === 0 && !policiesLoading && (
          <Alert type="info">You have no active policies to file a claim against. Please contact your agent.</Alert>
        )}
        <div className="ip-form">
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Select Policy *</label>
              {isPolicyholder ? (
                <select value={form.policyId} onChange={handlePolicyChange}>
                  <option value="">Choose your policy…</option>
                  {myPolicies.map(p => (
                    <option key={p.policyId} value={p.policyId}>
                      {p.policyNumber} — {p.policyTypeName}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="number" value={form.policyId} onChange={setF("policyId")} placeholder="Policy ID" />
              )}
            </div>
            <div className="ip-field"><label>Incident Date *</label><input type="date" value={form.incidentDate} onChange={setF("incidentDate")} max={new Date().toISOString().slice(0, 10)} /></div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Claim Type *</label>
              <select value={form.claimType} onChange={setF("claimType")}>
                {allowedClaimTypes.map(k => (
                  <option key={k} value={k}>{CLAIM_TYPE_LABELS[k].icon} {CLAIM_TYPE_LABELS[k].label}</option>
                ))}
              </select>
              {selectedPolicy && (
                <div style={{ fontSize: 11, color: "var(--quiet)", marginTop: 4 }}>
                  Showing claim types available for {selectedPolicy.policyTypeName} insurance
                </div>
              )}
            </div>
            <div className="ip-field">
              <label>Amount Requested (min ₹100) *</label>
              <input type="number" min={100} value={form.amountRequested} onChange={setF("amountRequested")} placeholder="e.g. 50000" />
            </div>
          </div>
          <div className="ip-field">
            <label>Describe what happened *</label>
            <textarea
              value={form.description}
              onChange={setF("description")}
              rows={4}
              placeholder="Please describe the incident in detail (at least 20 characters)…"
            />
            <div style={{ fontSize: 11, color: form.description.length >= 20 ? "var(--quiet)" : "var(--amber)", marginTop: 4 }}>
              {form.description.length} / 20 characters minimum
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Dispute Modal ── */}
      <Modal open={!!disputeTarget} onClose={() => setDisputeTarget(null)} title="Raise a Dispute"
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => setDisputeTarget(null)}>Cancel</button>
            <button className="ip-btn primary" onClick={submitDispute} disabled={disputeSaving}>
              {disputeSaving ? <Spinner /> : "Submit Dispute"}
            </button>
          </>
        }>
        {disputeTarget && (
          <div className="ip-form">
            {disputeErr && <Alert type="error">{disputeErr}</Alert>}
            <Alert type="info">
              Disputing claim <strong>{disputeTarget.claimNumber}</strong> — {STATUS_FRIENDLY[disputeTarget.status]?.label || disputeTarget.status}
            </Alert>
            <div className="ip-field">
              <label>Reason for Dispute *</label>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                rows={4}
                placeholder="Explain why you believe this decision should be reviewed…"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Adjudicate (staff only) ── */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Adjudicate Claim"
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => setStatusModal(null)}>Cancel</button>
            <button className="ip-btn primary" onClick={updateStatus}>Update Status</button>
          </>
        }>
        {statusModal && (
          <div className="ip-form">
            {actionErr && <Alert type="error">{actionErr}</Alert>}
            <Alert type="info">Claim: <strong>{statusModal.claimNumber}</strong> — Requested: {fmtCurrency(statusModal.amountRequested)}</Alert>
            <div className="ip-field">
              <label>Decision *</label>
              <select value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                {["APPROVED","PARTIALLY_APPROVED","REJECTED","UNDER_REVIEW","PENDING_DOCS"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {["APPROVED","PARTIALLY_APPROVED"].includes(statusForm.status) && (() => {
              const approvedAmt  = parseFloat(statusForm.approvedAmount)  || 0;
              const deductibleAmt = parseFloat(statusForm.deductibleAmount) || 0;
              const netPayout    = approvedAmt - deductibleAmt;
              const deductibleErr = deductibleAmt < 0
                ? "Deductible cannot be negative."
                : deductibleAmt > approvedAmt
                  ? "Deductible cannot exceed the approved amount."
                  : null;
              return (
                <>
                  <div className="ip-form-row">
                    <div className="ip-field">
                      <label>Approved Amount (₹)</label>
                      <input
                        type="number" min="0"
                        value={statusForm.approvedAmount}
                        onChange={e => setStatusForm(f => ({ ...f, approvedAmount: e.target.value }))}
                      />
                    </div>
                    <div className="ip-field">
                      <label>Deductible (₹)</label>
                      <input
                        type="number" min="0"
                        max={approvedAmt || undefined}
                        value={statusForm.deductibleAmount}
                        onChange={e => setStatusForm(f => ({ ...f, deductibleAmount: e.target.value }))}
                        style={deductibleErr ? { borderColor: "var(--ip-error, #e74c3c)" } : {}}
                      />
                      {deductibleErr && (
                        <span style={{ color: "var(--ip-error, #e74c3c)", fontSize: "0.78rem", marginTop: "2px", display: "block" }}>
                          {deductibleErr}
                        </span>
                      )}
                    </div>
                  </div>
                  {(deductibleAmt > 0 || approvedAmt > 0) && (
                    <div style={{
                      background: netPayout >= 0 ? "var(--ip-success-bg, #eafaf1)" : "var(--ip-error-bg, #fdf0ef)",
                      border: `1px solid ${netPayout >= 0 ? "var(--ip-success, #27ae60)" : "var(--ip-error, #e74c3c)"}`,
                      borderRadius: "6px", padding: "8px 14px", fontSize: "0.9rem", marginBottom: "4px"
                    }}>
                      <strong>Net Payout:</strong>{" "}
                      <span style={{ color: netPayout >= 0 ? "var(--ip-success, #27ae60)" : "var(--ip-error, #e74c3c)", fontWeight: 700 }}>
                        ₹{netPayout.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {netPayout < 0 && <span style={{ color: "var(--ip-error, #e74c3c)", marginLeft: 8 }}>— Fix deductible above</span>}
                    </div>
                  )}
                </>
              );
            })()}
            <div className="ip-field"><label>Remarks *</label><textarea value={statusForm.remarks} onChange={e => setStatusForm(f => ({ ...f, remarks: e.target.value }))} rows={3} /></div>
          </div>
        )}
      </Modal>

      {/* ── Claim Detail ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Claim Details" wide>
        {selected && (
          <>
            <div className="ip-tabs">
              <div className={`ip-tab${activeTab === "details"    ? " active" : ""}`} onClick={() => setActiveTab("details")}>Details</div>
              <div className={`ip-tab${activeTab === "notes"      ? " active" : ""}`} onClick={() => setActiveTab("notes")}>Updates</div>
              <div className={`ip-tab${activeTab === "settlement" ? " active" : ""}`} onClick={() => setActiveTab("settlement")}>Settlement</div>
            </div>
            {activeTab === "details" && (
              <DetailGrid items={[
                ["Claim Number",     <span className="ip-mono">{selected.claimNumber}</span>],
                ["Status",           <Badge status={selected.status} />],
                ["Claim Type",       (CLAIM_TYPE_LABELS[selected.claimType]?.icon || "") + " " + (CLAIM_TYPE_LABELS[selected.claimType]?.label || selected.claimType)],
                ["Amount Requested", fmtCurrency(selected.amountRequested)],
                ["Incident Date",    fmtDate(selected.incidentDate)],
                ["Filed On",         fmtDate(selected.claimDate)],
                ...(!isPolicyholder ? [
                  ["Policy ID",      selected.policyId],
                  ["Customer ID",    selected.customerId],
                  
                ] : []),
                ["Description",      selected.description],
              ]} />
            )}
            {activeTab === "notes" && (
              <ClaimNotes claimId={selected.claimId} canAddNote={hasRole("ADMIN") || hasRole("ADJUSTER") || hasRole("AGENT")} />
            )}
            {activeTab === "settlement" && (
  <ClaimSettlement
    claimId={selected.claimId}
    canSettle={canAdjudicate}
    onSettled={reload}
  />
)}
          </>
        )}
      </Modal>
    </div>
  );
}
