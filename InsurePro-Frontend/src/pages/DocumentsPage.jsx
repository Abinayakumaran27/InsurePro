import { useState, useRef, useEffect } from "react";
import api, { BASE_URL } from "../api";
import { useAuth } from "../AuthContext";
import { Loading, Empty, Badge, Spinner, fmtDate } from "../components/UI";

const DOC_TYPES_KYC    = ["NATIONAL_ID","PASSPORT","DRIVING_LICENSE","UTILITY_BILL","OTHER"];
const DOC_TYPES_STAFF  = ["POLICY_WORDING","SCHEDULE","ENDORSEMENT","FIR","MEDICAL_REPORT","BILLS","PHOTOS","DEATH_CERT","NATIONAL_ID","PASSPORT","DRIVING_LICENSE","UTILITY_BILL","OTHER"];
const ENTITY_TYPES     = ["POLICY","CLAIM","CUSTOMER","KYC"];
const ACCESS_LEVELS    = ["PUBLIC","INTERNAL","RESTRICTED"];

export default function DocumentsPage() {
  const { hasRole, customerId } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");

  // ── Policyholder state ──────────────────────────────────────────────────────
  const [myDocs,      setMyDocs]      = useState(null);
  const [myLoading,   setMyLoading]   = useState(false);
  const [uploadType,  setUploadType]  = useState("NATIONAL_ID");
  const [uploadFile,  setUploadFile]  = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadErr,   setUploadErr]   = useState("");
  const [uploadOk,    setUploadOk]    = useState("");

  // ── Staff state ─────────────────────────────────────────────────────────────
  const [nameSearch,    setNameSearch]    = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [searchErr,     setSearchErr]     = useState("");
  const [staffDocs,     setStaffDocs]     = useState(null);
  const [docsLoading,   setDocsLoading]   = useState(false);

  const [uploadForm, setUploadForm] = useState({
    entityType: "KYC", entityId: "", documentType: "OTHER", accessLevel: "INTERNAL",
  });
  const [staffFile,    setStaffFile]    = useState(null);
  const [staffUploading, setStaffUploading] = useState(false);

  const fileRef      = useRef();
  const staffFileRef = useRef();

  // Load policyholder's own KYC documents on mount
  useEffect(() => {
    if (isPolicyholder && customerId) loadMyDocs();
  }, [isPolicyholder, customerId]);

  const loadMyDocs = async () => {
    setMyLoading(true);
    try {
      const r = await api.get(`/api/v1/documents/entity/KYC/${customerId}`);
      setMyDocs(r.data || []);
    } catch {
      setMyDocs([]);
    } finally {
      setMyLoading(false);
    }
  };

  const uploadMyDoc = async () => {
    if (!uploadFile) { setUploadErr("Please select a file."); return; }
    if (!customerId) { setUploadErr("Profile not found. Please create your profile first."); return; }
    setUploading(true); setUploadErr(""); setUploadOk("");
    const fd = new FormData();
    fd.append("file",         uploadFile);
    fd.append("entityType",   "KYC");
    fd.append("entityId",     String(customerId));
    fd.append("documentType", uploadType);
    fd.append("accessLevel",  "PUBLIC");
    try {
      await fetch(`${BASE_URL}/api/v1/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${api.token}` },
        body: fd,
      });
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setUploadOk("Document uploaded successfully.");
      loadMyDocs();
    } catch {
      setUploadErr("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // View document inline in new tab
  const viewDoc = async id => {
    try {
      const res  = await fetch(`${BASE_URL}/api/v1/documents/${id}/view`, {
        headers: { Authorization: `Bearer ${api.token}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {}
  };

  // Staff: search customers by name, then load their documents
  const searchByName = async () => {
    if (!nameSearch.trim()) return;
    setSearchLoading(true); setSearchErr(""); setFoundCustomer(null); setStaffDocs(null);
    try {
      const r = await api.get(`/api/v1/customers?search=${encodeURIComponent(nameSearch)}&size=1`);
      const list = r.data?.content || [];
      if (!list.length) { setSearchErr("No policyholder found with that name."); return; }
      const cust = list[0];
      setFoundCustomer(cust);
      setDocsLoading(true);
      try {
        const dr = await api.get(`/api/v1/documents/entity/KYC/${cust.customerId}`);
        setStaffDocs(dr.data || []);
      } catch { setStaffDocs([]); }
      finally { setDocsLoading(false); }
    } catch {
      setSearchErr("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const staffUpload = async () => {
    if (!staffFile) return;
    setStaffUploading(true);
    const fd = new FormData();
    fd.append("file",         staffFile);
    fd.append("entityType",   uploadForm.entityType);
    fd.append("entityId",     uploadForm.entityId);
    fd.append("documentType", uploadForm.documentType);
    fd.append("accessLevel",  uploadForm.accessLevel);
    try {
      await fetch(`${BASE_URL}/api/v1/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${api.token}` },
        body: fd,
      });
      setStaffFile(null);
      if (staffFileRef.current) staffFileRef.current.value = "";
      if (foundCustomer && uploadForm.entityType === "KYC" && String(uploadForm.entityId) === String(foundCustomer.customerId)) {
        const dr = await api.get(`/api/v1/documents/entity/KYC/${foundCustomer.customerId}`);
        setStaffDocs(dr.data || []);
      }
    } catch {}
    finally { setStaffUploading(false); }
  };

  // ── Policyholder view ───────────────────────────────────────────────────────
  if (isPolicyholder) {
    return (
      <div>
        <div className="ip-section-header">
          <div>
            <div className="ip-section-title">My Documents</div>
            <div className="ip-section-sub">Upload and view your KYC documents</div>
          </div>
        </div>

        {/* Upload */}
        <div className="ip-card" style={{ marginBottom: 20 }}>
          <div className="ip-card-header"><div className="ip-card-title">Upload KYC Document</div></div>
          <div className="ip-form">
            <div className="ip-form-row">
              <div className="ip-field">
                <label>Document Type</label>
                <select value={uploadType} onChange={e => setUploadType(e.target.value)}>
                  {DOC_TYPES_KYC.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>File (PDF / JPG / PNG, max 25 MB)</label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { setUploadFile(e.target.files[0]); setUploadErr(""); setUploadOk(""); }}
                  style={{ padding: "6px 8px" }} />
              </div>
            </div>
            {uploadErr && <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 8 }}>{uploadErr}</div>}
            {uploadOk  && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 8 }}>{uploadOk}</div>}
            <button className="ip-btn primary" onClick={uploadMyDoc} disabled={uploading || !uploadFile}>
              {uploading ? <><Spinner /> Uploading…</> : "Upload"}
            </button>
          </div>
        </div>

        {/* My Documents */}
        <div className="ip-card">
          <div className="ip-card-header"><div className="ip-card-title">My Uploaded Documents</div></div>
          {myLoading ? <Loading /> : !myDocs ? null : !myDocs.length ? (
            <Empty icon="📁" text="No documents uploaded yet" />
          ) : (
            <div className="ip-table-wrap">
              <table className="ip-table">
                <thead>
                  <tr><th>File Name</th><th>Type</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {myDocs.map(d => (
                    <tr key={d.documentId}>
                      <td>{d.fileName}</td>
                      <td>{d.documentType?.replace(/_/g, " ")}</td>
                      <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(d.createdAt)}</td>
                      <td>
                        <button className="ip-btn ghost sm" onClick={() => viewDoc(d.documentId)}>
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Staff / Admin view ──────────────────────────────────────────────────────
  return (
    <div>
      <div className="ip-section-header">
        <div>
          <div className="ip-section-title">Documents</div>
          <div className="ip-section-sub">Versioned document repository</div>
        </div>
      </div>

      <div className="ip-two-col">
        {/* Search by policyholder name */}
        <div className="ip-card">
          <div className="ip-card-header"><div className="ip-card-title">Search by Policyholder Name</div></div>
          <div className="ip-form">
            <div className="ip-field">
              <label>Policyholder Name</label>
              <input
                value={nameSearch}
                onChange={e => setNameSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchByName()}
                placeholder="e.g. John Smith"
              />
            </div>
            {searchErr && <div style={{ color: "#e74c3c", fontSize: 13 }}>{searchErr}</div>}
            <button className="ip-btn primary" onClick={searchByName} disabled={searchLoading}>
              {searchLoading ? <><Spinner /> Searching…</> : "Search"}
            </button>
          </div>
          {foundCustomer && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(52,152,219,0.08)", borderRadius: 8, fontSize: 13 }}>
              <strong>{foundCustomer.fullName}</strong>
              <span style={{ color: "var(--quiet)", marginLeft: 8 }}>ID: {foundCustomer.customerId}</span>
              <span style={{ color: "var(--quiet)", marginLeft: 8 }}>KYC: </span>
              <Badge status={foundCustomer.kycStatus} />
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="ip-card">
          <div className="ip-card-header"><div className="ip-card-title">Upload Document</div></div>
          <div className="ip-form">
            <div className="ip-form-row">
              <div className="ip-field">
                <label>Entity Type</label>
                <select value={uploadForm.entityType} onChange={e => setUploadForm(f => ({ ...f, entityType: e.target.value }))}>
                  {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>Entity ID</label>
                <input value={uploadForm.entityId} onChange={e => setUploadForm(f => ({ ...f, entityId: e.target.value }))} placeholder="e.g. customer ID" />
              </div>
            </div>
            <div className="ip-form-row">
              <div className="ip-field">
                <label>Doc Type</label>
                <select value={uploadForm.documentType} onChange={e => setUploadForm(f => ({ ...f, documentType: e.target.value }))}>
                  {DOC_TYPES_STAFF.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="ip-field">
                <label>Access Level</label>
                <select value={uploadForm.accessLevel} onChange={e => setUploadForm(f => ({ ...f, accessLevel: e.target.value }))}>
                  {ACCESS_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="ip-field">
              <label>File (PDF / JPG / PNG, max 25 MB)</label>
              <input ref={staffFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                onChange={e => setStaffFile(e.target.files[0])} style={{ padding: "6px 8px" }} />
            </div>
            <button className="ip-btn primary" onClick={staffUpload} disabled={staffUploading || !staffFile}>
              {staffUploading ? <><Spinner /> Uploading…</> : "Upload"}
            </button>
          </div>
        </div>
      </div>

      {/* Documents results */}
      {(staffDocs || docsLoading) && (
        <div className="ip-card" style={{ marginTop: 20 }}>
          <div className="ip-card-header">
            <div className="ip-card-title">
              {foundCustomer ? `KYC Documents — ${foundCustomer.fullName}` : "Documents"}
            </div>
          </div>
          {docsLoading ? <Loading /> : !staffDocs?.length ? <Empty icon="📁" text="No documents found" /> : (
            <div className="ip-table-wrap">
              <table className="ip-table">
                <thead>
                  <tr><th>ID</th><th>File Name</th><th>Type</th><th>Access</th><th>Uploaded By</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {staffDocs.map(d => (
                    <tr key={d.documentId}>
                      <td>{d.documentId}</td>
                      <td>{d.fileName}</td>
                      <td>{d.documentType?.replace(/_/g, " ")}</td>
                      <td><Badge status={d.accessLevel} /></td>
                      <td>{d.uploadedBy}</td>
                      <td style={{ fontSize: 11, color: "var(--quiet)" }}>{fmtDate(d.createdAt)}</td>
                      <td>
                        <button className="ip-btn ghost sm" onClick={() => viewDoc(d.documentId)}>
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
