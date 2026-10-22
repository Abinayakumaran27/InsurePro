// ─────────────────────────────────────────────────────────────────────────────
// UNDERWRITING PAGE
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Loading, Empty, Badge, Modal, Alert, Spinner, DetailGrid, useApi, fmtDate } from "../components/UI";

export function UnderwritingPage() {
  const { hasRole } = useAuth();
  const [selected,    setSelected]    = useState(null);
  const [decisionForm,setDecisionForm]= useState({ decision: "APPROVED", remarks: "" });
  const [saving,      setSaving]      = useState(false);
  const [decideErr,   setDecideErr]   = useState("");

  const { data, loading, error, reload } = useApi(
    () => api.get("/api/v1/underwriting?page=0&size=20").then(r => r?.data?.content || r?.content || [])
  );

  const decide = async id => {
    if (!decisionForm.remarks.trim()) { setDecideErr("Remarks are required."); return; }
    setSaving(true); setDecideErr("");
    try {
      const params = new URLSearchParams({ decision: decisionForm.decision });
      if (decisionForm.remarks) params.set("remarks", decisionForm.remarks);
      await api.post(`/api/v1/underwriting/${id}/decision?${params.toString()}`);
      setSelected(null); reload();
    } catch (e) { setDecideErr(e?.data?.message || "Failed to submit decision"); }
    finally { setSaving(false); }
  };

  const canDecide = hasRole("ADMIN") || hasRole("UNDERWRITER");

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Underwriting</div>
          <div className="ip-section-sub">Risk assessment & policy approval queue</div>
        </div>
      </div>
      <div className="ip-card">
        {loading ? <Loading /> : error ? <Alert type="error">{error}</Alert> : !data?.length ? <Empty icon="📊" text="No underwriting requests" /> : (
          <div className="ip-table-wrap">
            <table className="ip-table">
              <thead><tr><th>Request ID</th><th>Policy ID</th><th>Customer ID</th><th>Risk Score</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.requestId} onClick={() => setSelected(r)}>
                    <td>{r.requestId}</td>
                    <td>{r.policyId}</td>
                    <td>{r.customerId}</td>
                    <td>
                      <span style={{ color: r.riskScore > 70 ? "var(--crimson)" : r.riskScore > 40 ? "var(--amber)" : "var(--emerald)", fontWeight: 700 }}>
                        {r.riskScore ?? "—"}
                      </span>
                    </td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(r.createdAt)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {canDecide && r.status === "REFERRED" && (
                        <button className="ip-btn primary sm" onClick={() => { setSelected(r); setDecisionForm({ decision: "APPROVED", remarks: "" }); }}>Decide</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => { setSelected(null); setDecideErr(""); }} title="Underwriting Decision"
        footer={canDecide && selected?.status === "REFERRED" ? (
          <>
            <button className="ip-btn ghost" onClick={() => setSelected(null)}>Cancel</button>
            <button className="ip-btn primary" onClick={() => decide(selected.requestId)} disabled={saving}>{saving ? <Spinner /> : "Submit Decision"}</button>
          </>
        ) : <button className="ip-btn ghost" onClick={() => setSelected(null)}>Close</button>}>
        {selected && (
          <div className="ip-form">
            <DetailGrid items={[
              ["Request ID", selected.requestId], ["Status",      <Badge status={selected.status} />],
              ["Policy ID",  selected.policyId],  ["Customer ID", selected.customerId],
              ["Risk Score", selected.riskScore],  ["Remarks",     selected.decisionRemarks],
              ["Created",    fmtDate(selected.createdAt)],
            ]} />
            {canDecide && selected.status === "REFERRED" && (
              <>
                <hr className="ip-divider" />
                {decideErr && <Alert type="error">{decideErr}</Alert>}
                <div className="ip-field"><label>Decision *</label>
                  <select value={decisionForm.decision} onChange={e => setDecisionForm(f => ({ ...f, decision: e.target.value }))}>
                    <option value="APPROVED">Approve</option>
                    <option value="DECLINED">Decline</option>
                  </select>
                </div>
                <div className="ip-field"><label>Remarks *</label>
                  <textarea value={decisionForm.remarks} onChange={e => setDecisionForm(f => ({ ...f, remarks: e.target.value }))} rows={3} placeholder="Enter remarks explaining your decision…" />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
