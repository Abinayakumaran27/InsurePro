import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Loading, Empty, Badge, Modal, Alert, Spinner, Pagination, fmtCurrency, fmtDate } from "../components/UI";

const PAYMENT_METHODS = [
  { label: "UPI",         value: "UPI"        },
  { label: "Credit Card", value: "CARD"       },
  { label: "Debit Card",  value: "CARD"       },
  { label: "Net Banking", value: "NETBANKING" },
  { label: "NEFT / RTGS", value: "NEFT"       },
  { label: "Cheque",      value: "CHEQUE"     },
  { label: "Cash",        value: "CASH"       },
];

const STATUS_INFO = {
  ISSUED:    { label: "Due",       color: "#2980b9" },
  PENDING:   { label: "Pending",   color: "#e67e22" },
  OVERDUE:   { label: "Overdue",   color: "#c0392b" },
  PAID:      { label: "Paid",      color: "#27ae60" },
  CANCELLED: { label: "Cancelled", color: "#7f8c8d" },
};

// ── Policyholder: invoice card (invoice already exists) ──────────────────────
function InvoiceCard({ inv, onPay }) {
  const si     = STATUS_INFO[inv.status] || { label: inv.status, color: "#7f8c8d" };
  const canPay = ["ISSUED", "PENDING", "OVERDUE"].includes(inv.status);
  const total  = parseFloat(inv.amount || 0) + parseFloat(inv.taxAmount || 0);
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${canPay ? "#e67e2240" : "var(--rim)"}`,
      borderRadius: 12,
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{inv.invoiceNumber}</div>
          <div style={{ fontSize: 12, color: "var(--quiet)" }}>Due by {fmtDate(inv.dueDate)}</div>
        </div>
        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: si.color + "18", color: si.color, border: `1px solid ${si.color}40` }}>
          {si.label}
        </span>
      </div>
      <div style={{ display: "flex", gap: 20, fontSize: 13, marginBottom: 10 }}>
        <div><div style={{ color: "var(--quiet)", fontSize: 11 }}>Premium</div><div style={{ fontWeight: 600 }}>{fmtCurrency(inv.amount)}</div></div>
        <div><div style={{ color: "var(--quiet)", fontSize: 11 }}>GST (18%)</div><div style={{ fontWeight: 600 }}>{fmtCurrency(inv.taxAmount)}</div></div>
        <div>
          <div style={{ color: "var(--quiet)", fontSize: 11 }}>Total Payable</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: canPay ? "#e67e22" : "var(--text)" }}>{fmtCurrency(total)}</div>
        </div>
      </div>
      {inv.periodStart && (
        <div style={{ fontSize: 11, color: "var(--quiet)", marginBottom: 10 }}>
          Coverage: {fmtDate(inv.periodStart)} → {fmtDate(inv.periodEnd)}
        </div>
      )}
      {canPay && (
        <button className="ip-btn primary" style={{ width: "100%" }} onClick={() => onPay(inv)}>
          Pay ₹{total.toLocaleString("en-IN")} Now
        </button>
      )}
    </div>
  );
}

// ── Policyholder: policy-awaiting-payment card (no invoice yet) ──────────────
function PolicyPayCard({ policy, onInvoiceCreated }) {
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setBusy(true); setErr(""); setSuccess(false);
    try {
      // Call the policy-service endpoint which internally triggers invoice generation
      // via a service-to-service Feign call (avoids the internal-only invoice endpoint).
      await api.post(`/api/v1/policies/${policy.policyId}/request-invoice`);
      setSuccess(true);
      // Give the backend a moment to persist the invoice, then reload
      setTimeout(() => onInvoiceCreated(), 800);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.data?.message || "Could not create invoice. Please try again.");
    } finally { setBusy(false); }
  };

  const premium = parseFloat(policy.premiumAmount || 0);

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid #2980b940",
      borderRadius: 12,
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{policy.policyNumber}</div>
          <div style={{ fontSize: 12, color: "var(--quiet)" }}>{policy.policyTypeName}</div>
        </div>
        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#2980b918", color: "#2980b9", border: "1px solid #2980b940" }}>
          Premium Due
        </span>
      </div>
      <div style={{ display: "flex", gap: 20, fontSize: 13, marginBottom: 10 }}>
        <div><div style={{ color: "var(--quiet)", fontSize: 11 }}>Annual Premium</div><div style={{ fontWeight: 800, fontSize: 15, color: "#e67e22" }}>{fmtCurrency(premium)}</div></div>
        <div><div style={{ color: "var(--quiet)", fontSize: 11 }}>Coverage</div><div style={{ fontWeight: 600 }}>{fmtCurrency(policy.coverageAmount)}</div></div>
      </div>
      <div style={{ fontSize: 11, color: "var(--quiet)", marginBottom: 10 }}>
        Coverage: {fmtDate(policy.startDate)} → {fmtDate(policy.endDate)}
      </div>
      {err && <Alert type="error" style={{ marginBottom: 8, fontSize: 12 }}>{err}</Alert>}
      {success && (
        <Alert type="success" style={{ marginBottom: 8, fontSize: 12 }}>
          Invoice generated! Loading your payment details…
        </Alert>
      )}
      <button className="ip-btn primary" style={{ width: "100%" }} onClick={handlePay} disabled={busy || success}>
        {busy ? <><Spinner /> &nbsp;Preparing Invoice…</> : success ? "✓ Invoice Ready" : `Pay ₹${premium.toLocaleString("en-IN")} Now`}
      </button>
    </div>
  );
}

// ── Invoice list (handles both "has invoices" and "active policies need payment") ─
function InvoiceList({ fixedCustomerId, onPayNow }) {
  const isPolicyholder = !!fixedCustomerId;

  // Invoices state
  const [invoices,     setInvoices]     = useState(null);
  const [invLoading,   setInvLoading]   = useState(false);
  const [invErr,       setInvErr]       = useState("");
  const [page,         setPage]         = useState(0);

  // Active policies (shown when no invoices exist)
  const [activePolicies,  setActivePolicies]  = useState([]);
  const [polLoading,      setPolLoading]      = useState(false);

  // Staff search
  const [inputId, setInputId] = useState("");

  const loadInvoices = useCallback((id, pg) => {
    if (!id) { setInvoices(null); return; }
    setInvLoading(true); setInvErr("");
    api.get(`/api/v1/invoices/customer/${id}?page=${pg}&size=10`)
      .then(r => { setInvoices(r.data); setPage(pg); })
      .catch(() => {
        // On invoice load failure for policyholder, fall back to showing active policies
        setInvErr("invoices_unavailable");
      })
      .finally(() => setInvLoading(false));
  }, []);

  // On mount, load invoices for policyholder
  useEffect(() => {
    if (isPolicyholder && fixedCustomerId) loadInvoices(fixedCustomerId, 0);
  }, [isPolicyholder, fixedCustomerId, loadInvoices]);

  // Fetch active policies when: (a) invoices loaded with no payable ones, OR (b) invoice load failed
  useEffect(() => {
    if (!isPolicyholder || !fixedCustomerId) return;
    const shouldFetch = invErr === "invoices_unavailable" || (invoices !== null);
    if (!shouldFetch) return;
    if (invErr !== "invoices_unavailable") {
      const list = invoices?.content ?? invoices ?? [];
      const hasUnpaid = Array.isArray(list) && list.some(i => ["ISSUED","PENDING","OVERDUE"].includes(i.status));
      if (hasUnpaid) { setActivePolicies([]); return; }
    }
    // No payable invoices (or invoice service unavailable) — fetch active policies to offer payment
    setPolLoading(true);
    api.get(`/api/v1/policies?customerId=${fixedCustomerId}&status=ACTIVE&size=50`)
      .then(r => setActivePolicies(r.data?.content ?? r.data ?? []))
      .catch(() => setActivePolicies([]))
      .finally(() => setPolLoading(false));
  }, [invoices, invErr, isPolicyholder, fixedCustomerId]);

  const handleInvoiceCreated = () => {
    // Invoice was just generated — reload the invoices list so the
    // new InvoiceCard appears with its own "Pay Now" button.
    setActivePolicies([]);
    loadInvoices(fixedCustomerId, 0);
  };

  // ── Policyholder view ──────────────────────────────────────────────────────
  if (isPolicyholder) {
    if (invLoading) return <Loading />;
    // If invoices failed but we have active policies to show, skip the error and render them
    if (invErr && invErr !== "invoices_unavailable") return <Alert type="error">{invErr}</Alert>;

    const invList = invoices ? (invoices.content ?? invoices) : [];
    const payableInvoices = invList.filter(i => ["ISSUED","PENDING","OVERDUE"].includes(i.status));
    const paidInvoices    = invList.filter(i => !["ISSUED","PENDING","OVERDUE"].includes(i.status));

    // Have payable invoices → show them
    if (payableInvoices.length > 0) {
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
            {payableInvoices.map(i => <InvoiceCard key={i.invoiceId} inv={i} onPay={onPayNow} />)}
          </div>
          {paidInvoices.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--quiet)", margin: "20px 0 10px" }}>Payment History</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {paidInvoices.map(i => <InvoiceCard key={i.invoiceId} inv={i} onPay={onPayNow} />)}
              </div>
            </>
          )}
          {invoices?.totalElements > 0 && (
            <Pagination page={page} totalPages={invoices.totalPages} totalElements={invoices.totalElements} size={10} onPage={pg => loadInvoices(fixedCustomerId, pg)} />
          )}
        </div>
      );
    }

    // No payable invoices — check if there are active policies needing payment
    if (polLoading) return <Loading />;

    // Filter out policies that already have a paid invoice (invList covers them)
    const paidPolicyIds = new Set(invList.map(i => i.policyId));
    // Deduplicate by policyId in case the backend or effects return duplicates
    const seen = new Set();
    const policiesNeedingPayment = activePolicies.filter(p => {
      if (paidPolicyIds.has(p.policyId) || seen.has(p.policyId)) return false;
      seen.add(p.policyId); return true;
    });

    if (policiesNeedingPayment.length > 0) {
      return (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "rgba(41,128,185,0.08)", border: "1px solid rgba(41,128,185,0.3)",
            borderRadius: 10, marginBottom: 16, fontSize: 13,
          }}>
            <span style={{ fontSize: 18 }}>💳</span>
            <span>Your policy is active. Pay your first premium below to complete activation.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {policiesNeedingPayment.map(p => (
              <PolicyPayCard
                key={p.policyId}
                policy={p}
                onInvoiceCreated={handleInvoiceCreated}
              />
            ))}
          </div>
          {paidInvoices.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--quiet)", margin: "20px 0 10px" }}>Previous Payments</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {paidInvoices.map(i => <InvoiceCard key={i.invoiceId} inv={i} onPay={onPayNow} />)}
              </div>
            </>
          )}
        </div>
      );
    }

    // Truly nothing to pay
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>All paid up!</div>
        <div style={{ fontSize: 13, color: "var(--quiet)" }}>
          You have no outstanding invoices. New invoices appear here when your policy renews.
        </div>
      </div>
    );
  }

  // ── Staff table view ──────────────────────────────────────────────────────
  return (
    <div className="ip-card">
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
        <div className="ip-field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Search by Customer ID</label>
          <input value={inputId} onChange={e => setInputId(e.target.value)} placeholder="Enter customer ID…" onKeyDown={e => e.key === "Enter" && loadInvoices(inputId, 0)} />
        </div>
        <button className="ip-btn primary" onClick={() => loadInvoices(inputId, 0)}>Search</button>
      </div>
      {invErr && <Alert type="error">{invErr}</Alert>}
      {invLoading ? <Loading /> : !invoices ? (
        <Empty icon="🧾" text="Enter a Customer ID to load invoices" />
      ) : (invoices.content || invoices).length === 0 ? (
        <Empty icon="🧾" text="No invoices found for this customer" />
      ) : (
        <>
          <div className="ip-table-wrap">
            <table className="ip-table">
              <thead><tr><th>Invoice #</th><th>Amount</th><th>GST</th><th>Total</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {(invoices.content || invoices).map(i => (
                  <tr key={i.invoiceId}>
                    <td><span className="ip-mono">{i.invoiceNumber}</span></td>
                    <td>{fmtCurrency(i.amount)}</td>
                    <td>{fmtCurrency(i.taxAmount)}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(parseFloat(i.amount) + parseFloat(i.taxAmount || 0))}</td>
                    <td>{fmtDate(i.dueDate)}</td>
                    <td><Badge status={i.status} /></td>
                    <td>
                      {["ISSUED","PENDING","OVERDUE"].includes(i.status) && (
                        <button className="ip-btn primary sm" onClick={() => onPayNow(i)}>Record Payment</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.totalElements > 0 && (
            <Pagination page={page} totalPages={invoices.totalPages} totalElements={invoices.totalElements} size={10} onPage={pg => loadInvoices(inputId, pg)} />
          )}
        </>
      )}
    </div>
  );
}

// ── Payment history ──────────────────────────────────────────────────────────
function PaymentList({ fixedCustomerId, canRefund }) {
  const isPolicyholder = !!fixedCustomerId;
  const [inputId, setInputId] = useState("");
  const [page,    setPage]    = useState(0);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const load = useCallback((id, pg) => {
    if (!id) { setData(null); return; }
    setLoading(true); setErr("");
    api.get(`/api/v1/payments/customer/${id}?page=${pg}&size=10`)
      .then(r => { setData(r.data); setPage(pg); })
      .catch(() => setErr("Failed to load payment history"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isPolicyholder && fixedCustomerId) load(fixedCustomerId, 0); }, [isPolicyholder, fixedCustomerId, load]);

  const refund = async id => {
    if (!window.confirm("Process refund for this payment?")) return;
    try { await api.post(`/api/v1/payments/${id}/refund`); load(fixedCustomerId || inputId, page); }
    catch (e) { setErr(e?.data?.message || "Refund failed"); }
  };

  return (
    <div className="ip-card">
      {!isPolicyholder && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
          <div className="ip-field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Search by Customer ID</label>
            <input value={inputId} onChange={e => setInputId(e.target.value)} onKeyDown={e => e.key === "Enter" && load(inputId, 0)} />
          </div>
          <button className="ip-btn primary" onClick={() => load(inputId, 0)}>Search</button>
        </div>
      )}
      {err && <Alert type="error">{err}</Alert>}
      {loading ? <Loading /> : !data ? (
        <Empty icon="💳" text={isPolicyholder ? "No payments yet" : "Enter a Customer ID to load history"} />
      ) : (data.content || data).length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
          <div style={{ fontSize: 14, color: "var(--quiet)" }}>No payments recorded yet</div>
        </div>
      ) : (
        <>
          <div className="ip-table-wrap">
            <table className="ip-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th>{canRefund && <th>Actions</th>}</tr></thead>
              <tbody>
                {(data.content || data).map(p => (
                  <tr key={p.paymentId}>
                    <td style={{ fontSize: 12 }}>{fmtDate(p.paymentDate || p.createdAt)}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(p.amount)}</td>
                    <td>{p.method}</td>
                    <td><span className="ip-mono" style={{ fontSize: 11 }}>{p.gatewayReference || "—"}</span></td>
                    <td><Badge status={p.status} /></td>
                    {canRefund && <td>{p.status === "SUCCESS" && <button className="ip-btn danger sm" onClick={() => refund(p.paymentId)}>Refund</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalElements > 0 && (
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPage={pg => load(fixedCustomerId || inputId, pg)} />
          )}
        </>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { hasRole, customerId: myCustomerId } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");

  const [activeTab,        setActiveTab]        = useState("invoices");
  const [showPay,          setShowPay]          = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [payErr,           setPayErr]           = useState("");
  const [selectedInvoice,  setSelectedInvoice]  = useState(null);
  const [payForm,          setPayForm]          = useState({ method: "UPI", gatewayReference: "" });

  const openPayNow = (inv) => {
    setSelectedInvoice(inv);
    setPayForm({ method: "UPI", gatewayReference: "" });
    setPayErr("");
    setShowPay(true);
  };

  const recordPayment = async () => {
    setPayErr(""); setSaving(true);
    const total = parseFloat(selectedInvoice.amount || 0) + parseFloat(selectedInvoice.taxAmount || 0);
    try {
      await api.post("/api/v1/payments", {
        invoiceId:        selectedInvoice.invoiceId,
        customerId:       selectedInvoice.customerId,
        amount:           total,
        method:           payForm.method,
        gatewayReference: payForm.gatewayReference || null,
      });
      setShowPay(false);
      setSelectedInvoice(null);
      setActiveTab("payments");
    } catch (e) { setPayErr(e?.data?.message || "Payment failed. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Payments</div>
          <div className="ip-section-sub">
            {isPolicyholder ? "Your invoices and payment history" : "Invoice & payment management"}
          </div>
        </div>
      </div>

      {isPolicyholder && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
          background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.3)",
          borderRadius: 10, marginBottom: 20, fontSize: 13,
        }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <span>
            Your invoice is automatically generated when your policy is approved.
            Simply click <strong>Pay Now</strong> on any pending invoice below.
          </span>
        </div>
      )}

      <div className="ip-tabs">
        <div className={`ip-tab${activeTab === "invoices" ? " active" : ""}`} onClick={() => setActiveTab("invoices")}>
          {isPolicyholder ? "My Invoices" : "Invoices"}
        </div>
        <div className={`ip-tab${activeTab === "payments" ? " active" : ""}`} onClick={() => setActiveTab("payments")}>
          {isPolicyholder ? "Payment History" : "Payments"}
        </div>
      </div>

      {activeTab === "invoices" && (
        <InvoiceList fixedCustomerId={isPolicyholder ? myCustomerId : null} onPayNow={openPayNow} />
      )}
      {activeTab === "payments" && (
        <PaymentList fixedCustomerId={isPolicyholder ? myCustomerId : null} canRefund={hasRole("ADMIN") || hasRole("FINANCE")} />
      )}

      {/* ── Pay Now / Record Payment modal ── */}
      <Modal
        open={showPay}
        onClose={() => { setShowPay(false); setSelectedInvoice(null); }}
        title={isPolicyholder ? "Complete Payment" : "Record Payment"}
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => { setShowPay(false); setSelectedInvoice(null); }}>Cancel</button>
            <button className="ip-btn primary" onClick={recordPayment} disabled={saving}>
              {saving ? <Spinner /> : isPolicyholder ? "Confirm Payment" : "Record"}
            </button>
          </>
        }
      >
        {payErr && <Alert type="error">{payErr}</Alert>}
        {selectedInvoice && (
          <div className="ip-form">
            {/* Invoice summary */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--rim)", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--quiet)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Invoice Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 13 }}>
                {[
                  ["Invoice No",  selectedInvoice.invoiceNumber],
                  ["Due Date",    fmtDate(selectedInvoice.dueDate)],
                  ["Base Amount", fmtCurrency(selectedInvoice.amount)],
                  ["GST (18%)",   fmtCurrency(selectedInvoice.taxAmount)],
                ].map(([k, v]) => (
                  <div key={k}><div style={{ color: "var(--quiet)", fontSize: 11 }}>{k}</div><div style={{ fontWeight: 600 }}>{v}</div></div>
                ))}
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--rim)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>Total Payable</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#27ae60" }}>
                  {fmtCurrency(parseFloat(selectedInvoice.amount || 0) + parseFloat(selectedInvoice.taxAmount || 0))}
                </span>
              </div>
            </div>

            <div className="ip-form-row">
              <div className="ip-field">
                <label>Payment Method *</label>
                <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m.label} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>Transaction Reference</label>
                <input
                  value={payForm.gatewayReference}
                  onChange={e => setPayForm(f => ({ ...f, gatewayReference: e.target.value }))}
                  placeholder="UTR / Transaction ID (optional)"
                />
              </div>
            </div>
            {isPolicyholder && (
              <div style={{ fontSize: 12, color: "var(--quiet)" }}>
                Your payment receipt will be automatically saved to your Documents.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
