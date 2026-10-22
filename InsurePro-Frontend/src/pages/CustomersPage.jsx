import { useState } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Loading, Empty, Badge, Modal, Alert, Spinner, Pagination, DetailGrid, useApi, fmtCurrency, fmtDate } from "../components/UI";

const KYC_STATUS_LABELS = {
  PENDING: "Pending Verification", IN_PROGRESS: "In Progress",
  VERIFIED: "Verified", REJECTED: "Rejected", EXPIRED: "Expired",
};

// Helper – extract a user-readable message from an API error throw
function parseApiError(e) {
  const d = e?.data || {};
  if (d.fieldErrors?.length) return d.fieldErrors.map(f => f?.message).filter(Boolean).join(". ");
  if (d.message) return d.message;
  if (e?.message) return e.message;
  return null;
}

// Map a backend conflict / validation message to the offending field key (if detectable)
function serverMsgToField(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("email")) return "email";
  if (m.includes("national id") || m.includes("nationalid")) return "nationalId";
  if (m.includes("phone")) return "phone";
  if (m.includes("password") || m.includes("portal login")) return "temporaryPassword";
  return null;
}

const CLAIM_STATUS_COLORS = {
  SUBMITTED:          "#2980b9",
  UNDER_REVIEW:       "#8e44ad",
  PENDING_DOCS:       "#e67e22",
  APPROVED:           "#27ae60",
  PARTIALLY_APPROVED: "#f39c12",
  REJECTED:           "#c0392b",
  SETTLED:            "#16a085",
  DISPUTED:           "#d35400",
  CLOSED:             "#7f8c8d",
};

function PolicyholderClaims({ customerId }) {
  const { data, loading, error } = useApi(
    () => api.get(`/api/v1/claims?customerId=${customerId}&size=50`).then(r => r.data),
    [customerId]
  );
  if (loading) return <Loading />;
  if (error)   return <Alert type="error">Failed to load claims.</Alert>;
  const claims = data?.content || data || [];
  if (!claims.length) return <Empty icon="📋" text="No claims filed yet" />;
  return (
    <div className="ip-table-wrap">
      <table className="ip-table">
        <thead>
          <tr><th>Claim #</th><th>Type</th><th>Amount</th><th>Incident Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          {claims.map(c => {
            const color = CLAIM_STATUS_COLORS[c.status] || "#7f8c8d";
            return (
              <tr key={c.claimId}>
                <td><span className="ip-mono">{c.claimNumber}</span></td>
                <td>{c.claimType}</td>
                <td>{fmtCurrency(c.amountRequested)}</td>
                <td style={{ fontSize: 12, color: "var(--quiet)" }}>{fmtDate(c.incidentDate)}</td>
                <td>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    background: color + "18", color, border: `1px solid ${color}40`,
                  }}>{c.status.replace(/_/g, " ")}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PolicyholdersPage() {
  const { hasRole, user } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");
  const [page,       setPage]       = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [detailTab,  setDetailTab]  = useState("profile");
  const [showCreate, setShowCreate] = useState(false);
  const [kycModal,   setKycModal]   = useState(null);
  const [kycReason,  setKycReason]  = useState("");
  const [kycErr,     setKycErr]     = useState("");
  const [editingProfile, setEditingProfile] = useState(null);

  const { data, loading, reload } = useApi(
    () => isPolicyholder
      ? api.get("/api/v1/customers/my-profile").then(r => ({ content: [r.data], totalElements: 1, totalPages: 1 })).catch(() => ({ content: [], totalElements: 0, totalPages: 0 }))
      : api.get(`/api/v1/customers?page=${page}&size=10`).then(r => r.data),
    [page, isPolicyholder]
  );

  const [form,       setForm]       = useState({ fullName: "", dateOfBirth: "", gender: "MALE", nationalId: "", email: "", phone: "", streetAddress: "", city: "", state: "", zipCode: "", country: "", occupation: "", annualIncome: "", temporaryPassword: "", portalUsername: "" });
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState("");          // server-level / general error
  const [fieldErrs,  setFieldErrs]  = useState({});         // per-field inline errors
  const [showTmpPwd, setShowTmpPwd] = useState(false);

  const setF = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    // Clear the per-field error as soon as the user starts typing
    if (fieldErrs[k]) setFieldErrs(fe => { const n = { ...fe }; delete n[k]; return n; });
  };

  // Renders a field's input with optional red border + inline error message
  const fieldStyle = key => fieldErrs[key]
    ? { border: "1.5px solid #e74c3c", borderRadius: 6 }
    : {};
  const FieldError = ({ name }) => fieldErrs[name]
    ? <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 3 }}>{fieldErrs[name]}</div>
    : null;

  const create = async () => {
    const fe = {};
    if (!form.fullName.trim()) fe.fullName = "Full Name is required.";
    if (!form.dateOfBirth) fe.dateOfBirth = "Date of Birth is required.";
    if (!form.nationalId.trim()) fe.nationalId = "National ID is required.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) fe.email = "Email is required.";
    else if (!emailRe.test(form.email)) fe.email = "Please enter a valid email address.";
    if (!form.phone.trim()) fe.phone = "Phone number is required.";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) fe.phone = "Please enter a valid phone number.";
    if (!form.streetAddress.trim()) fe.streetAddress = "Street Address is required.";
    if (!form.city.trim()) fe.city = "City is required.";
    if (!form.state.trim()) fe.state = "State is required.";
    if (!form.zipCode.trim()) fe.zipCode = "Zip Code is required.";
    if (!form.country.trim()) fe.country = "Country is required.";
    if (!isPolicyholder) {
      if (!form.temporaryPassword.trim()) {
        fe.temporaryPassword = "Login password is required.";
      } else {
        const pwdRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;
        if (!pwdRules.test(form.temporaryPassword))
          fe.temporaryPassword = "Password must be ≥12 chars with uppercase, lowercase, digit, and special character.";
      }
    }
    if (Object.keys(fe).length) { setFieldErrs(fe); setFormErr(""); return; }
    setSaving(true); setFormErr(""); setFieldErrs({});
    try {
      const endpoint = isPolicyholder ? "/api/v1/customers/my-profile" : "/api/v1/customers";
      const address = `${form.streetAddress}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}`;
      const payload = {
        fullName: form.fullName, dateOfBirth: form.dateOfBirth, gender: form.gender,
        nationalId: form.nationalId, email: form.email, phone: form.phone,
        address: address, occupation: form.occupation || null,
        annualIncome: form.annualIncome ? parseFloat(form.annualIncome) : null,
      };
      if (!isPolicyholder && form.temporaryPassword) {
        payload.temporaryPassword = form.temporaryPassword;
        if (form.portalUsername.trim()) payload.portalUsername = form.portalUsername.trim();
      }
      await api.post(endpoint, payload);
      setShowCreate(false); reload();
    } catch (e) {
      const msg = parseApiError(e) || "Failed to create policyholder.";
      // Try to pin the error to a specific field (e.g. duplicate email)
      const field = serverMsgToField(msg);
      if (field) {
        setFieldErrs({ [field]: msg });
        setFormErr("");
      } else {
        setFormErr(msg);
      }
    } finally { setSaving(false); }
  };

  const updateKyc = async (id, status) => {
    if (status === "REJECTED" && !kycReason.trim()) {
      setKycErr("Please provide a reason for rejection.");
      return;
    }
    setKycErr("");
    try {
      const params = new URLSearchParams({ status });
      if (kycReason.trim()) params.append("reason", kycReason.trim());
      await api.patch(`/api/v1/customers/${id}/kyc-status?${params.toString()}`);
      reload();
      setKycModal(null);
      setKycReason("");
    } catch (e) {
      setKycErr(e?.data?.message || "KYC update failed. Please try again.");
    }
  };

  const saveProfile = async () => {
    if (!editingProfile) return;
    const fe = {};
    if (!editingProfile.fullName?.trim()) fe.editFullName = "Full Name is required.";
    if (!editingProfile.dateOfBirth) fe.editDateOfBirth = "Date of Birth is required.";
    if (!editingProfile.nationalId?.trim()) fe.editNationalId = "National ID is required.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editingProfile.email?.trim()) fe.editEmail = "Email is required.";
    else if (!emailRe.test(editingProfile.email)) fe.editEmail = "Please enter a valid email address.";
    if (!editingProfile.phone?.trim()) fe.editPhone = "Phone number is required.";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(editingProfile.phone)) fe.editPhone = "Please enter a valid phone number.";
    if (Object.keys(fe).length) { setFieldErrs(fe); setFormErr(""); return; }

    setSaving(true); setFormErr(""); setFieldErrs({});
    try {
      // Use PUT (backend supports both PUT and PATCH for /my-profile)
      await api.put("/api/v1/customers/my-profile", {
        fullName: editingProfile.fullName,
        dateOfBirth: editingProfile.dateOfBirth,
        email: editingProfile.email,
        phone: editingProfile.phone,
        address: editingProfile.address,
        nationalId: editingProfile.nationalId,
        occupation: editingProfile.occupation || null,
      });
      setEditingProfile(null);
      reload();
    } catch (e) {
      const msg = parseApiError(e) || "Failed to update profile.";
      const rawField = serverMsgToField(msg);
      // Map server-error field key to edit-form field key prefix
      const editFieldMap = { email: "editEmail", phone: "editPhone", nationalId: "editNationalId" };
      const field = rawField && editFieldMap[rawField];
      if (field) {
        setFieldErrs({ [field]: msg });
        setFormErr("");
      } else {
        setFormErr(msg);
      }
    } finally { setSaving(false); }
  };

  const canCreate    = hasRole("ADMIN") || hasRole("AGENT");
  const canSelfCreate = isPolicyholder;
  const canUpdateKyc = hasRole("ADMIN") || hasRole("AGENT") || hasRole("COMPLIANCE") || hasRole("COMPLIANCE_OFFICER");

  const isSelfRegistered = c => c.userId && String(c.createdBy) === String(c.userId);

  const staffLabel = c => {
    if (!c.createdBy) return "Admin-Created";
    if (c.createdByName) return `${c.createdByName} (#${c.createdBy})`;
    return `Staff #${c.createdBy}`;
  };

  const registrationLabel = c => {
    if (isSelfRegistered(c)) return { text: "Self-Registered", bg: "rgba(39,174,96,0.1)", color: "#27ae60" };
    return { text: `Created by ${staffLabel(c)}`, bg: "rgba(52,152,219,0.1)", color: "#3498db" };
  };

  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">{isPolicyholder ? "My Profile" : "Policyholders"}</div>
          <div className="ip-section-sub">
            {isPolicyholder
              ? "Your policyholder profile & KYC verification status"
              : "Policyholder registry & KYC management"}
          </div>
        </div>
        {canCreate     && <button className="ip-btn primary" onClick={() => { setFieldErrs({}); setFormErr(""); setForm(f => ({ ...f, email: "", phone: "" })); setShowCreate(true); }}>＋ New Policyholder</button>}
        {canSelfCreate && (data?.totalElements === 0) && <button className="ip-btn primary" onClick={() => { setFieldErrs({}); setFormErr(""); setForm(f => ({ ...f, email: user?.email || "", phone: user?.phone || "" })); setShowCreate(true); }}>＋ Create My Profile</button>}
      </div>

      {/* KYC status banner for policyholders */}
      {isPolicyholder && data?.content?.[0] && (
        <div className="ip-card" style={{ marginBottom: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
          background: data.content[0].kycStatus === "VERIFIED" ? "var(--success-bg, #eafaf1)" : "var(--warn-bg, #fef9e7)",
          border: `1px solid ${data.content[0].kycStatus === "VERIFIED" ? "#27ae60" : "#f39c12"}` }}>
          <span style={{ fontSize: 22 }}>{data.content[0].kycStatus === "VERIFIED" ? "✅" : "⏳"}</span>
          <div>
            <div style={{ fontWeight: 600, color: data.content[0].kycStatus === "VERIFIED" ? "#27ae60" : "#f39c12" }}>
              KYC Status: {KYC_STATUS_LABELS[data.content[0].kycStatus] || data.content[0].kycStatus}
            </div>
            <div style={{ fontSize: 12, color: "var(--quiet)" }}>
              {data.content[0].kycStatus === "VERIFIED"
                ? "Your identity is verified. You can be assigned policies."
                : data.content[0].kycStatus === "REJECTED"
                ? <>Your KYC has been rejected. {data.content[0].kycRejectionReason && <><strong>Reason: </strong>{data.content[0].kycRejectionReason}</>} Please contact your agent to resolve this.</>
                : "Your documents are pending verification by an agent. Policies cannot be issued until KYC is approved."}
            </div>
          </div>
        </div>
      )}

      {/* Policyholder view (editable profile) */}
      {isPolicyholder ? (
        <div className="ip-card">
          {loading ? <Loading /> : !data?.content?.[0] ? (
            <Empty icon="👤" text="Profile not created yet" />
          ) : editingProfile ? (
            <div className="ip-form">
              <div className="ip-form-row">
                <div className="ip-field">
                  <label>Full Name *</label>
                  <input value={editingProfile.fullName}
                    onChange={e => { setEditingProfile({...editingProfile, fullName: e.target.value}); setFieldErrs(fe => { const n={...fe}; delete n.editFullName; return n; }); }}
                    style={fieldErrs.editFullName ? { border: "1.5px solid #e74c3c", borderRadius: 6 } : {}} />
                  {fieldErrs.editFullName && <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 3 }}>{fieldErrs.editFullName}</div>}
                </div>
                <div className="ip-field">
                  <label>Date of Birth *</label>
                  <input type="date" value={editingProfile.dateOfBirth}
                    onChange={e => { setEditingProfile({...editingProfile, dateOfBirth: e.target.value}); setFieldErrs(fe => { const n={...fe}; delete n.editDateOfBirth; return n; }); }}
                    style={fieldErrs.editDateOfBirth ? { border: "1.5px solid #e74c3c", borderRadius: 6 } : {}} />
                  {fieldErrs.editDateOfBirth && <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 3 }}>{fieldErrs.editDateOfBirth}</div>}
                </div>
              </div>
              <div className="ip-form-row">
                <div className="ip-field">
                  <label>Email <span style={{ fontWeight: 400, fontSize: 11, color: "var(--quiet)" }}>(cannot be changed here)</span></label>
                  <input type="email" value={editingProfile.email} readOnly
                    style={{ background: "var(--surface-alt, #f5f5f0)", color: "var(--quiet)", cursor: "not-allowed" }} />
                </div>
                <div className="ip-field">
                  <label>Phone *</label>
                  <input value={editingProfile.phone}
                    onChange={e => { setEditingProfile({...editingProfile, phone: e.target.value}); setFieldErrs(fe => { const n={...fe}; delete n.editPhone; return n; }); }}
                    style={fieldErrs.editPhone ? { border: "1.5px solid #e74c3c", borderRadius: 6 } : {}} />
                  {fieldErrs.editPhone && <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 3 }}>{fieldErrs.editPhone}</div>}
                </div>
              </div>
              <div className="ip-form-row">
                <div className="ip-field" style={{gridColumn: "1 / -1"}}><label>Address *</label><input value={editingProfile.address || ""} onChange={e => setEditingProfile({...editingProfile, address: e.target.value})} /></div>
              </div>
              <div className="ip-form-row">
                <div className="ip-field">
                  <label>National ID *</label>
                  <input value={editingProfile.nationalId}
                    onChange={e => { setEditingProfile({...editingProfile, nationalId: e.target.value}); setFieldErrs(fe => { const n={...fe}; delete n.editNationalId; return n; }); }}
                    style={fieldErrs.editNationalId ? { border: "1.5px solid #e74c3c", borderRadius: 6 } : {}} />
                  {fieldErrs.editNationalId && <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 3 }}>{fieldErrs.editNationalId}</div>}
                </div>
                <div className="ip-field"><label>Occupation</label><input value={editingProfile.occupation || ""} onChange={e => setEditingProfile({...editingProfile, occupation: e.target.value})} /></div>
              </div>
              {formErr && <Alert type="error">{formErr}</Alert>}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="ip-btn primary" onClick={saveProfile} disabled={saving}>{saving ? <Spinner /> : "Save Changes"}</button>
                <button className="ip-btn ghost" onClick={() => { setEditingProfile(null); setFieldErrs({}); setFormErr(""); }} disabled={saving}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              {formErr && <Alert type="error" style={{ marginBottom: 16 }}>{formErr}</Alert>}
              <DetailGrid items={[
                ["Full Name",     data.content[0].fullName],
                ["Email",         data.content[0].email],
                ["Phone",         data.content[0].phone],
                ["National ID",   data.content[0].nationalId],
                ["Date of Birth", fmtDate(data.content[0].dateOfBirth)],
                ["KYC Status",    <Badge status={data.content[0].kycStatus} />],
                ["Occupation",    data.content[0].occupation || "—"],
                ["Annual Income", fmtCurrency(data.content[0].annualIncome)],
                ["Registered",    fmtDate(data.content[0].createdAt)],
              ]} />
              <button className="ip-btn primary" style={{ marginTop: 20 }} onClick={() => setEditingProfile(data.content[0])}>✎ Edit Profile</button>
            </div>
          )}
        </div>
      ) : (
        /* Admin/Agent: All policyholders table */
        <div className="ip-card">
          {loading ? <Loading /> : !data ? <Empty /> : (
            <>
              <div className="ip-table-wrap">
                <table className="ip-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Phone</th><th>National ID</th>
                      <th>Registration</th><th>Created By</th><th>KYC</th><th>Risk</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.content || data).map(c => {
                      const reg = registrationLabel(c);
                      return (
                        <tr key={c.customerId} onClick={() => { setSelected(c); setDetailTab("profile"); }}>
                          <td><strong>{c.fullName}</strong></td>
                          <td style={{ fontSize: 12 }}>{c.email}</td>
                          <td style={{ fontSize: 12 }}>{c.phone}</td>
                          <td><span className="ip-mono">{c.nationalId}</span></td>
                          <td>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                              background: reg.bg, color: reg.color, display: "inline-block"
                            }}>
                              {reg.text}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--quiet)" }}>
                            {isSelfRegistered(c) ? "Self" : staffLabel(c)}
                          </td>
                          <td><Badge status={c.kycStatus} /></td>
                          <td>{c.riskCategory || "—"}</td>
                          <td onClick={e => e.stopPropagation()}>
                            {canUpdateKyc && (
                              <button className="ip-btn ghost sm" onClick={() => setKycModal(c)}>KYC</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.totalElements > 0 && (
                <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPage={setPage} />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Create Policyholder Modal ── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFieldErrs({}); setFormErr(""); }}
        title={isPolicyholder ? "Create My Profile" : "New Policyholder"}
        footer={
          <>
            <button className="ip-btn ghost" onClick={() => { setShowCreate(false); setFieldErrs({}); setFormErr(""); }}>Cancel</button>
            <button className="ip-btn primary" onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create"}</button>
          </>
        }>
        {formErr && <Alert type="error">{formErr}</Alert>}
        <div className="ip-form">
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Full Name *</label>
              <input value={form.fullName} onChange={setF("fullName")} placeholder="Enter full name" style={fieldStyle("fullName")} />
              <FieldError name="fullName" />
            </div>
            <div className="ip-field">
              <label>Date of Birth *</label>
              <input type="date" value={form.dateOfBirth} onChange={setF("dateOfBirth")} style={fieldStyle("dateOfBirth")} />
              <FieldError name="dateOfBirth" />
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field"><label>Gender</label>
              <select value={form.gender} onChange={setF("gender")}><option>MALE</option><option>FEMALE</option><option>OTHER</option></select>
            </div>
            <div className="ip-field">
              <label>National ID *</label>
              <input value={form.nationalId} onChange={setF("nationalId")} placeholder="Enter Aadhaar or PAN number" style={fieldStyle("nationalId")} />
              <FieldError name="nationalId" />
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field">
              <label>
                Email *{isPolicyholder && <span style={{ fontWeight: 400, fontSize: 11, color: "var(--quiet)", marginLeft: 6 }}>(from your registered account)</span>}
              </label>
              <input
                type="email" value={form.email}
                onChange={isPolicyholder ? undefined : setF("email")}
                readOnly={isPolicyholder}
                style={isPolicyholder
                  ? { background: "var(--surface-alt, #f5f5f0)", color: "var(--quiet)", cursor: "not-allowed" }
                  : fieldStyle("email")}
              />
              {!isPolicyholder && <FieldError name="email" />}
            </div>
            <div className="ip-field">
              <label>
                Phone *{isPolicyholder && <span style={{ fontWeight: 400, fontSize: 11, color: "var(--quiet)", marginLeft: 6 }}>(from your registered account)</span>}
              </label>
              <input
                value={form.phone}
                onChange={isPolicyholder ? undefined : setF("phone")}
                readOnly={isPolicyholder}
                placeholder="+91..."
                style={isPolicyholder
                  ? { background: "var(--surface-alt, #f5f5f0)", color: "var(--quiet)", cursor: "not-allowed" }
                  : fieldStyle("phone")}
              />
              {!isPolicyholder && <FieldError name="phone" />}
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field" style={{ gridColumn: "1 / -1" }}>
              <label>Street Address *</label>
              <input value={form.streetAddress} onChange={setF("streetAddress")} placeholder="Enter house no., street, area" style={fieldStyle("streetAddress")} />
              <FieldError name="streetAddress" />
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field">
              <label>City *</label>
              <input value={form.city} onChange={setF("city")} placeholder="Enter your city" style={fieldStyle("city")} />
              <FieldError name="city" />
            </div>
            <div className="ip-field">
              <label>State *</label>
              <input value={form.state} onChange={setF("state")} placeholder="Enter your state" style={fieldStyle("state")} />
              <FieldError name="state" />
            </div>
            <div className="ip-field">
              <label>Zip Code *</label>
              <input value={form.zipCode} onChange={setF("zipCode")} placeholder="Enter PIN code" style={fieldStyle("zipCode")} />
              <FieldError name="zipCode" />
            </div>
          </div>
          <div className="ip-form-row">
            <div className="ip-field">
              <label>Country *</label>
              <input value={form.country} onChange={setF("country")} placeholder="India" style={fieldStyle("country")} />
              <FieldError name="country" />
            </div>
            <div className="ip-field"><label>Occupation</label><input value={form.occupation} onChange={setF("occupation")} placeholder="Enter your occupation" /></div>
            <div className="ip-field"><label>Annual Income</label><input type="number" value={form.annualIncome} onChange={setF("annualIncome")} placeholder="Enter annual income in ₹" /></div>
          </div>
          {!isPolicyholder && (
            <div style={{ border: `1px solid ${fieldErrs.temporaryPassword ? "#e74c3c" : "var(--border)"}`, borderRadius: 8, padding: "14px 16px", background: "var(--surface-alt, #f8f9fb)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                Portal Login
              </div>
              <div style={{ fontSize: 12, color: "var(--quiet)", marginBottom: 12 }}>
                A login account will be created so the policyholder can access the portal.
              </div>
              <div className="ip-form-row">
                <div className="ip-field">
                  <label>Username <span style={{ fontWeight: 400, color: "var(--quiet)", fontSize: 11 }}>(auto-generated from email if blank)</span></label>
                  <input
                    value={form.portalUsername}
                    onChange={setF("portalUsername")}
                    placeholder="Enter a portal username"
                  />
                </div>
                <div className="ip-field">
                  <label>Login Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showTmpPwd ? "text" : "password"}
                      value={form.temporaryPassword}
                      onChange={setF("temporaryPassword")}
                      placeholder="Set a temporary login password"
                      style={{ paddingRight: 40, ...fieldStyle("temporaryPassword") }}
                    />
                    <span
                      onClick={() => setShowTmpPwd(v => !v)}
                      style={{ position: "absolute", right: 10, top: fieldErrs.temporaryPassword ? "calc(50% - 10px)" : "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 16, color: "var(--quiet)" }}
                    >
                      {showTmpPwd ? "🙈" : "👁"}
                    </span>
                  </div>
                  <FieldError name="temporaryPassword" />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setDetailTab("profile"); }} title="Policyholder Details" wide>
        {selected && (() => {
          const reg = registrationLabel(selected);
          return (
            <>
              <div className="ip-tabs">
                <div className={`ip-tab${detailTab === "profile" ? " active" : ""}`} onClick={() => setDetailTab("profile")}>Profile</div>
                <div className={`ip-tab${detailTab === "claims"  ? " active" : ""}`} onClick={() => setDetailTab("claims")}>Claims</div>
              </div>
              {detailTab === "profile" && (
                <DetailGrid items={[
                  ["Policyholder ID",  selected.customerId],
                  ["Full Name",        selected.fullName],
                  ["Registration",     <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: reg.bg, color: reg.color }}>{reg.text}</span>],
                  ["Created By",       isSelfRegistered(selected) ? "Self-registered" : staffLabel(selected)],
                  ["User Account ID",  selected.userId ? <span className="ip-mono">{selected.userId}</span> : "No portal access"],
                  ["Date of Birth",    fmtDate(selected.dateOfBirth)],
                  ["Gender",           selected.gender],
                  ["National ID",      selected.nationalId],
                  ["Email",            selected.email],
                  ["Phone",            selected.phone],
                  ["KYC Status",       <Badge status={selected.kycStatus} />],
                  ["Risk Category",    selected.riskCategory || "—"],
                  ["Occupation",       selected.occupation || "—"],
                  ["Annual Income",    fmtCurrency(selected.annualIncome)],
                  ["Registered",       fmtDate(selected.createdAt)],
                  ["Address",          selected.address],
                ]} />
              )}
              {detailTab === "claims" && (
                <PolicyholderClaims customerId={selected.customerId} />
              )}
            </>
          );
        })()}
      </Modal>

      {/* ── KYC Modal ── */}
      <Modal open={!!kycModal} onClose={() => { setKycModal(null); setKycReason(""); setKycErr(""); }} title="Update KYC Status"
        footer={
          <>
            <button className="ip-btn ghost"    onClick={() => { setKycModal(null); setKycReason(""); setKycErr(""); }}>Cancel</button>
            <button className="ip-btn primary"  onClick={() => updateKyc(kycModal.customerId, "VERIFIED")}>✔ Mark Verified</button>
            <button className="ip-btn secondary" onClick={() => updateKyc(kycModal.customerId, "IN_PROGRESS")}>⟳ In Progress</button>
            <button className="ip-btn danger"   onClick={() => updateKyc(kycModal.customerId, "REJECTED")}>✖ Reject</button>
          </>
        }>
        {kycModal && (
          <div style={{ color: "var(--text)" }}>
            <p>Update KYC verification status for <strong>{kycModal.fullName}</strong>.</p>
            <p style={{ marginTop: 8, fontSize: 13, color: "var(--quiet)" }}>
              Current status: <Badge status={kycModal.kycStatus} />
            </p>
            <div className="ip-field" style={{ marginTop: 16 }}>
              <label>
                Rejection Reason{" "}
                <span style={{ fontWeight: 600, fontSize: 11, color: "#e74c3c" }}>* required when rejecting</span>
              </label>
              <textarea
                rows={3}
                value={kycReason}
                onChange={e => { setKycReason(e.target.value); setKycErr(""); }}
                placeholder="e.g. Document unclear, National ID mismatch, Photo quality insufficient…"
                style={{
                  width: "100%", resize: "vertical",
                  border: kycErr ? "1.5px solid #e74c3c" : "1px solid var(--border)",
                  borderRadius: 6, padding: "8px 10px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
              />
              {kycErr && (
                <div style={{ color: "#e74c3c", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>⚠</span> {kycErr}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
