import { useState, useCallback, useEffect, useRef } from "react";
import api from "../api";

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────────────────────
export function Spinner({ lg }) {
  return <span className={`ip-spin${lg ? " lg" : ""}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
export function Loading() {
  return (
    <div className="ip-loading">
      <Spinner lg />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
export function Empty({ icon = "📭", text = "No results found" }) {
  return (
    <div className="ip-empty">
      <span className="ip-empty-icon">{icon}</span>
      <span className="ip-empty-text">{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT BANNER
// ─────────────────────────────────────────────────────────────────────────────
export function Alert({ type = "error", children }) {
  const icons = { error: "⚠", success: "✓", info: "ℹ" };
  return (
    <div className={`ip-alert ${type}`}>
      <span>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_DISPLAY = {
  PENDING_UNDERWRITING: "Pending UW", PARTIALLY_APPROVED: "Partial Approved",
  UNDER_REVIEW: "Under Review", IN_PROGRESS: "In Progress",
  PENDING_VERIFICATION: "Pending", ACTIVE: "Active", INACTIVE: "Inactive",
  SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected",
  SETTLED: "Settled", CLOSED: "Closed", VERIFIED: "Verified",
  EXPIRED: "Expired", CANCELLED: "Cancelled", PENDING: "Pending",
  LOCKED: "Locked", DRAFT: "Draft", PAID: "Paid", FAILED: "Failed",
  RENEWED: "Renewed", LAPSED: "Lapsed", READ: "Read", UNREAD: "Unread",
};

export function Badge({ status }) {
  const s = (status || "").toLowerCase().replace(/ /g, "_");
  const label = STATUS_DISPLAY[status] || status;
  return <span className={`ip-badge ${s}`}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide, footer }) {
  if (!open) return null;
  return (
    <div
      className="ip-modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`ip-modal${wide ? " wide" : ""}`}>
        <div className="ip-modal-header">
          <div className="ip-modal-title">{title}</div>
          <span className="ip-modal-close" onClick={onClose}>×</span>
        </div>
        {children}
        {footer && <div className="ip-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, totalElements, size, onPage }) {
  const from = page * size + 1;
  const to   = Math.min((page + 1) * size, totalElements);
  const pages = [];
  const start = Math.max(0, page - 2);
  const end   = Math.min(totalPages - 1, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="ip-pagination">
      <span className="ip-pagination-info">Showing {from}–{to} of {totalElements}</span>
      <div className="ip-pagination-controls">
        <button className="ip-page-btn" disabled={page === 0} onClick={() => onPage(page - 1)}>‹</button>
        {pages.map(p => (
          <button
            key={p}
            className={`ip-page-btn${p === page ? " active" : ""}`}
            onClick={() => onPage(p)}
          >
            {p + 1}
          </button>
        ))}
        <button className="ip-page-btn" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>›</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL GRID  (label / value pairs in a 2-col grid)
// ─────────────────────────────────────────────────────────────────────────────
export function DetailGrid({ items }) {
  return (
    <div className="ip-detail-grid">
      {items.map(([k, v]) => (
        <div className="ip-detail-item" key={k}>
          <div className="ip-detail-key">{k}</div>
          <div className="ip-detail-val">{v ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useApi — generic data-fetching hook
// ─────────────────────────────────────────────────────────────────────────────
export function useApi(fn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try   { const r = await fn(); setData(r); }
    catch (e) { setError(e?.data?.message || "Request failed"); }
    finally   { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────
export function fmtCurrency(v) {
  if (!v) return "—";
  return `₹${parseFloat(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER SEARCH TYPEAHEAD
// Props: value (customerId string), onChange(customerId, customerObj)
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerSearch({ value, onChange, label = "Customer", required = false }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [display, setDisplay] = useState(value ? `ID: ${value}` : "");
  const debounce = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => {
    if (!value) { setDisplay(""); setQuery(""); }
  }, [value]);

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(q => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get(`/api/v1/customers?search=${encodeURIComponent(q)}&size=8`);
        const items = r.data?.content || r.data || [];
        setResults(items);
        setOpen(items.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const handleInput = e => {
    const q = e.target.value;
    setQuery(q);
    setDisplay(q);
    if (!q) onChange("", null);
    search(q);
  };

  const select = c => {
    const label2 = `${c.fullName} (ID: ${c.customerId})`;
    setDisplay(label2);
    setQuery(label2);
    setResults([]);
    setOpen(false);
    onChange(String(c.customerId), c);
  };

  return (
    <div className="ip-field" ref={wrapRef} style={{ position: "relative" }}>
      <label>{label}{required && " *"}</label>
      <input
        value={display}
        onChange={handleInput}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Type name, email or phone…"
        autoComplete="off"
      />
      {loading && <span style={{ position: "absolute", right: 10, top: 32, fontSize: 11, color: "var(--ghost)" }}>searching…</span>}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "var(--surface)", border: "1px solid var(--rim)",
          borderRadius: "var(--r-sm)", boxShadow: "0 4px 16px rgba(0,0,0,.18)",
          maxHeight: 220, overflowY: "auto",
        }}>
          {results.map(c => (
            <div
              key={c.customerId}
              onMouseDown={() => select(c)}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--rim)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
              onMouseLeave={e => e.currentTarget.style.background = ""}
            >
              <div style={{ fontWeight: 600 }}>{c.fullName}</div>
              <div style={{ fontSize: 11, color: "var(--quiet)" }}>ID: {c.customerId} · {c.email} · {c.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
