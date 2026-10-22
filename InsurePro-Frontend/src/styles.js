// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES — Sunrise palette (warm light theme)
// Injected via <style dangerouslySetInnerHTML={{ __html: STYLES }} /> in App.jsx
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── Sunrise colour palette ── */
    --sun-yellow:   #FFD440;
    --sun-gold:     #FFAA00;
    --sun-orange:   #FF7A00;
    --sun-coral:    #FF4F3B;
    --sun-rose:     #FF6B81;
    --horizon:      #FF9A3C;
    --sky-blue:     #87CEEB;
    --sky-light:    #E0F4FF;
    --sky-dawn:     #FFF4E6;

    /* ── Ink (text) scale ── */
    --ink:          #2A1A0A;
    --ink-light:    #5C3D1E;
    --ink-muted:    #9A6B3A;

    /* ── Surface/layout scale ── */
    --void:         #FFF4E6;
    --depth:        #FFFFFF;
    --surface:      #FFFFFF;
    --panel:        rgba(255,255,255,0.92);
    --raise:        #FFF6EC;
    --rim:          rgba(255,170,0,0.22);
    --rim-solid:    #FFE0B0;
    --muted:        rgba(255,170,0,0.35);
    --quiet:        #9A6B3A;
    --ghost:        #B08050;
    --soft:         #7A5030;
    --text:         #5C3D1E;
    --bright:       #2A1A0A;

    /* ── Primary accent aliases ── */
    --amber:           var(--sun-gold);
    --amber-glow:      var(--sun-yellow);
    --amber-dim:       var(--sun-orange);
    --amber-deep:      #7A3A00;
    --amber-trace:     rgba(255,170,0,0.1);
    --amber-glow-sm:   0 4px 20px rgba(255,120,0,0.3);
    --amber-glow-md:   0 8px 40px rgba(255,120,0,0.35);

    /* ── Semantic colours ── */
    --emerald:      #1A7A36;
    --crimson:      #C02010;
    --sapphire:     #1A6E9A;
    --violet:       #6B3FA0;

    /* ── Radii, fonts, shadows ── */
    --r:             12px;
    --r-sm:          8px;
    --r-lg:          20px;
    --r-pill:        100px;
    --font-head:     'Cormorant Garamond', 'Times New Roman', serif;
    --font-body:     'Inter', system-ui, -apple-system, sans-serif;
    --font-mono:     'IBM Plex Mono', 'Courier New', monospace;
    --shadow-panel:  0 8px 40px rgba(255,120,0,0.18);
    --shadow-card:   0 4px 24px rgba(255,120,0,0.12);
    --trans:         0.2s cubic-bezier(0.4,0,0.2,1);
  }

  html, body, #root {
    height: 100%; width: 100%;
    background: var(--sky-dawn); color: var(--ink);
    font-family: var(--font-body); font-size: 14px;
    line-height: 1.6; letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'cv02','cv03','cv04','cv11';
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--sky-dawn); }
  ::-webkit-scrollbar-thumb { background: var(--rim-solid); border-radius: 99px; }

  .ip-app { display: flex; height: 100vh; overflow: hidden; }

  /* ── SIDEBAR ────────────────────────────────────────────── */
  .ip-sidebar {
    width: 240px; min-width: 240px;
    background: var(--depth);
    border-right: 1px solid var(--rim);
    display: flex; flex-direction: column;
    z-index: 100; overflow-y: auto;
    box-shadow: 2px 0 16px rgba(255,120,0,0.06);
  }
  .ip-logo {
    padding: 24px 20px 20px; display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--rim);
  }
  .ip-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, var(--sun-yellow), var(--sun-orange));
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; box-shadow: var(--amber-glow-sm); flex-shrink: 0;
  }
  .ip-logo-text { font-family: var(--font-head); font-size: 19px; font-weight: 600; color: var(--ink); font-style: italic; letter-spacing: 0.01em; }
  .ip-logo-text span { color: var(--sun-orange); }

  .ip-nav { padding: 12px 0; flex: 1; }
  .ip-nav-section {
    padding: 10px 16px 4px; font-size: 10px; font-weight: 700;
    letter-spacing: 1.2px; text-transform: uppercase; color: var(--ink-muted);
  }
  .ip-nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 16px;
    font-size: 12.5px; font-weight: 500; color: var(--ink-light); letter-spacing: -0.01em;
    cursor: pointer; transition: all var(--trans);
    border-left: 3px solid transparent; margin: 1px 0;
  }
  .ip-nav-item:hover  { color: var(--sun-orange); background: rgba(255,170,0,0.08); }
  .ip-nav-item.active { color: var(--sun-orange); background: rgba(255,170,0,0.1); border-left-color: var(--sun-orange); font-weight: 600; }
  .ip-nav-item .nav-icon { width: 18px; text-align: center; font-size: 15px; flex-shrink: 0; }
  .ip-nav-badge {
    margin-left: auto; background: var(--sun-coral); color: white;
    font-size: 10px; font-weight: 700; padding: 1px 6px;
    border-radius: 99px; min-width: 18px; text-align: center;
  }

  .ip-user-card { padding: 14px 16px; border-top: 1px solid var(--rim); display: flex; align-items: center; gap: 10px; }
  .ip-user-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--sun-gold), var(--sun-orange));
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .ip-user-info { flex: 1; min-width: 0; }
  .ip-user-name  { font-size: 12px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ip-user-role  { font-size: 10px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .ip-logout-btn { color: var(--ink-muted); cursor: pointer; font-size: 16px; flex-shrink: 0; transition: color var(--trans); }
  .ip-logout-btn:hover { color: var(--sun-coral); }

  /* ── MAIN LAYOUT ─────────────────────────────────────────── */
  .ip-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--sky-dawn); }
  .ip-topbar {
    height: 56px; background: var(--depth); border-bottom: 1px solid var(--rim);
    display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(255,120,0,0.06);
  }
  .ip-topbar-title  { font-family: var(--font-head); font-size: 18px; font-weight: 600; color: var(--ink); flex: 1; font-style: italic; letter-spacing: 0.01em; }
  .ip-topbar-actions { display: flex; align-items: center; gap: 10px; }
  .ip-notif-btn { position: relative; cursor: pointer; color: var(--ink-muted); font-size: 18px; transition: color var(--trans); }
  .ip-notif-btn:hover { color: var(--sun-orange); }
  .ip-notif-dot { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: var(--sun-coral); border-radius: 50%; border: 1.5px solid var(--depth); }
  .ip-content { flex: 1; overflow-y: auto; padding: 24px; }

  /* ── CARDS ───────────────────────────────────────────────── */
  .ip-card {
    background: var(--panel); border: 1px solid var(--rim);
    border-radius: var(--r-lg); padding: 20px;
    box-shadow: var(--shadow-card);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .ip-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,120,0,0.18); }
  .ip-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .ip-card-title  { font-family: var(--font-head); font-size: 17px; font-weight: 600; color: var(--ink); font-style: italic; letter-spacing: 0.01em; }
  .ip-card-sub    { font-size: 12px; color: var(--ink-muted); margin-top: 2px; }

  /* ── STAT CARDS ──────────────────────────────────────────── */
  .ip-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .ip-stat-card {
    background: var(--panel); border: 1px solid var(--rim); border-radius: var(--r-lg);
    padding: 18px 20px; position: relative; overflow: hidden; cursor: default;
    transition: border-color var(--trans), transform var(--trans);
    backdrop-filter: blur(8px);
  }
  .ip-stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(255,120,0,0.18); }
  .ip-stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: var(--r-lg) var(--r-lg) 0 0; }
  .ip-stat-card.amber::before   { background: linear-gradient(90deg, var(--sun-gold),   transparent); }
  .ip-stat-card.azure::before   { background: linear-gradient(90deg, var(--sky-blue),   transparent); }
  .ip-stat-card.emerald::before { background: linear-gradient(90deg, #4CD964,            transparent); }
  .ip-stat-card.sapphire::before{ background: linear-gradient(90deg, var(--sapphire),   transparent); }
  .ip-stat-card.crimson::before { background: linear-gradient(90deg, var(--sun-coral),  transparent); }
  .ip-stat-card.violet::before  { background: linear-gradient(90deg, var(--violet),     transparent); }
  .ip-stat-icon  { font-size: 24px; margin-bottom: 10px; }
  .ip-stat-value { font-family: var(--font-head); font-size: 30px; font-weight: 600; color: var(--ink); line-height: 1; margin-bottom: 4px; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  .ip-stat-label { font-size: 11px; color: var(--ink-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ── TABLE ───────────────────────────────────────────────── */
  .ip-table-wrap { overflow-x: auto; }
  .ip-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ip-table thead tr { border-bottom: 2px solid var(--rim-solid); }
  .ip-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--ink-muted); white-space: nowrap; }
  .ip-table td { padding: 12px 14px; border-bottom: 1px solid rgba(255,170,0,0.1); color: var(--ink-light); vertical-align: middle; }
  .ip-table tbody tr { transition: background var(--trans); cursor: pointer; }
  .ip-table tbody tr:hover { background: rgba(255,170,0,0.06); }
  .ip-table tbody tr:last-child td { border-bottom: none; }

  /* ── BADGES ──────────────────────────────────────────────── */
  .ip-badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; }
  .ip-badge.active, .ip-badge.verified, .ip-badge.success, .ip-badge.paid,
  .ip-badge.settled, .ip-badge.approved  { background: rgba(76,217,100,0.15); color: #1A7A36;          border: 1px solid rgba(76,217,100,0.35); }
  .ip-badge.pending, .ip-badge.draft, .ip-badge.processing,
  .ip-badge.submitted, .ip-badge.under_review { background: rgba(255,170,0,0.18); color: #8A5A00;     border: 1px solid rgba(255,170,0,0.4); }
  .ip-badge.rejected, .ip-badge.cancelled,
  .ip-badge.failed, .ip-badge.lapsed     { background: rgba(255,79,59,0.12);  color: #B02010;          border: 1px solid rgba(255,79,59,0.3); }
  .ip-badge.expired, .ip-badge.closed    { background: rgba(154,107,58,0.12); color: var(--ink-muted); border: 1px solid rgba(154,107,58,0.25); }
  .ip-badge.renewed, .ip-badge.partially_approved { background: rgba(135,206,235,0.2); color: #1A6E9A; border: 1px solid rgba(135,206,235,0.5); }
  .ip-badge.pending_underwriting, .ip-badge.in_progress { background: rgba(142,68,173,0.12); color: #6B3FA0; border: 1px solid rgba(142,68,173,0.3); }
  .ip-badge.locked, .ip-badge.inactive { background: rgba(127,140,141,0.15); color: #5D6D7E; border: 1px solid rgba(127,140,141,0.35); }
  .ip-badge.read { background: rgba(127,140,141,0.1); color: #7f8c8d; border: 1px solid rgba(127,140,141,0.25); }
  .ip-badge.unread { background: rgba(255,170,0,0.18); color: #8A5A00; border: 1px solid rgba(255,170,0,0.4); }

  /* ── BUTTONS ─────────────────────────────────────────────── */
  .ip-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 20px; border-radius: var(--r-pill);
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all var(--trans);
    border: none; font-family: var(--font-body); white-space: nowrap;
  }
  .ip-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ip-btn.primary {
    background: linear-gradient(135deg, var(--sun-gold), var(--sun-orange));
    color: white; box-shadow: 0 4px 20px rgba(255,120,0,0.35);
  }
  .ip-btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,120,0,0.5); }
  .ip-btn.secondary { background: var(--raise); color: var(--ink-light); border: 1px solid var(--rim-solid); }
  .ip-btn.secondary:hover:not(:disabled) { background: rgba(255,170,0,0.1); border-color: var(--sun-gold); color: var(--sun-orange); }
  .ip-btn.ghost { background: transparent; color: var(--ink-muted); border: 1px solid var(--rim-solid); }
  .ip-btn.ghost:hover:not(:disabled) { color: var(--sun-orange); border-color: var(--sun-orange); background: rgba(255,170,0,0.06); }
  .ip-btn.danger { background: transparent; color: var(--sun-coral); border: 1px solid rgba(255,79,59,0.4); }
  .ip-btn.danger:hover:not(:disabled) { background: rgba(255,79,59,0.08); }
  .ip-btn.sm { padding: 5px 14px; font-size: 11px; }
  .ip-btn.lg { padding: 13px 32px; font-size: 15px; }
  .ip-btn-group { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ── FORMS ───────────────────────────────────────────────── */
  .ip-form { display: flex; flex-direction: column; gap: 16px; }
  .ip-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ip-form-row.three { grid-template-columns: 1fr 1fr 1fr; }
  .ip-field { display: flex; flex-direction: column; gap: 6px; }
  .ip-field label { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--ink-muted); }
  .ip-field input, .ip-field select, .ip-field textarea {
    background: white; border: 1px solid var(--rim-solid);
    border-radius: var(--r-sm); color: var(--ink);
    padding: 9px 12px; font-size: 13px; font-family: var(--font-body);
    transition: border-color var(--trans), box-shadow var(--trans); outline: none; width: 100%;
  }
  .ip-field input::placeholder, .ip-field textarea::placeholder { color: #C8A87A; }
  .ip-field input:focus, .ip-field select:focus, .ip-field textarea:focus {
    border-color: var(--sun-orange); box-shadow: 0 0 0 3px rgba(255,122,0,0.12);
  }
  .ip-field textarea { resize: vertical; min-height: 80px; }
  .ip-field select option { background: white; color: var(--ink); }

  /* ── PASSWORD FIELD ──────────────────────────────────────── */
  .ip-password-wrap { position: relative; display: flex; align-items: center; }
  .ip-password-wrap input { padding-right: 42px; }
  .ip-eye-btn {
    position: absolute; right: 10px; background: none; border: none; cursor: pointer;
    color: var(--ink-muted); padding: 4px; display: flex; align-items: center;
    transition: color var(--trans); border-radius: 4px;
  }
  .ip-eye-btn:hover { color: var(--sun-orange); }
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear { display: none; }
  input[type="password"]::-webkit-credentials-auto-fill-button { visibility: hidden; }

  /* ── PASSWORD STRENGTH ───────────────────────────────────── */
  .ip-pwd-strength { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .ip-pwd-bars { display: flex; gap: 3px; flex: 1; }
  .ip-pwd-bar { flex: 1; height: 3px; border-radius: 99px; background: var(--rim-solid); transition: background 0.3s ease; }
  .ip-pwd-strength span { font-size: 10px; font-weight: 700; letter-spacing: 0.3px; white-space: nowrap; }

  /* ── FIELD HINTS ─────────────────────────────────────────── */
  .ip-field-hint { font-size: 11px; font-weight: 600; margin-top: 2px; }
  .ip-field-hint.error   { color: var(--crimson); }
  .ip-field-hint.success { color: var(--emerald); }

  /* ── MODAL ───────────────────────────────────────────────── */
  .ip-modal-overlay {
    position: fixed; inset: 0; background: rgba(42,26,10,0.45); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 24px;
    backdrop-filter: blur(6px); animation: fadeIn 0.15s ease;
  }
  .ip-modal {
    background: white; border: 1px solid var(--rim); border-radius: var(--r-lg);
    padding: 28px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
    box-shadow: var(--shadow-panel); animation: slideUp 0.2s ease;
  }
  .ip-modal.wide { max-width: 720px; }
  .ip-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .ip-modal-title  { font-family: var(--font-head); font-size: 20px; font-weight: 600; color: var(--ink); font-style: italic; letter-spacing: 0.01em; }
  .ip-modal-close  { color: var(--ink-muted); cursor: pointer; font-size: 20px; transition: color var(--trans); line-height: 1; }
  .ip-modal-close:hover { color: var(--sun-coral); }
  .ip-modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--rim); }

  /* ── PAGINATION ──────────────────────────────────────────── */
  .ip-pagination { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--rim); margin-top: 4px; }
  .ip-pagination-info { font-size: 12px; color: var(--ink-muted); }
  .ip-pagination-controls { display: flex; gap: 6px; align-items: center; }
  .ip-page-btn {
    width: 28px; height: 28px; border-radius: var(--r-sm);
    border: 1px solid var(--rim-solid); background: white;
    color: var(--ink-muted); cursor: pointer; font-size: 12px;
    display: flex; align-items: center; justify-content: center; transition: all var(--trans);
  }
  .ip-page-btn:hover  { border-color: var(--sun-orange); color: var(--sun-orange); }
  .ip-page-btn.active { background: linear-gradient(135deg, var(--sun-gold), var(--sun-orange)); color: white; border-color: transparent; font-weight: 700; }
  .ip-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── ALERTS ──────────────────────────────────────────────── */
  .ip-alert { padding: 12px 16px; border-radius: var(--r-sm); font-size: 13px; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
  .ip-alert.error   { background: rgba(255,79,59,0.08);  border: 1px solid rgba(255,79,59,0.3);   color: #B02010; }
  .ip-alert.success { background: rgba(76,217,100,0.1);  border: 1px solid rgba(76,217,100,0.3);  color: #1A7A36; }
  .ip-alert.info    { background: rgba(255,170,0,0.1);   border: 1px solid rgba(255,170,0,0.3);   color: #8A5A00; }

  /* ── LOADERS ─────────────────────────────────────────────── */
  .ip-spin { width: 18px; height: 18px; border: 2px solid var(--rim-solid); border-top-color: var(--sun-orange); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0; }
  .ip-spin.lg { width: 36px; height: 36px; border-width: 3px; }
  .ip-loading { display: flex; align-items: center; justify-content: center; padding: 60px; }
  .ip-empty   { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: var(--ink-muted); gap: 12px; }
  .ip-empty-icon { font-size: 40px; opacity: 0.5; }
  .ip-empty-text { font-size: 14px; }

  /* ── LOGIN PAGE ──────────────────────────────────────────── */
  .ip-login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px; position: relative; overflow: hidden;
    background: linear-gradient(180deg, #FFF4E6 0%, #FFE8C8 30%, #FFD4A0 60%, #E8F6FF 85%, #C8EEFF 100%);
  }
  /* Radial light overlays */
  .ip-login-bg {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,212,64,0.55) 0%, transparent 65%),
      radial-gradient(ellipse 55% 40% at 100% 12%, rgba(255,122,0,0.35) 0%, transparent 55%),
      radial-gradient(ellipse 45% 30% at 0% 22%, rgba(255,107,129,0.25) 0%, transparent 50%);
  }
  /* Rotating sun rays (background decoration) */
  .ip-login-bg::after {
    content: '';
    position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
    width: 700px; height: 700px;
    background: conic-gradient(
      from 0deg,
      transparent 0deg, rgba(255,212,64,0.09) 2deg, transparent 4deg,
      transparent 18deg, rgba(255,170,0,0.07) 20deg, transparent 22deg,
      transparent 38deg, rgba(255,122,0,0.06) 40deg, transparent 42deg,
      transparent 58deg, rgba(255,212,64,0.09) 60deg, transparent 62deg,
      transparent 78deg, rgba(255,170,0,0.07) 80deg, transparent 82deg,
      transparent 98deg, rgba(255,212,64,0.09) 100deg, transparent 102deg,
      transparent 118deg, rgba(255,122,0,0.06) 120deg, transparent 122deg,
      transparent 138deg, rgba(255,212,64,0.09) 140deg, transparent 142deg,
      transparent 158deg, rgba(255,170,0,0.07) 160deg, transparent 162deg,
      transparent 178deg, rgba(255,122,0,0.06) 180deg, transparent 182deg,
      transparent 198deg, rgba(255,212,64,0.09) 200deg, transparent 202deg,
      transparent 218deg, rgba(255,170,0,0.07) 220deg, transparent 222deg,
      transparent 238deg, rgba(255,122,0,0.06) 240deg, transparent 242deg,
      transparent 258deg, rgba(255,212,64,0.09) 260deg, transparent 262deg,
      transparent 278deg, rgba(255,170,0,0.07) 280deg, transparent 282deg,
      transparent 298deg, rgba(255,122,0,0.06) 300deg, transparent 302deg,
      transparent 318deg, rgba(255,212,64,0.09) 320deg, transparent 322deg,
      transparent 338deg, rgba(255,170,0,0.07) 340deg, transparent 342deg,
      transparent 358deg, rgba(255,122,0,0.06) 360deg
    );
    border-radius: 50%; animation: rotateSun 60s linear infinite;
    pointer-events: none;
  }

  /* ── SPLIT PANEL ─────────────────────────────────────────── */
  .ip-login-panel {
    display: flex; width: 100%; max-width: 920px;
    background: white; border-radius: 24px;
    box-shadow: 0 20px 80px rgba(255,120,0,0.2);
    border: 1px solid rgba(255,170,0,0.2);
    overflow: hidden; position: relative; z-index: 1;
    animation: slideUp 0.4s cubic-bezier(0.4,0,0.2,1);
    min-height: 580px;
  }

  /* Brand / left panel */
  .ip-login-brand {
    width: 380px; min-width: 380px;
    background: linear-gradient(145deg, var(--sun-orange) 0%, var(--horizon) 40%, var(--sun-gold) 75%, var(--sun-yellow) 100%);
    padding: 52px 40px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
    color: white;
  }
  /* Dot-pattern texture on brand panel */
  .ip-login-brand::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px);
    background-size: 22px 22px;
  }
  /* Large decorative sun */
  .ip-login-brand::after {
    content: '☀';
    position: absolute; right: -28px; top: -48px;
    font-size: 14rem; opacity: 0.1; line-height: 1;
    animation: rotateSun 40s linear infinite;
    pointer-events: none;
  }
  .ip-brand-top  { position: relative; z-index: 1; }
  .ip-brand-bottom { position: relative; z-index: 1; }

  .ip-brand-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .ip-brand-logo-icon {
    width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
    background: rgba(255,255,255,0.25); display: flex; align-items: center;
    justify-content: center; font-size: 24px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    backdrop-filter: blur(8px);
  }
  .ip-brand-logo-text {
    font-family: var(--font-head); font-style: italic;
    font-size: 26px; font-weight: 600; color: white;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }
  .ip-brand-headline {
    font-family: var(--font-head); font-style: italic;
    font-size: 34px; font-weight: 600;
    color: white; line-height: 1.2; margin-bottom: 20px;
    letter-spacing: 0.01em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .ip-brand-sub {
    font-size: 14px; color: rgba(255,255,255,0.85);
    line-height: 1.65; margin-bottom: 32px;
  }
  .ip-brand-features { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .ip-brand-features li {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.92);
  }
  .ip-brand-features li::before {
    content: '✦'; color: rgba(255,255,255,0.7); font-size: 9px; flex-shrink: 0;
  }
  .ip-brand-tagline {
    font-size: 11px; color: rgba(255,255,255,0.7);
    font-weight: 500; letter-spacing: 0.3px;
    padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);
  }

  /* Form / right panel */
  .ip-login-form-panel {
    flex: 1; padding: 52px 48px;
    display: flex; flex-direction: column; justify-content: center;
    overflow-y: auto; background: white;
  }
  .ip-login-form-header { margin-bottom: 28px; }
  .ip-login-form-title {
    font-family: var(--font-head); font-style: italic;
    font-size: 28px; font-weight: 600; color: var(--ink); margin-bottom: 6px;
    letter-spacing: 0.01em;
  }
  .ip-login-form-sub { font-size: 13px; color: var(--ink-muted); line-height: 1.5; }

  .ip-login-tabs {
    display: flex; gap: 0; margin-bottom: 28px;
    background: var(--raise); border-radius: var(--r-pill);
    padding: 4px; border: 1px solid var(--rim);
  }
  .ip-login-tab {
    flex: 1; text-align: center; padding: 8px 16px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    border-radius: var(--r-pill); transition: all var(--trans); color: var(--ink-muted);
  }
  .ip-login-tab.active {
    background: linear-gradient(135deg, var(--sun-gold), var(--sun-orange));
    color: white; box-shadow: 0 3px 12px rgba(255,120,0,0.35);
  }

  .ip-login-footer-note {
    margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--rim);
    font-size: 11px; color: var(--ink-muted); text-align: center; line-height: 1.6;
  }

  /* ── DETAIL GRID ─────────────────────────────────────────── */
  .ip-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ip-detail-item { padding: 10px 0; border-bottom: 1px solid rgba(255,170,0,0.12); }
  .ip-detail-item:nth-last-child(-n+2) { border-bottom: none; }
  .ip-detail-key { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 3px; }
  .ip-detail-val { font-size: 13px; color: var(--ink-light); }

  /* ── TIMELINE ────────────────────────────────────────────── */
  .ip-timeline { display: flex; flex-direction: column; }
  .ip-tl-item { display: flex; gap: 16px; padding: 12px 0; position: relative; }
  .ip-tl-item:not(:last-child)::after { content: ''; position: absolute; left: 7px; top: 30px; bottom: -10px; width: 1px; background: var(--rim-solid); }
  .ip-tl-dot { width: 16px; height: 16px; border-radius: 50%; background: white; border: 2px solid var(--rim-solid); flex-shrink: 0; margin-top: 3px; }
  .ip-tl-dot.amber   { border-color: var(--sun-gold);   background: rgba(255,170,0,0.1); }
  .ip-tl-dot.azure   { border-color: var(--sky-blue);   background: rgba(135,206,235,0.15); }
  .ip-tl-dot.emerald { border-color: #4CD964;            background: rgba(76,217,100,0.1); }
  .ip-tl-dot.crimson { border-color: var(--sun-coral);  background: rgba(255,79,59,0.1); }
  .ip-tl-content { flex: 1; }
  .ip-tl-title { font-size: 13px; font-weight: 600; color: var(--ink-light); }
  .ip-tl-meta  { font-size: 11px; color: var(--ink-muted); margin-top: 2px; }

  /* ── SEARCH BAR ──────────────────────────────────────────── */
  .ip-search-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: flex-end; }

  /* ── SECTION HEADER ──────────────────────────────────────── */
  .ip-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .ip-section-title  { font-family: var(--font-head); font-size: 24px; font-weight: 600; color: var(--ink); font-style: italic; letter-spacing: 0.01em; }
  .ip-section-sub    { font-size: 12px; color: var(--ink-muted); margin-top: 3px; }

  /* ── GRID LAYOUTS ────────────────────────────────────────── */
  .ip-two-col   { display: grid; grid-template-columns: 1fr 1fr;     gap: 20px; }
  .ip-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  @media (max-width: 900px) {
    .ip-two-col, .ip-three-col, .ip-form-row, .ip-form-row.three { grid-template-columns: 1fr !important; }
    .ip-login-brand { display: none; }
    .ip-login-form-panel { padding: 40px 28px; }
  }

  /* ── TABS ────────────────────────────────────────────────── */
  .ip-tabs { display: flex; border-bottom: 2px solid var(--rim-solid); margin-bottom: 20px; }
  .ip-tab { padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--ink-muted); border-bottom: 2px solid transparent; transition: all var(--trans); margin-bottom: -2px; }
  .ip-tab:hover { color: var(--sun-orange); }
  .ip-tab.active { color: var(--sun-orange); border-bottom-color: var(--sun-orange); }

  /* ── MISC ────────────────────────────────────────────────── */
  .ip-divider { border: none; border-top: 1px solid var(--rim); margin: 16px 0; }
  .ip-mono    { font-family: var(--font-mono); font-size: 12px; color: var(--sun-orange); font-weight: 500; letter-spacing: 0.02em; }
  .ip-chips   { display: flex; gap: 6px; flex-wrap: wrap; }
  .ip-chip    { padding: 3px 10px; background: var(--raise); border: 1px solid var(--rim-solid); border-radius: 99px; font-size: 11px; color: var(--ink-muted); }

  /* ── KEYFRAMES ───────────────────────────────────────────── */
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rotateSun { to { transform: translateX(-50%) rotate(360deg); } }
  @keyframes floatUp   { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
`;

export default STYLES;
