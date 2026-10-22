import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { Alert, Spinner, Modal, Badge } from "../components/UI";

// ─── Formatting helpers ───────────────────────────────────────────────────────
const fmt  = n  => `₹${parseFloat(n).toLocaleString("en-IN")}`;
const fmtD = d  => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ─── Per-type visual identity ─────────────────────────────────────────────────
const TYPE_META = {
  Life: {
    icon: "❤️", color: "#e74c3c", bg: "#fdf2f2",
    tagline: "Secure your family's future",
    features: [
      "Death benefit protects family for 20+ years",
      "Tax benefit under Sec 80C up to ₹1.5 lakh/yr",
      "Accidental death & disability riders available",
      "Cashless claim settlement within 3 working days",
    ],
  },
  Health: {
    icon: "🏥", color: "#27ae60", bg: "#f0faf4",
    tagline: "Complete medical protection",
    features: [
      "Cashless treatment at 7,000+ network hospitals",
      "Pre & post-hospitalisation (60 days coverage)",
      "Day-care procedures & OPD cover included",
      "Critical illness rider for 32 major diseases",
    ],
  },
  Vehicle: {
    icon: "🚗", color: "#2980b9", bg: "#eaf4fb",
    tagline: "Drive with complete peace of mind",
    features: [
      "Third-party liability: ₹7.5 crore bodily injury",
      "Own damage protection up to vehicle's IDV",
      "24/7 roadside assistance & free towing",
      "Zero depreciation: claim full replacement cost",
    ],
  },
  Property: {
    icon: "🏠", color: "#8e44ad", bg: "#f5f0fa",
    tagline: "Protect your home and belongings",
    features: [
      "Structure & contents fully covered",
      "Fire, flood, earthquake, and theft protection",
      "Temporary accommodation allowance included",
      "Fast-track claim settlement within 7 days",
    ],
  },
  Travel: {
    icon: "✈️", color: "#16a085", bg: "#e8f8f5",
    tagline: "Travel worry-free worldwide",
    features: [
      "Medical emergency cover up to $100,000",
      "Trip cancellation & baggage loss cover",
      "Flight delay & missed connection allowance",
      "24/7 international emergency helpline",
    ],
  },
};

// ─── Fixed plan tiers per insurance type ─────────────────────────────────────
const PLAN_TIERS = {
  Life: [
    { label: "Term Basic",    coverage: 500000,   tag: null,        highlightColor: "#e74c3c" },
    { label: "Term Plus",     coverage: 2500000,  tag: "Popular",   highlightColor: "#e74c3c" },
    { label: "Term Premium",  coverage: 5000000,  tag: "Best Value",highlightColor: "#e74c3c" },
  ],
  Health: [
    { label: "Individual",    coverage: 300000,   tag: null,        highlightColor: "#27ae60" },
    { label: "Individual+",   coverage: 500000,   tag: "Popular",   highlightColor: "#27ae60" },
    { label: "Family Floater",coverage: 1000000,  tag: "Best Value",highlightColor: "#27ae60" },
  ],
  Vehicle: [
    { label: "Third Party",   coverage: 100000,   tag: null,        highlightColor: "#2980b9" },
    { label: "Comprehensive", coverage: 300000,   tag: "Popular",   highlightColor: "#2980b9" },
    { label: "Zero Dep",      coverage: 500000,   tag: "Best Value",highlightColor: "#2980b9" },
  ],
  Property: [
    { label: "Home Basic",    coverage: 1000000,  tag: null,        highlightColor: "#8e44ad" },
    { label: "Home Plus",     coverage: 2500000,  tag: "Popular",   highlightColor: "#8e44ad" },
    { label: "Home Premium",  coverage: 5000000,  tag: "Best Value",highlightColor: "#8e44ad" },
  ],
  Travel: [
    { label: "Single Trip",   coverage: 500000,   tag: null,        highlightColor: "#16a085" },
    { label: "Annual Multi",  coverage: 1000000,  tag: "Popular",   highlightColor: "#16a085" },
    { label: "Global Elite",  coverage: 2000000,  tag: "Best Value",highlightColor: "#16a085" },
  ],
};

function getDefaultTiers(color) {
  return [
    { label: "Basic",   coverage: 300000,  tag: null,        highlightColor: color || "#7f8c8d" },
    { label: "Standard",coverage: 750000,  tag: "Popular",   highlightColor: color || "#7f8c8d" },
    { label: "Premium", coverage: 1500000, tag: "Best Value",highlightColor: color || "#7f8c8d" },
  ];
}

function calcPremium(basePremium, coverage) {
  const base = parseFloat(basePremium) || 0;
  const annual = parseFloat(coverage) * 0.025 + base;
  return Math.round(annual * 1.18);
}

// ─── Plan tier card ───────────────────────────────────────────────────────────
function TierCard({ tier, basePremium, color, selected, onSelect }) {
  const premium = calcPremium(basePremium, tier.coverage);
  const monthly = Math.round(premium / 12);
  const isPopular   = tier.tag === "Popular";
  const isBest      = tier.tag === "Best Value";
  const highlighted = isPopular || isBest;

  return (
    <div
      onClick={onSelect}
      style={{
        position: "relative",
        background: selected ? color + "0f" : "var(--surface)",
        border: `2px solid ${selected ? color : highlighted ? color + "60" : "var(--rim)"}`,
        borderRadius: 12,
        padding: "18px 16px 16px",
        cursor: "pointer",
        transition: "all 0.2s",
        flex: "1 1 0",
      }}
    >
      {tier.tag && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: isPopular ? color : "#f39c12",
          color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "2px 12px", borderRadius: 20, whiteSpace: "nowrap",
        }}>
          {tier.tag}
        </div>
      )}
      <div style={{ marginTop: tier.tag ? 4 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: selected ? color : "var(--text)", marginBottom: 10 }}>
          {tier.label}
        </div>
        <div style={{ fontSize: 11, color: "var(--quiet)", marginBottom: 2 }}>SUM INSURED</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: selected ? color : "var(--text)", marginBottom: 10 }}>
          {fmt(tier.coverage)}
        </div>
        <div style={{ background: selected ? color + "18" : "#f8f9fa", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--quiet)", marginBottom: 2 }}>ANNUAL PREMIUM</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: selected ? color : "#27ae60" }}>
            {fmt(premium)} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--quiet)" }}>/yr</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--quiet)", marginTop: 3 }}>
            ≈ {fmt(monthly)}/month · incl. 18% GST
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 13, fontWeight: 600, color: selected ? color : "var(--quiet)" }}>
          <span style={{
            width: 18, height: 18, borderRadius: "50%",
            border: `2px solid ${selected ? color : "var(--rim)"}`,
            background: selected ? color : "transparent",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "#fff", flexShrink: 0,
          }}>
            {selected ? "✓" : ""}
          </span>
          {selected ? "Selected" : "Choose"}
        </div>
      </div>
    </div>
  );
}

// ─── Policy type card ─────────────────────────────────────────────────────────
function PolicyTypeCard({ type, onBuy }) {
  const meta  = TYPE_META[type.name] || { icon: "🛡️", color: "#7f8c8d", bg: "#f8f9fa", tagline: "", features: [] };
  const tiers = PLAN_TIERS[type.name] || getDefaultTiers(meta.color);
  const [selected, setSelected] = useState(1);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)"; }}
    >
      <div style={{ background: meta.bg, padding: "24px 24px 18px", borderBottom: `3px solid ${meta.color}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 38 }}>{meta.icon}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: meta.color }}>{type.name} Insurance</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{meta.tagline}</div>
          </div>
          {type.underwritingRequired && (
            <span style={{ marginLeft: "auto", fontSize: 10, background: "#fff3cd", color: "#856404", padding: "3px 10px", borderRadius: 20, border: "1px solid #ffc107", whiteSpace: "nowrap" }}>
              Underwriting req.
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
          {meta.features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "#555", lineHeight: 1.4 }}>
              <span style={{ color: meta.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--quiet)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
          Choose Your Plan
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {tiers.map((tier, i) => (
            <TierCard
              key={tier.label}
              tier={tier}
              basePremium={type.basePremium}
              color={meta.color}
              selected={selected === i}
              onSelect={() => setSelected(i)}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 24px", marginTop: "auto" }}>
        <button
          className="ip-btn primary"
          style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 600, background: meta.color, borderColor: meta.color, borderRadius: 10 }}
          onClick={() => onBuy(type, tiers[selected])}
        >
          Get {type.name} — {tiers[selected].label} →
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PolicyMarketPage({ onNavigate }) {
  const { customerId, hasRole } = useAuth();
  const isPolicyholder = hasRole("POLICYHOLDER");

  const [types,   setTypes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  const [buyModal, setBuyModal] = useState(null);
  const [form, setForm] = useState({ startDate: "", endDate: "", nomineeName: "", nomineeRelation: "" });
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");
  const [success,  setSuccess]  = useState(null);

  useEffect(() => {
    api.get("/api/v1/policies/types")
      .then(r => setTypes(r.data || []))
      .catch(() => setErr("Unable to load policy plans. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const openBuy = (type, tier) => {
    const today = new Date();
    const next  = new Date(today);
    next.setFullYear(today.getFullYear() + 1);
    const fmtISO = d => d.toISOString().split("T")[0];
    setForm({ startDate: fmtISO(today), endDate: fmtISO(next), nomineeName: "", nomineeRelation: "" });
    setFormErr(""); setSuccess(null);
    setBuyModal({ type, tier });
  };

  const purchase = async () => {
    const errors = [];
    if (!form.startDate) errors.push("Start date is required.");
    if (!form.endDate)   errors.push("End date is required.");
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      errors.push("End date must be after start date.");

    if (errors.length) { setFormErr(errors.join(" ")); return; }
    if (!customerId) { setFormErr("Your customer profile is not linked. Please complete your profile first."); return; }
    setSaving(true); setFormErr("");
    try {
      const res = await api.post("/api/v1/policies", {
        customerId:      customerId,
        policyTypeId:    buyModal.type.typeId,
        coverageAmount:  buyModal.tier.coverage,
        startDate:       form.startDate,
        endDate:         form.endDate,
        nomineeName:     form.nomineeName || null,
        nomineeRelation: form.nomineeRelation || null,
      });

      const policy = res.data;

      // auto-create underwriting request when policy type requires it
      if (buyModal.type.underwritingRequired && policy?.policyId) {
        try {
          await api.post("/api/v1/underwriting", {
            policyId:          policy.policyId,
            customerId:        customerId,
            policyTypeId:      buyModal.type.typeId,
            coverageAmount:    buyModal.tier.coverage,
            customerAge:       50,
            hasExistingClaims: true,
            smoker:            true,
            healthConditions:  "",
          });
        } catch (uwErr) {
          console.warn("Underwriting initiation failed:", uwErr);
        }
      }

      setSuccess(policy);
    } catch (e) {
      setFormErr(e?.data?.message || "Failed to create policy. Ensure your KYC is verified.");
    } finally {
      setSaving(false);
    }
  };

  const meta         = buyModal ? (TYPE_META[buyModal.type.name] || { icon: "🛡️", color: "#7f8c8d", bg: "#f8f9fa" }) : {};
  const fixedPremium = buyModal ? calcPremium(buyModal.type.basePremium, buyModal.tier.coverage) : 0;

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRadius: 16, padding: "40px 40px 36px", marginBottom: 32,
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, fontSize: 180, opacity: 0.04 }}>🛡️</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 13, color: "#a0aec0", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            InsurePro Marketplace
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
            Protect What Matters Most
          </h1>
          <p style={{ fontSize: 15, color: "#94a3b8", maxWidth: 520, margin: "0 0 20px", lineHeight: 1.6 }}>
            Choose from our transparent, fixed-price plans. No hidden charges — what you see is what you pay.
          </p>
          {!customerId && isPolicyholder && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,193,7,0.15)", border: "1px solid rgba(255,193,7,0.4)", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#ffc107" }}>
              ⚠️ Complete your customer profile before purchasing a policy
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 32, marginTop: 24, flexWrap: "wrap" }}>
          {[["🏆", "Trusted Coverage"], ["💰", "Fixed Pricing"], ["⚡", "Instant Issuance"], ["🔒", "IRDAI Compliant"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>{label}
            </div>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Available Plans</div>
        <div style={{ fontSize: 13, color: "var(--quiet)" }}>
          Select a plan tier on each card, then click to purchase. All premiums are fixed and include 18% GST.
        </div>
      </div>

      {err && <Alert type="error">{err}</Alert>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spinner /><div style={{ marginTop: 12, color: "var(--quiet)" }}>Loading plans…</div>
        </div>
      ) : types.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--quiet)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No plans available</div>
          <div style={{ fontSize: 13 }}>Contact your agent to set up insurance plans</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24, marginBottom: 32 }}>
          {types.map(t => (
            <PolicyTypeCard key={t.typeId} type={t} onBuy={openBuy} />
          ))}
        </div>
      )}

      {/* Why Choose Us */}
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "32px 40px", marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>Why Choose InsurePro?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
          {[
            ["🔒", "IRDAI Regulated",   "Fully compliant insurance products"],
            ["💰", "No Hidden Charges", "Fixed premium — no surprises"],
            ["⚡", "Instant Policy",    "Policy issued within minutes"],
            ["🤝", "Personal Agent",    "Dedicated agent assigned to you"],
            ["📱", "Digital First",     "Manage everything online 24/7"],
            ["🏥", "Wide Network",      "7,000+ empanelled hospitals"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ textAlign: "center", padding: "16px 12px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: "var(--quiet)" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Purchase Modal ── */}
      <Modal
        open={!!buyModal}
        onClose={() => { setBuyModal(null); setSuccess(null); }}
        title={success ? "Policy Created!" : `Purchase ${buyModal?.type?.name} Insurance`}
        wide
        footer={
          success ? (
            <button className="ip-btn primary" onClick={() => { setBuyModal(null); setSuccess(null); }}>Done</button>
          ) : (
            <>
              <button className="ip-btn ghost" onClick={() => setBuyModal(null)}>Cancel</button>
              <button
                className="ip-btn primary"
                onClick={purchase}
                disabled={saving}
                style={{ background: meta.color, borderColor: meta.color }}
              >
                {saving ? <Spinner /> : `Confirm Purchase — ${fmt(fixedPremium)}/yr`}
              </button>
            </>
          )
        }
      >
        {success ? (
          /* ── Success screen ── */
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#27ae60" }}>Policy Created!</div>
            <div style={{ fontSize: 14, color: "var(--quiet)", marginBottom: 20 }}>
              Your application has been submitted and is under review.
            </div>
            <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "20px 24px", display: "inline-block", textAlign: "left", minWidth: 300 }}>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  ["Policy Number", <span className="ip-mono">{success.policyNumber}</span>],
                  ["Type",          success.policyTypeName],
                  ["Plan",          buyModal?.tier?.label],
                  ["Sum Insured",   fmt(success.coverageAmount)],
                  ["Annual Premium",`${fmt(success.premiumAmount)} / year`],
                  ["Start Date",    fmtD(success.startDate)],
                  ["End Date",      fmtD(success.endDate)],
                  ["Status",        <Badge status={success.status} />],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 20, fontSize: 13 }}>
                    <span style={{ color: "var(--quiet)", fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--quiet)" }}>
              {success.status === "PENDING_UNDERWRITING"
                ? "An underwriter will review your application shortly."
                : "Your agent will activate the policy after review."}
            </div>
          </div>
        ) : buyModal && (
          /* ── Purchase form ── */
          <div>
            {formErr && <Alert type="error">{formErr}</Alert>}

            {/* Plan summary banner */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
              padding: "14px 18px", background: meta.bg || "#f8f9fa",
              borderRadius: 12, border: `1px solid ${meta.color}30`,
            }}>
              <span style={{ fontSize: 32 }}>{meta.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: meta.color, fontSize: 16 }}>
                  {buyModal.type.name} Insurance — {buyModal.tier.label}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{buyModal.type.description}</div>
              </div>
              {buyModal.type.underwritingRequired && (
                <span style={{ fontSize: 11, background: "#fff3cd", color: "#856404", padding: "3px 10px", borderRadius: 20, border: "1px solid #ffc107" }}>
                  Underwriting req.
                </span>
              )}
            </div>

            {/* Fixed coverage & premium display */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "var(--quiet)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Sum Insured (Fixed)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{fmt(buyModal.tier.coverage)}</div>
                <div style={{ fontSize: 11, color: "var(--quiet)", marginTop: 2 }}>Maximum claimable amount</div>
              </div>
              <div style={{ background: meta.color + "10", border: `1px solid ${meta.color}30`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "var(--quiet)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Annual Premium (Fixed)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{fmt(fixedPremium)}</div>
                <div style={{ fontSize: 11, color: "var(--quiet)", marginTop: 2 }}>
                  ≈ {fmt(Math.round(fixedPremium / 12))}/month · incl. 18% GST
                </div>
              </div>
            </div>

            <div className="ip-form">
              {/* Policy period */}
              <div className="ip-form-row">
                <div className="ip-field">
                  <label>Policy Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="ip-field">
                  <label>Policy End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              {/* Nominee */}
              <div className="ip-form-row">
                <div className="ip-field">
                  <label>Nominee Name <span style={{ fontWeight: 400, color: "var(--quiet)", fontSize: 11 }}>(optional)</span></label>
                  <input value={form.nomineeName} onChange={e => setForm(f => ({ ...f, nomineeName: e.target.value }))} placeholder="Full name of nominee" />
                </div>
                <div className="ip-field">
                  <label>Nominee Relation</label>
                  <select value={form.nomineeRelation} onChange={e => setForm(f => ({ ...f, nomineeRelation: e.target.value }))}>
                    <option value="">Select relation…</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                    <option value="PARENT">Parent</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {buyModal.type.underwritingRequired && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fbbf24", fontSize: 12, color: "#92400e", marginTop: 4 }}>
                  🔬 This policy requires underwriter approval. A request will be automatically sent to the underwriting queue.
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: "var(--quiet)", padding: "10px 14px", background: "var(--surface)", borderRadius: 8, marginTop: 12, lineHeight: 1.6 }}>
              ℹ️ Premium is fixed for the plan tier selected. Final policy is subject to underwriting review.
              {buyModal.type.underwritingRequired && " This plan requires underwriter approval before activation."}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}