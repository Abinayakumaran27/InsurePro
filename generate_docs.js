'use strict';
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'InsurePro_Complete_Documentation.pdf');
const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 }, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  navy:    '#0f2d4a',
  blue:    '#1a5276',
  amber:   '#d4880a',
  amberLt: '#fef3dc',
  gray:    '#f4f6f8',
  grayDk:  '#6c757d',
  white:   '#ffffff',
  black:   '#1a1a1a',
  green:   '#1a7a36',
  red:     '#c0392b',
  border:  '#dce3ea',
  codeBg:  '#f0f3f7',
  codeStr: '#2e4057',
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const W  = doc.page.width  - 120;   // usable width
const ML = 60;                       // left margin
let pageNum = 0;

function newPage() {
  doc.addPage();
  pageNum++;
}

function coverPage() {
  // Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.navy);
  // Amber accent bar
  doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(C.amber);
  // Top accent
  doc.rect(0, 0, doc.page.width, 6).fill(C.amber);

  // Shield icon area
  doc.roundedRect(doc.page.width/2 - 55, 110, 110, 110, 16).fill(C.amber);
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(52)
     .text('IP', doc.page.width/2 - 26, 148);

  // Title
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(38)
     .text('InsurePro', ML, 255, { width: W, align: 'center' });
  doc.fillColor(C.amber).font('Helvetica').fontSize(18)
     .text('Complete Codebase Documentation', ML, 302, { width: W, align: 'center' });

  // Divider
  doc.rect(ML + 60, 338, W - 120, 2).fill(C.amber);

  // Subtitle
  doc.fillColor('#a8c6e0').font('Helvetica').fontSize(13)
     .text('Full-Stack Enterprise Insurance Management Platform', ML, 352, { width: W, align: 'center' })
     .text('Spring Boot 3.2 Microservices  ·  React 19  ·  MySQL', ML, 374, { width: W, align: 'center' })
     .text('13 Services  ·  10 Databases  ·  22 Features', ML, 396, { width: W, align: 'center' });

  // Sections list
  const sections = [
    'Project Identity & Architecture',
    'All 22 Features — End-to-End',
    'Database / Entity Models',
    'Frontend ↔ Backend Wiring',
    'Security Architecture',
    'Beginner Glossary (60+ Terms)',
  ];
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(12)
     .text('CONTENTS', ML, 460, { width: W, align: 'center' });
  doc.rect(ML + 100, 476, W - 200, 1).fill('#3a6b8a');
  sections.forEach((s, i) => {
    doc.fillColor('#c8dff0').font('Helvetica').fontSize(11)
       .text(`${i + 1}.  ${s}`, ML, 486 + i * 20, { width: W, align: 'center' });
  });

  // Footer
  doc.fillColor('#4a7fa5').font('Helvetica').fontSize(10)
     .text('Generated from source code analysis — May 2026', ML, doc.page.height - 80, { width: W, align: 'center' });
  pageNum = 1;
}

function tocEntry(title, pg, indent) {
  const y = doc.y;
  const x = ML + (indent ? 20 : 0);
  const tw = W - (indent ? 20 : 0) - 40;
  doc.fillColor(indent ? C.grayDk : C.navy)
     .font(indent ? 'Helvetica' : 'Helvetica-Bold')
     .fontSize(indent ? 10 : 11)
     .text(title, x, y, { width: tw, continued: false });
  doc.fillColor(C.grayDk).font('Helvetica').fontSize(10)
     .text(String(pg), ML, y, { width: W, align: 'right' });
  doc.moveDown(0.3);
}

function chapterPage(num, title, subtitle) {
  newPage();
  doc.rect(0, 0, doc.page.width, 180).fill(C.navy);
  doc.rect(0, 180, doc.page.width, 4).fill(C.amber);
  doc.fillColor(C.amber).font('Helvetica-Bold').fontSize(13)
     .text(`SECTION ${num}`, ML, 70);
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(28)
     .text(title, ML, 95, { width: W });
  if (subtitle) {
    doc.fillColor('#a8c6e0').font('Helvetica').fontSize(13)
       .text(subtitle, ML, 145, { width: W });
  }
  doc.y = 210;
}

function h1(txt) {
  if (doc.y > doc.page.height - 140) newPage();
  doc.moveDown(0.8);
  doc.rect(ML, doc.y, W, 30).fill(C.navy);
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(13)
     .text(txt, ML + 12, doc.y - 22, { width: W - 24 });
  doc.moveDown(1.0);
}

function h2(txt) {
  if (doc.y > doc.page.height - 120) newPage();
  doc.moveDown(0.6);
  doc.fillColor(C.blue).font('Helvetica-Bold').fontSize(12).text(txt);
  doc.rect(ML, doc.y, W, 1.5).fill(C.amber);
  doc.moveDown(0.6);
}

function h3(txt) {
  if (doc.y > doc.page.height - 100) newPage();
  doc.moveDown(0.4);
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(11).text(txt);
  doc.moveDown(0.3);
}

function label(txt) {
  doc.fillColor(C.amber).font('Helvetica-Bold').fontSize(10).text(txt, { continued: false });
  doc.moveDown(0.15);
}

function body(txt, opts) {
  doc.fillColor(C.black).font('Helvetica').fontSize(10)
     .text(txt, ML, doc.y, Object.assign({ width: W, align: 'justify' }, opts || {}));
  doc.moveDown(0.4);
}

function bullet(items) {
  items.forEach(item => {
    if (doc.y > doc.page.height - 80) newPage();
    doc.fillColor(C.amber).font('Helvetica-Bold').fontSize(10).text('•', ML, doc.y, { continued: true, width: 14 });
    doc.fillColor(C.black).font('Helvetica').fontSize(10)
       .text(item, ML + 14, doc.y, { width: W - 14 });
    doc.moveDown(0.25);
  });
}

function code(snippet) {
  if (doc.y > doc.page.height - 100) newPage();
  doc.moveDown(0.3);
  const lines = snippet.split('\n');
  const boxH  = lines.length * 13 + 16;
  if (doc.y + boxH > doc.page.height - 60) newPage();
  doc.rect(ML, doc.y, W, boxH).fill(C.codeBg).stroke(C.border);
  doc.fillColor(C.codeStr).font('Courier').fontSize(8.5)
     .text(snippet, ML + 10, doc.y - boxH + 8, { width: W - 20, lineGap: 2 });
  doc.moveDown(0.6);
}

function infoBox(txt, color) {
  if (doc.y > doc.page.height - 80) newPage();
  doc.moveDown(0.3);
  const bg  = color === 'amber' ? C.amberLt : color === 'green' ? '#eafaf1' : '#eaf3fb';
  const brd = color === 'amber' ? C.amber    : color === 'green' ? C.green   : C.blue;
  const lines = txt.split('\n').length;
  const bh    = lines * 13 + 16;
  doc.rect(ML, doc.y, W, bh).fill(bg);
  doc.rect(ML, doc.y, 4, bh).fill(brd);
  doc.fillColor(C.black).font('Helvetica').fontSize(9.5)
     .text(txt, ML + 12, doc.y - bh + 8, { width: W - 20, lineGap: 2 });
  doc.moveDown(0.6);
}

function tableRow(cells, widths, isHeader) {
  if (doc.y > doc.page.height - 60) newPage();
  const rowH = 22;
  const bg   = isHeader ? C.navy : (doc.y % 2 < 1 ? C.gray : C.white);
  let x = ML;
  widths.forEach((w, i) => {
    doc.rect(x, doc.y, w, rowH).fill(bg).stroke(C.border);
    const color  = isHeader ? C.white : C.black;
    const fnt    = isHeader ? 'Helvetica-Bold' : 'Helvetica';
    doc.fillColor(color).font(fnt).fontSize(9)
       .text(cells[i] || '', x + 5, doc.y - rowH + 6, { width: w - 10, height: rowH - 4, ellipsis: true });
    x += w;
  });
  doc.y += rowH;
  doc.moveDown(0);
}

function featureBlock(num, name, what, userExp, frontendPath, apiCall, backendPath, errors, keyConcepts) {
  h1(`Feature ${num}: ${name}`);

  label('a) WHAT IT DOES');
  body(what);

  label('b) HOW THE USER EXPERIENCES IT');
  body(userExp);

  label('c) FRONTEND CODE PATH');
  body(frontendPath);
  if (apiCall) code(apiCall);

  label('d) BACKEND CODE PATH');
  body(backendPath);

  label('e) WHAT CAN GO WRONG');
  bullet(errors);

  label('f) KEY CONCEPTS');
  keyConcepts.forEach(([term, def]) => {
    if (doc.y > doc.page.height - 60) newPage();
    doc.fillColor(C.blue).font('Helvetica-Bold').fontSize(10)
       .text(term + ': ', ML, doc.y, { continued: true, width: W });
    doc.fillColor(C.black).font('Helvetica').fontSize(10)
       .text(def, { width: W });
    doc.moveDown(0.2);
  });
  doc.moveDown(0.5);
}

// ════════════════════════════════════════════════════════════════════════════
// COVER
// ════════════════════════════════════════════════════════════════════════════
coverPage();

// ════════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ════════════════════════════════════════════════════════════════════════════
newPage();
doc.rect(0, 0, doc.page.width, 80).fill(C.navy);
doc.rect(0, 80, doc.page.width, 4).fill(C.amber);
doc.fillColor(C.white).font('Helvetica-Bold').fontSize(22).text('Table of Contents', ML, 26);
doc.y = 110;

const tocData = [
  ['Section 1 — Project Identity & Architecture', 4, false],
  ['What is InsurePro?', 4, true],
  ['Technology Stack', 4, true],
  ['13 Microservices Overview', 5, true],
  ['Section 2 — All 22 Features (End-to-End)', 6, false],
  ['Feature 1: User Registration & Login', 6, true],
  ['Feature 2: Silent Token Refresh', 8, true],
  ['Feature 3: Force Password Change', 9, true],
  ['Feature 4: Role-Based Dashboard', 10, true],
  ['Feature 5: Customer Profile & KYC', 12, true],
  ['Feature 6: Insurance Marketplace', 14, true],
  ['Feature 7: Policy Lifecycle Management', 16, true],
  ['Feature 8: Policy Endorsements', 18, true],
  ['Feature 9: Claims Submission', 19, true],
  ['Feature 10: Claims Adjudication', 21, true],
  ['Feature 11: Claim Notes', 23, true],
  ['Feature 12: Claim Disputes', 24, true],
  ['Feature 13: Claim Settlement', 25, true],
  ['Feature 14: Invoice Generation', 26, true],
  ['Feature 15: Premium Payment', 27, true],
  ['Feature 16: Document Management', 29, true],
  ['Feature 17: Underwriting Risk Assessment', 31, true],
  ['Feature 18: Analytics & KPI Reports', 33, true],
  ['Feature 19: Compliance Audit Logs', 35, true],
  ['Feature 20: Notifications', 36, true],
  ['Feature 21: User Management (Admin)', 37, true],
  ['Feature 22: My Profile & Password Change', 39, true],
  ['Section 3 — Data Models', 40, false],
  ['Entity Tables & Fields', 40, true],
  ['Entity Relationships', 43, true],
  ['Section 4 — Frontend–Backend Wiring', 44, false],
  ['API Base URL & HTTP Client', 44, true],
  ['CORS Configuration', 44, true],
  ['API Gateway Routing', 45, true],
  ['Section 5 — Security Architecture', 46, false],
  ['JWT Authentication Flow', 46, true],
  ['Password Policies', 47, true],
  ['Role-Based Access Control', 47, true],
  ['Section 6 — Beginner Glossary', 48, false],
];

tocData.forEach(([title, pg, indent]) => tocEntry(title, pg, indent));

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PROJECT IDENTITY
// ════════════════════════════════════════════════════════════════════════════
chapterPage('1', 'Project Identity & Architecture', 'What InsurePro is, who uses it, and how it is built');

h2('What is InsurePro?');
body('InsurePro is a full-stack enterprise insurance management platform. It digitises the complete lifecycle of an insurance business: selling policies, collecting premiums, processing claims, managing documents, and producing compliance reports — all in one system.');
body('Think of it as the internal software an insurance company runs. On one side, customers (policyholders) can log in to buy coverage, pay premiums, file claims, and upload KYC documents. On the other side, insurance staff — agents, adjusters, underwriters, compliance officers, and finance — manage those workflows through the same platform.');

h2('Intended Users');
const roles = [
  ['POLICYHOLDER', 'End-customer. Buys insurance, files claims, pays premiums, uploads documents.'],
  ['ADMIN', 'Super-user. Full access to every feature; creates and manages all staff accounts.'],
  ['AGENT', 'Front-office staff. Creates customer profiles, issues policies, assists with claims.'],
  ['ADJUSTER', 'Claims specialist. Reviews, approves or rejects submitted claims.'],
  ['UNDERWRITER', 'Risk assessor. Reviews risk scoring for policies needing manual underwriting.'],
  ['FINANCE', 'Accounts staff. Manages payments, invoices, and refunds.'],
  ['COMPLIANCE', 'Audit officer. Reads audit logs, generates compliance reports, reviews KYC.'],
];
tableRow(['Role', 'Responsibilities'], [140, W - 140], true);
roles.forEach(r => tableRow(r, [140, W - 140], false));
doc.moveDown(1);

h2('Technology Stack');
const stack = [
  ['Frontend', 'React 19.1  +  Vite 6.3  —  Single-Page Application (SPA)'],
  ['Styling', 'Vanilla CSS injected via styles.js  —  "Sunrise" colour palette'],
  ['HTTP Client', 'Native Fetch API  —  custom wrapper in api.js (no Axios)'],
  ['State Mgmt', 'React Context API  (AuthContext)  —  no Redux'],
  ['Backend', 'Spring Boot 3.2.x  —  13 independent Java microservices'],
  ['Auth', 'Spring Security  +  JJWT 0.12.5  (HS256 JWT)'],
  ['Database', 'MySQL 8.0  —  10 separate databases, one per service'],
  ['ORM', 'Spring Data JPA  +  Hibernate'],
  ['Migrations', 'Flyway  —  version-controlled schema changes'],
  ['Service Discovery', 'Netflix Eureka  (port 8761)'],
  ['Config', 'Spring Cloud Config Server  (port 8888)'],
  ['API Gateway', 'Spring Cloud Gateway  (port 9090)'],
  ['Messaging', 'RabbitMQ  —  async audit events & notifications'],
  ['Cache / Blacklist', 'Redis  —  JWT blacklist on logout, response caching'],
  ['Container', 'Docker  +  docker-compose  (13 services + infra)'],
  ['Monitoring', 'Prometheus  +  Grafana  dashboards'],
];
tableRow(['Layer', 'Technology'], [160, W - 160], true);
stack.forEach(r => tableRow(r, [160, W - 160], false));
doc.moveDown(1);

h2('13 Microservices — Ports & Databases');
const services = [
  ['iam-service', '8081', 'insurepro_iam', 'Login, registration, JWT, user management'],
  ['customer-service', '8082', 'insurepro_customer', 'Customer profiles, KYC records'],
  ['policy-service', '8083', 'insurepro_policy', 'Policy lifecycle, types, endorsements'],
  ['claims-service', '8084', 'insurepro_claims', 'Claims, notes, disputes, settlements'],
  ['premium-payment-service', '8085', 'insurepro_payment', 'Invoices, payments, refunds'],
  ['notification-service', '8086', 'insurepro_notification', 'In-app notifications'],
  ['audit-compliance-service', '8087', 'insurepro_audit', 'Immutable audit logs'],
  ['analytics-service', '8088', 'insurepro_analytics', 'KPIs, generated reports'],
  ['underwriting-service', '8089', 'insurepro_underwriting', 'Risk scoring, decisions'],
  ['document-service', '8090', 'insurepro_document', 'File upload, download, metadata'],
  ['api-gateway-service', '9090', '—', 'Routes all requests, validates JWT'],
  ['eureka-server', '8761', '—', 'Service registry & discovery'],
  ['config-server', '8888', '—', 'Centralised YAML configuration'],
];
const sw = [130, 50, 130, W - 310];
tableRow(['Service', 'Port', 'Database', 'Responsibility'], sw, true);
services.forEach(r => tableRow(r, sw, false));
doc.moveDown(1);

infoBox('All traffic from the React frontend goes to port 9090 (API Gateway). The Gateway validates the JWT token, then routes each request to the correct microservice by URL prefix. Microservices talk to each other using Feign clients (service-to-service HTTP calls) through Eureka service discovery — no hardcoded host names.', 'amber');

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — FEATURES
// ════════════════════════════════════════════════════════════════════════════
chapterPage('2', 'All 22 Features — End-to-End', 'For every feature: what it does, user journey, frontend code, backend code, errors, and key concepts');

// ── FEATURE 1 ─────────────────────────────────────────────────────────────
featureBlock(1, 'User Registration & Login',
  'Lets new customers self-register, and all users sign in. On success the server issues two tokens: a short-lived Access Token (30 minutes) and a long-lived Refresh Token (7 days). Both are stored in the browser and used for every subsequent API call.',
  'The login screen is a split-panel page. The LEFT panel is a brand panel listing InsurePro\'s five key capabilities. The RIGHT panel has two tabs — "Sign In" and "Register".\n\nSign In: Enter username + password + optional 6-digit TOTP code. Press Enter or click "Sign In". A spinner appears while the request is in flight.\n\nRegister: Enter full name, username, email, optional phone, password (live 5-level strength meter: Very Weak / Weak / Fair / Strong / Very Strong), and confirm password (border turns green when matching, red when mismatched). Click "Create Account". On success the app auto-switches to the Sign In tab.',
  'Component: LoginPage.jsx. State: tab ("login"/"register"), form object, loading, error, fieldErrs.\n\nSign-In flow (doLogin): validates fields non-empty → calls AuthContext.login(username, password, totpCode) → api.post("/api/v1/auth/login") → on success stores accessToken + refreshToken + full user object in localStorage under keys ip_access, ip_refresh, ip_user → if role is POLICYHOLDER fetches /api/v1/customers/my-profile to resolve customerId → if forcePasswordChange=true redirects to ForceChangePasswordPage → otherwise AppShell renders.\n\nRegister flow (doRegister): client-side validation (email regex, phone format, password >=12 chars, passwords match) → api.post("/api/v1/auth/register", { ...form, role: "ROLE_POLICYHOLDER" }) → on success switch to login tab → on failure maps server fieldErrors[] array to individual input fields.',
  'POST /api/v1/auth/login\nBody: { username, password, totpCode }\nResponse: { accessToken, refreshToken, userId, username, fullName, roles, forcePasswordChange }\n\nPOST /api/v1/auth/register\nBody: { username, password, email, fullName, phone, role: "ROLE_POLICYHOLDER" }\nResponse: { userId, username, ... }',
  'Controller: AuthController in iam-service.\n\nREGISTER: (1) @StrongPassword annotation enforces >=12 chars, upper+lower+digit+special. (2) UserRepository checks username/email uniqueness. (3) BCrypt-hashes the password. (4) Saves User entity with status=ACTIVE, role=ROLE_POLICYHOLDER, forcePasswordChange=false. (5) Publishes USER_REGISTERED audit event via RabbitMQ.\n\nLOGIN: (1) UserRepository.findByUsername(). (2) Checks status — rejects LOCKED or INACTIVE accounts. (3) BCrypt.matches() verifies password. (4) Wrong password increments LoginAttempt counter; >=5 failures within window sets status=LOCKED for 30 minutes. (5) If TOTP enabled, validates 6-digit code against stored secret. (6) JwtService generates HS256 JWT (claims: sub, roles, userId, exp=now+1800s). (7) SHA-256 hash of refresh token saved to refresh_tokens table. (8) Returns tokens + user info.',
  [
    '400 — Weak password, missing fields, duplicate username or email',
    '401 — Wrong credentials',
    '403 — Account INACTIVE (deactivated by admin)',
    '423 — Account LOCKED (too many failed attempts; includes unlock-at timestamp)',
    'Server fieldErrors[] array is mapped to individual form fields (inline red text under each field)',
  ],
  [
    ['JWT (JSON Web Token)', 'A base64-encoded string in 3 parts (header.payload.signature). The payload carries userId, roles, and exp (expiry). The browser stores it; every request adds it as Authorization: Bearer <token>.'],
    ['BCrypt', 'A one-way password hashing algorithm. Passwords are never stored in plain text; only the hash is saved.'],
    ['localStorage', 'Browser key-value storage that survives page refresh. Keys used: ip_access, ip_refresh, ip_user, ip_customer_id, ip_force_pwd_change.'],
    ['AuthContext', 'A React Context that provides user, login, logout, hasRole, customerId to every component in the app without manual prop-passing.'],
    ['@StrongPassword', 'A custom Spring annotation on the RegisterRequest DTO that triggers a custom ConstraintValidator, rejecting passwords that do not meet the complexity rules.'],
  ]
);

// ── FEATURE 2 ─────────────────────────────────────────────────────────────
featureBlock(2, 'Silent Token Refresh',
  'When the 30-minute access token expires, the next API call returns 401 Unauthorized. The app transparently exchanges the refresh token for a new access token and retries the failed request — the user never sees an error or gets redirected to login.',
  'Completely invisible. The user continues working normally even after 30+ minutes of activity.',
  'File: api.js — inside the req() function.\n\nAfter any 401 response: if the failing path does NOT start with /api/v1/auth (prevents infinite loops): (1) Calls tryRefresh() which POSTs to /api/v1/auth/refresh with the stored refreshToken. (2) Stores the new accessToken (and new refreshToken if returned) in localStorage. (3) Retries the original request with the new token. If refresh also fails → propagates the 401 so the app can show an error or force re-login.',
  'POST /api/v1/auth/refresh\nBody: { refreshToken: "<plain UUID>" }\nResponse: { accessToken, refreshToken }',
  'Controller: AuthController.refreshToken() in iam-service.\n(1) SHA-256 hashes the incoming plain token to find the stored record. (2) Validates token is not expired. (3) Deletes the old refresh token (rotation). (4) Generates new access + refresh tokens. (5) Saves new refresh token hash. Returns both tokens.',
  [
    '401 — Refresh token expired (7 days old)',
    '401 — Refresh token already rotated (replay attempt rejected)',
    '401 — Token not found in database (logged out on another device)',
  ],
  [
    ['Token rotation', 'Each time the refresh token is used, it is deleted and a brand-new one is issued. This means a stolen refresh token can only be used once before it becomes invalid.'],
    ['SHA-256 hashing of refresh tokens', 'The UUID sent to the browser is hashed before being stored in the database. A DB breach does not expose usable tokens.'],
  ]
);

// ── FEATURE 3 ─────────────────────────────────────────────────────────────
featureBlock(3, 'Force Password Change',
  'When an admin creates a staff account and sets a temporary password, the backend marks forcePasswordChange=true. On first login the app intercepts the normal flow and shows a mandatory password-change screen before the user can access anything else.',
  'After entering their temporary password, instead of the dashboard the user sees a centered card with three fields: Temporary Password, New Password, Confirm New Password. There is also a "Log Out" escape button. The user cannot navigate away until they set a compliant new password.',
  'Component: ForceChangePasswordPage in OtherPages.jsx.\n\nApp routing in App.jsx (lines 200-203): if (!user) → LoginPage; if (forcePasswordChange) → ForceChangePasswordPage; else → AppShell.\n\nForceChangePasswordPage: validates new password meets complexity regex (>=12 chars, upper+lower+digit+special), passwords match → PATCH /api/v1/auth/users/{userId}/password?currentPassword=...&newPassword=... → on success calls clearForcePasswordChange() which sets ip_force_pwd_change=false in localStorage and clears React state → AppRouter re-evaluates → AppShell appears.',
  'PATCH /api/v1/auth/users/{userId}/password\nQuery params: currentPassword=<temp>, newPassword=<new>',
  'Controller: AuthController.changePassword().\n(1) BCrypt.matches() verifies currentPassword against stored hash. (2) Checks new password is NOT in the last 5 PasswordHistory records. (3) BCrypt-hashes new password. (4) Updates User.password and sets forcePasswordChange=false. (5) Appends old password hash to password_history table (keeping only last 5 rows per user).',
  [
    '400 — New password does not meet strength requirements',
    '400 — New password matches one of the last 5 used passwords',
    '401 — Wrong current/temporary password',
  ],
  [
    ['Password history', 'The password_history table stores the last 5 BCrypt hashes per user. New passwords are rejected if BCrypt.matches() returns true for any stored hash.'],
    ['clearForcePasswordChange()', 'Clears the flag in both localStorage and React state, causing AppRouter to re-render and show AppShell instead of the change-password screen.'],
  ]
);

// ── FEATURE 4 ─────────────────────────────────────────────────────────────
featureBlock(4, 'Role-Based Dashboard',
  'The dashboard shows entirely different content based on who is logged in. Policyholders see a personal overview with quick-action shortcuts. Admins see system-wide statistics, charts, and a staff directory. Other staff see recent claims and policies.',
  'POLICYHOLDER VIEW: Greeting banner with name, date, KYC status badge, Policyholder ID. Warning banners if no customer profile or KYC not verified. Six quick-action card links: Buy Insurance, My Policies, File a Claim, Payments, Documents, My Profile. Two tables: Recent Policies and Recent Claims (last 5 each).\n\nADMIN VIEW (4 tabs): Overview — KPI stat cards + recent data tables. Analytics Charts — CSS bar charts for Claims by Status, Policy Status Distribution, KYC Verification Status, Staff by Role. Staff Performance — staff directory table with role/status/last-login + Agent Activity table. Search — live keyword search across policyholders, policies, claims, staff.\n\nSTAFF VIEW: Just the two Recent widgets.',
  'Component: Dashboard.jsx. Root component detects role and renders one of three sub-components: PolicyholderDashboard, AdminDashboard, or StaffDashboard.\n\nAdminDashboard fires 4 parallel useApi() calls on mount:\n  GET /api/v1/customers?page=0&size=5&sortBy=createdAt&direction=desc\n  GET /api/v1/claims?page=0&size=200&sortBy=createdAt&direction=desc\n  GET /api/v1/policies?page=0&size=5&sortBy=createdAt&direction=desc\n  GET /api/v1/auth/users?page=0&size=50\n\nCharts are pure CSS: BarChart renders <div> elements whose height is computed as (value/maxValue) * containerHeight px. ProgressRow uses CSS width: pct%.',
  'GET /api/v1/claims?page=0&size=5&sortBy=createdAt&direction=desc&customerId=42\nGET /api/v1/policies?page=0&size=5&sortBy=createdAt&direction=desc&customerId=42',
  'Multiple services are called via the API Gateway. customer-service CustomerController.getCustomers() → CustomerRepository.findAll(pageable). claims-service ClaimController.getClaims() → ClaimRepository.findAll(pageable). policy-service PolicyController.getPolicies() → PolicyRepository.findAll(pageable). iam-service AuthController.listUsers() → UserRepository.findAll(pageable). All return Spring Page<T> objects containing content[], totalElements, totalPages.',
  [
    'If customerId is not yet resolved for a policyholder, the Recent widgets return an empty promise instead of calling the API — preventing a 403 error.',
    '403 — Policyholder attempting to fetch another customer\'s data (backend checks JWT userId against query filter)',
  ],
  [
    ['useApi(fn, deps)', 'Custom React hook in UI.jsx. Runs fn() on mount and whenever deps changes. Returns { data, loading, error, reload }. The app\'s standard pattern for all API data fetching.'],
    ['useMemo', 'React hook that caches the result of an expensive computation (e.g. claimsByStatus grouping) and only recalculates when its listed dependencies change.'],
    ['Page<T>', 'Spring Data\'s paginated response wrapper: { content: [...], totalElements: N, totalPages: N, size: 10, number: 0 }.'],
  ]
);

// ── FEATURE 5 ─────────────────────────────────────────────────────────────
featureBlock(5, 'Customer Profile Management & KYC',
  'Every policyholder has two separate identity records: a login account in iam-service (userId) and an insurance profile in customer-service (customerId). The profile stores personal details (name, DOB, national ID, address) and KYC verification status. Policyholders manage their own profile; agents/admins manage all profiles.',
  'POLICYHOLDER: Sees "Policyholders" page showing their own profile form. 12 fields: Full Name, Date of Birth, Gender, National ID, Email, Phone, Address, City, State, Pincode, Country, Notes. Can create profile if it does not exist yet, or edit existing data.\n\nSTAFF/ADMIN: Sees a paginated table of all customers. Can create a customer profile on behalf of a client (also auto-creates an IAM login with a temporary password). Can open a detail modal to update KYC status or view claim history. KYC statuses: PENDING → IN_PROGRESS → VERIFIED / REJECTED / EXPIRED.',
  'Component: CustomersPage.jsx. POST /api/v1/customers (create). PUT /api/v1/customers/{id} (update). GET /api/v1/customers/my-profile (policyholder self-view). PATCH /api/v1/customers/{id}/kyc (KYC update by staff). CustomerSearch in UI.jsx is a typeahead: typing 3+ characters calls GET /api/v1/customers?search=query and shows a dropdown list.',
  'POST /api/v1/customers\nBody: { fullName, dateOfBirth, gender, nationalId, email, phone,\n        address, city, state, pincode, country, notes }\n\nPATCH /api/v1/customers/{id}/kyc\nBody: { status: "VERIFIED" }',
  'Controller: CustomerController in customer-service. Service: CustomerServiceImpl.\n\nCREATE (by staff): (1) Validates email, nationalId, phone uniqueness. (2) Saves Customer entity. (3) Feign call to iam-service to create IAM user with forcePasswordChange=true and generated temp password. (4) Returns customer + temp password.\n\nCREATE (by policyholder — self): Same but links customer.userId to JWT userId. No IAM user creation (they already have one).\n\nKYC UPDATE: Sets customer.kycStatus field. Publishes audit event.',
  [
    '409 Conflict — Duplicate email, national ID, or phone number',
    '403 Forbidden — Policyholder accessing another customer\'s record',
    '404 Not Found — Customer record does not exist',
  ],
  [
    ['customerId vs userId', 'userId is from iam-service (the login identity). customerId is from customer-service (the insurance profile). A policyholder has both; staff only have a userId.'],
    ['KYC (Know Your Customer)', 'A regulatory requirement where the insurer verifies identity documents before issuing policies. Only VERIFIED customers can have policies created.'],
    ['Feign client', 'Spring Cloud library. Lets one microservice call another over HTTP as if it were a local Java method call — customer-service uses one to call iam-service when creating a profile for an agent-managed customer.'],
  ]
);

// ── FEATURE 6 ─────────────────────────────────────────────────────────────
featureBlock(6, 'Insurance Marketplace (Buy Insurance)',
  'A consumer-facing shopping interface where policyholders browse 5 types of insurance (Life, Health, Vehicle, Property, Travel), each with 3 pricing tiers. Selecting a plan opens a purchase form that submits a policy creation request.',
  'The page shows 5 category tabs. Each tab displays a coloured header with icon and tagline, followed by 3 plan cards (e.g. "Term Life Basic / Plus / Whole Life") showing coverage amount, annual premium, and a feature bullet list. Cards may have "Popular" or "Best Value" badges. Clicking "Get This Plan" opens a purchase modal with the coverage amount pre-filled. The user fills in start/end dates, nominee name, nominee relation (Spouse/Child/Parent/Sibling/Other). On submit the policy is created and enters the underwriting workflow.',
  'Component: PolicyMarketPage.jsx. Plan catalogue is hard-coded in a PLAN_TIERS constant (no API call needed for browsing). On "Get This Plan": setSelectedPlan(plan) → PurchaseModal opens. CustomerSearch typeahead used for non-policyholders. On form submit → POST /api/v1/policies.',
  'POST /api/v1/policies\nBody: {\n  customerId:     42,\n  policyTypeId:   1,\n  coverageAmount: 2500000,\n  startDate:      "2025-01-01",\n  endDate:        "2026-01-01",\n  nomineeName:    "Rahul Kumar",\n  nomineeRelation:"SPOUSE"\n}',
  'Controller: PolicyController.createPolicy() in policy-service. Service: PolicyServiceImpl.\n(1) Feign call to customer-service: validates customer exists and kycStatus=VERIFIED. (2) Fetches PolicyType by policyTypeId (contains basePremiumRate, requiresUnderwriting flag). (3) Calculates premiumAmount = coverageAmount * basePremiumRate. (4) Generates policyNumber in format POL-TYPE-YYYY-0000001 (sequential per year). (5) Sets status=DRAFT. (6) If policyType.requiresUnderwriting=true: sets status=PENDING_UNDERWRITING + Feign call to underwriting-service to create UnderwritingRequest. (7) Saves Policy. (8) Publishes audit event. (9) Sends notification to customer.',
  [
    '400 — Customer KYC not VERIFIED',
    '400 — Coverage amount below minimum (Rs 10,000), end date before start date',
    '404 — Customer or policy type not found',
  ],
  [
    ['policyNumber format', 'POL-{TYPE}-{YYYY}-{7-digit-sequence}, e.g. POL-LIFE-2025-0000001. Sequence is reset per year per type.'],
    ['basePremiumRate', 'A multiplier stored in the policy_types seed table. premiumAmount = coverageAmount * basePremiumRate.'],
    ['requiresUnderwriting', 'Boolean flag on PolicyType. If true, policy is created with status PENDING_UNDERWRITING and an UnderwritingRequest is auto-created.'],
  ]
);

// ── FEATURE 7 ─────────────────────────────────────────────────────────────
featureBlock(7, 'Policy Lifecycle Management',
  'Policies move through a defined status workflow from creation to expiry. Each status transition is an explicit action guarded by role permissions. The full workflow is: DRAFT → PENDING_UNDERWRITING → ACTIVE → EXPIRED / CANCELLED / SUSPENDED / LAPSED.',
  'The Policies page shows a table with a status filter dropdown. Role-specific action buttons appear in each row: Activate (ADMIN/UNDERWRITER) on DRAFT or PENDING_UNDERWRITING policies; Cancel (ADMIN/AGENT) on ACTIVE policies (prompts for a reason). Clicking any row opens a detail modal with two tabs: Details and Endorsements. Fields shown: Policy Number, Status, Type, Customer ID (hidden for policyholders), Coverage Amount, Premium Amount, Start/End Dates, Nominee, Agent ID.',
  'Component: PoliciesPage.jsx. List: GET /api/v1/policies?page=0&size=10&status=ACTIVE&customerId=42. Activate: POST /api/v1/policies/{id}/activate. Cancel: POST /api/v1/policies/{id}/cancel?reason=... (backend uses @RequestParam). CustomerSearch typeahead for the create-policy form customer field.',
  'GET /api/v1/policies?page=0&size=10&status=ACTIVE&customerId=42\nPOST /api/v1/policies/{id}/activate\nPOST /api/v1/policies/{id}/cancel?reason=Non-payment',
  'ACTIVATE: (1) Validates policy.status is DRAFT or PENDING_UNDERWRITING. (2) Sets status=ACTIVE, activatedAt=now(). (3) Feign call to premium-payment-service to create first invoice. (4) Sends notification: "Your policy is now active." (5) Publishes audit event.\n\nCANCEL: (1) Sets status=CANCELLED, stores cancellationReason. (2) Feign call to payment-service to cancel any ISSUED/PENDING invoices. (3) Audit event.\n\nAll list queries are paginated via Spring PageRequest. For policyholders, the backend filters by customerId extracted from the JWT — a policyholder cannot list policies of other customers.',
  [
    '409 — Policy already ACTIVE (cannot re-activate)',
    '409 — Policy already CANCELLED',
    '400 — Trying to activate a policy whose customer KYC has since been revoked',
    '403 — Policyholder trying to cancel their own policy (only ADMIN/AGENT permitted)',
  ],
  [
    ['@Transactional', 'Spring annotation that wraps a method in a database transaction. If any step fails (e.g. invoice creation), the entire policy activation rolls back — no half-updated state.'],
    ['Spring PageRequest', 'Builds a SQL LIMIT/OFFSET + ORDER BY clause from page number, page size, and sort field parameters.'],
    ['Policy status flow', 'DRAFT (just created) → PENDING_UNDERWRITING (needs risk review) → ACTIVE (approved and paid) → EXPIRED (end date passed) / CANCELLED (manually stopped) / LAPSED (premium not paid).'],
  ]
);

// ── FEATURE 8 ─────────────────────────────────────────────────────────────
featureBlock(8, 'Policy Endorsements',
  'An endorsement is a formal mid-term amendment to a policy — changing the coverage amount, updating nominee details, or correcting the address — without cancelling and reissuing the policy.',
  'In the Policy Detail modal, the Endorsements tab shows a vertical timeline of past endorsements (change type, reason, effective date shown as amber dot entries). ADMIN and UNDERWRITER roles also see an Add Endorsement form with three fields: Change Type dropdown (COVERAGE_CHANGE / NOMINEE_CHANGE / ADDRESS_CHANGE), New Value text field, Reason text field.',
  'Component: PolicyEndorsements inside PoliciesPage.jsx. Loads: GET /api/v1/policies/{policyId}/endorsements. Creates: POST /api/v1/policies/{policyId}/endorsements with URL query params (not JSON body) because backend uses @RequestParam:\n  POST /api/v1/policies/7/endorsements?changeType=COVERAGE_CHANGE&newValue=500000&reason=Upgrade',
  'GET /api/v1/policies/{id}/endorsements\nPOST /api/v1/policies/{id}/endorsements\n  ?changeType=COVERAGE_CHANGE\n  &newValue={"coverageAmount":500000}\n  &reason=Customer+requested+upgrade',
  'Controller: PolicyController.addEndorsement(). Service creates a PolicyEndorsement entity: policyId, changeType, previousValue (read from current policy), newValue, reason, effectiveDate=now(), requestedBy=JWT userId. Saved to policy_endorsements table. Audit event published.',
  [
    '403 — Only ADMIN/UNDERWRITER can add endorsements (policyholders are read-only on this tab)',
    '400 — Invalid changeType value not in enum',
  ],
  [
    ['@RequestParam', 'Spring annotation that reads a value from the URL query string (e.g. ?changeType=X) rather than from the JSON request body. The frontend must build a URLSearchParams string instead of a JSON object.'],
  ]
);

// ── FEATURE 9 ─────────────────────────────────────────────────────────────
featureBlock(9, 'Claims Submission',
  'Policyholders (or agents/admins on their behalf) submit insurance claims against an active policy. Each claim captures a claim type, incident date, description, and requested payout amount. The backend validates that the incident falls within the coverage period and the amount does not exceed coverage.',
  'POLICYHOLDER: Clicks "+ File Claim". A modal appears with: a dropdown of their ACTIVE policies (fetched from API). When a policy is selected the Claim Type dropdown narrows automatically to relevant types — a Vehicle policy only shows ACCIDENT/THEFT/PROPERTY_DAMAGE; a Life policy shows DEATH/ACCIDENT. Incident Date picker (max = today). Amount Requested (min Rs 100). Description textarea with a live character counter (min 20 characters — turns amber then green as the user types). Shows an info alert if no active policies exist.\n\nSTAFF: Same form but with a manual Policy ID number input instead of a dropdown. Claims shown as a data table.',
  'Component: ClaimsPage.jsx. Policyholder policies: GET /api/v1/policies?customerId={myCustomerId}&status=ACTIVE&size=50. getClaimTypesForPolicy() is a pure-frontend keyword-matching function on the policyTypeName string — no API call. Claims list for policyholders is filtered by user.userId (not customerId): &customerId={user.userId} because the claims backend stores submittedBy=userId.',
  'POST /api/v1/claims\nBody: {\n  policyId:        7,\n  incidentDate:    "2025-05-10",\n  claimType:       "MEDICAL",\n  description:     "Hospitalised for 3 days due to appendicitis...",\n  amountRequested: 85000\n}',
  'Controller: ClaimController.createClaim() in claims-service. Service: ClaimServiceImpl.\n(1) Feign call to policy-service: validates policy exists, status=ACTIVE, belongs to this user.\n(2) Validates incidentDate is within policy coverage period (startDate <= incidentDate <= endDate).\n(3) Validates amountRequested <= policy.coverageAmount.\n(4) Generates claimNumber in format CLM-YYYYMM-0000001 (sequential per year-month).\n(5) Sets status=SUBMITTED, claimDate=now().\n(6) Saves Claim entity.\n(7) Publishes RabbitMQ event → notification-service sends notification to available adjusters.\n(8) Writes audit log.',
  [
    '400 — Policy not ACTIVE, incident date outside coverage period, amount exceeds coverage, description too short',
    '403 — Policyholder submitting a claim against another customer\'s policy',
    '404 — Policy not found',
  ],
  [
    ['claimNumber format', 'CLM-{YYYYMM}-{7-digit-sequence}, e.g. CLM-202505-0000001. Counter resets each month.'],
    ['Claim type filtering', 'Pure frontend logic. getClaimTypesForPolicy() does string .includes() checks on policyTypeName. No API call needed — the logic runs instantly in the browser.'],
    ['user.userId vs customerId', 'Claims store submittedBy=userId (IAM identity). The list filter also uses userId. customerId (customer-service ID) is only used for the policies dropdown fetch.'],
  ]
);

// ── FEATURE 10 ─────────────────────────────────────────────────────────────
featureBlock(10, 'Claims Adjudication',
  'Adjusters (and admins) review submitted claims and make a decision: Approve, Partially Approve, Reject, request more documents (PENDING_DOCS), or put it back Under Review. Approving a claim also creates a Settlement record.',
  'In the Claims table, SUBMITTED or UNDER_REVIEW claims show a "Review" button for ADJUSTER/ADMIN roles. Clicking opens the Adjudicate Claim modal showing: the claim reference + requested amount in an info box; a Decision dropdown (APPROVED / PARTIALLY_APPROVED / REJECTED / UNDER_REVIEW / PENDING_DOCS); for Approved/Partially Approved: two numeric fields appear — Approved Amount and Deductible, with a live "Net Payout" calculator (approved - deductible shown in green if positive, red if not); Remarks textarea (required). Submitting is blocked client-side if deductible > approved amount.',
  'Component: Status Update Modal in ClaimsPage.jsx. On "Update Status": PATCH /api/v1/claims/{claimId}/status. Client-side guard before sending: if (deductibleAmt > approvedAmt) show error and block submission.',
  'PATCH /api/v1/claims/{id}/status\nBody: {\n  status:           "APPROVED",\n  remarks:          "Claim verified. Hospitalization confirmed.",\n  approvedAmount:   75000,\n  deductibleAmount: 5000\n}',
  'Controller: ClaimController.updateStatus().\n(1) Updates claim.status, remarks, approvedAmount, deductibleAmount.\n(2) If status = APPROVED or PARTIALLY_APPROVED: creates Settlement entity (amountApproved, deductibleApplied=5000, netPayout=70000, status=PENDING, settlementDate=now()).\n(3) Sends notification to policyholder: "Your claim CLM-202505-0000001 has been approved."\n(4) Publishes audit event.\n\nValid status transitions enforced on backend: SUBMITTED→UNDER_REVIEW, UNDER_REVIEW→APPROVED/REJECTED/PENDING_DOCS, APPROVED→SETTLED, REJECTED→DISPUTED.',
  [
    '403 — Only ADJUSTER/ADMIN can adjudicate claims',
    '400 — Invalid status transition (e.g. SETTLED → SUBMITTED rejected)',
    '400 — Deductible exceeds approved amount (also validated backend-side)',
  ],
  [
    ['Settlement record', 'Created automatically by ClaimServiceImpl when status changes to APPROVED or PARTIALLY_APPROVED. Stores amountApproved, deductibleApplied, netPayout, settlementDate.'],
    ['PARTIALLY_APPROVED', 'Used when only part of the claimed amount is approved (e.g. Rs 85,000 claimed, Rs 60,000 approved with Rs 5,000 deductible = Rs 55,000 net payout).'],
    ['Net payout', 'approvedAmount - deductibleAmount. The actual amount the policyholder receives.'],
  ]
);

// ── FEATURE 11 ─────────────────────────────────────────────────────────────
featureBlock(11, 'Claim Notes',
  'Staff can attach notes to any claim — either internal (visible only to staff) or external (visible to the policyholder). Notes build a timestamped communication timeline that tracks all updates on the claim.',
  'In the Claim Detail modal the "Updates" tab shows a vertical timeline. Each note appears as a dot + text + timestamp. Internal notes have a red dot and display "Internal note •" prefix; external notes have an amber dot. Staff with ADMIN/ADJUSTER/AGENT role see a textarea + "Internal only" checkbox + "Add Note" button above the timeline.',
  'Component: ClaimNotes inside ClaimsPage.jsx. GET /api/v1/claims/{claimId}/notes to load. POST /api/v1/claims/{claimId}/notes with { noteText, internal: true/false }. After POST: calls reload() to refresh the timeline.',
  'POST /api/v1/claims/{claimId}/notes\nBody: { noteText: "Awaiting hospital discharge summary.", internal: true }',
  'Controller: ClaimController.addNote(). Creates ClaimNote entity: claimId, noteText, internal (boolean), createdBy=JWT userId, createdAt=now(). Saved to claim_notes table. On GET /notes, the backend filters internal=true notes out of the response when the requesting user has ROLE_POLICYHOLDER.',
  [
    '403 — Policyholders cannot add notes (read-only for them); ADMIN/ADJUSTER/AGENT only',
    'Internal notes are automatically hidden from policyholders by the backend query filter',
  ],
  [
    ['Internal note', 'A note with internal=true in the database. Staff-eyes-only. The backend filters these from GET /notes responses for policyholder-role requests.'],
  ]
);

// ── FEATURE 12 ─────────────────────────────────────────────────────────────
featureBlock(12, 'Claim Disputes',
  'When a claim is REJECTED or PARTIALLY_APPROVED, the policyholder (or their agent) can formally challenge the decision by raising a dispute with a written reason. The claim moves to DISPUTED status and a ClaimDispute record is created for staff review.',
  'On a claim card with status REJECTED or PARTIALLY_APPROVED, a "Raise Dispute" button appears. Clicking opens a modal showing which claim is being disputed and its current status. A "Reason for Dispute" textarea is required. On submit: POST /api/v1/claims/{claimId}/dispute?reason=... Staff can later update dispute status to UNDER_REVIEW, RESOLVED, or ESCALATED.',
  'Component: Dispute Modal in ClaimsPage.jsx. Uses URL query param (not JSON body): POST /api/v1/claims/{id}/dispute?reason={encodedReason} because the backend uses @RequestParam String reason.',
  'POST /api/v1/claims/{claimId}/dispute\n  ?reason=The+amount+approved+does+not+cover+the+actual+expenses',
  'Controller: ClaimController.raiseDispute(). (1) Sets claim.status=DISPUTED. (2) Creates ClaimDispute entity: claimId, reason, status=OPEN, raisedBy=JWT userId, raisedAt=now(). (3) Notifies relevant staff. (4) Audit event.',
  [
    '400 — Claim is not in REJECTED or PARTIALLY_APPROVED status (disputes only allowed on those)',
    '403 — Only POLICYHOLDER or AGENT can raise a dispute',
  ],
  [
    ['ClaimDispute entity', 'Stored in claim_disputes table. Has its own status lifecycle: OPEN → UNDER_REVIEW → RESOLVED / ESCALATED.'],
  ]
);

// ── FEATURE 13 ─────────────────────────────────────────────────────────────
featureBlock(13, 'Claim Settlement View',
  'Shows the settlement record for an approved claim — the final approved amount, deductible applied, net payout, settlement date, payment mode, and remarks. This is a read-only view; the settlement is created automatically when adjudication status is set to APPROVED.',
  'In the Claim Detail modal, the "Settlement" tab displays a DetailGrid of key-value pairs. If the claim is not yet approved, a "No settlement record yet" empty state is shown.',
  'Component: ClaimSettlement inside ClaimsPage.jsx. GET /api/v1/claims/{claimId}/settlement. Returns the Settlement entity or 404 if not yet created.',
  'GET /api/v1/claims/{claimId}/settlement\nResponse: {\n  status: "PENDING",\n  amountApproved: 75000,\n  deductibleApplied: 5000,\n  settlementDate: "2025-05-20",\n  paymentMode: "NEFT",\n  remarks: "Verified"\n}',
  'Controller: ClaimController.getSettlement(). Repository: SettlementRepository.findByClaimId(claimId). Returns 404 if no settlement exists (claim not yet approved).',
  [
    '404 — Claim not yet approved; no settlement record created yet',
  ],
  [
    ['Settlement status', 'Starts as PENDING when claim is approved. Updated to PAID once the actual payout is processed externally.'],
  ]
);

// ── FEATURE 14 ─────────────────────────────────────────────────────────────
featureBlock(14, 'Invoice Generation',
  'When a policy is activated, an invoice is automatically created for the first premium period. Policyholders can also manually request an invoice for an active policy that does not have one yet. Invoices include 18% GST (Indian tax) on top of the base premium.',
  'On the Payments page the Invoices tab shows either open invoice cards or "PolicyPayCard" components (for active policies awaiting their first payment). Each InvoiceCard shows: Invoice Number (INV-YYYYMM-000001), due date, Premium + 18% GST + Total Payable, coverage period, and a "Pay Rs X Now" button. If there are no invoices but there are active policies, PolicyPayCard components appear with "Pay Now" buttons that first generate an invoice then reload.',
  'Component: InvoiceList in PaymentsPage.jsx. Load invoices: GET /api/v1/invoices/customer/{customerId}. Request invoice on demand: POST /api/v1/policies/{policyId}/request-invoice. The request-invoice endpoint lives on policy-service which makes an internal Feign call to premium-payment-service — policyholders cannot directly hit the invoice service\'s internal creation endpoint.',
  'GET /api/v1/invoices/customer/{customerId}?page=0&size=10\nPOST /api/v1/policies/{policyId}/request-invoice',
  'InvoiceServiceImpl.createInvoice(): (1) Checks for existing invoice for this policyId + periodStart (idempotency — no duplicates). (2) taxAmount = premiumAmount * 0.18. (3) Sets status=ISSUED, dueDate=today+30days. (4) Generates invoiceNumber=INV-YYYYMM-000001 (sequential). (5) Saves Invoice entity.',
  [
    '409 — Invoice already exists for this policy + billing period (idempotency check)',
    '404 — Policy not found',
    '400 — Policy is not ACTIVE',
  ],
  [
    ['Invoice number format', 'INV-{YYYYMM}-{6-digit-sequence}, e.g. INV-202505-000001.'],
    ['Idempotency', 'The system checks if an invoice already exists before creating one. Calling request-invoice twice produces only one invoice.'],
    ['18% GST', 'Indian Goods and Services Tax applied to insurance premiums. taxAmount = premiumAmount * 0.18. Total = premiumAmount + taxAmount.'],
  ]
);

// ── FEATURE 15 ─────────────────────────────────────────────────────────────
featureBlock(15, 'Premium Payment',
  'Records a payment transaction against an invoice. Marks the invoice as PAID. Automatically saves a payment receipt document to the document-service. Admins/Finance can also process refunds.',
  'Clicking "Pay Rs X Now" on an InvoiceCard opens the Payment Modal showing: Invoice summary box (Invoice No, Due Date, Base Amount, GST, Total Payable in large green text). Payment Method dropdown: UPI / Credit Card / Debit Card / Net Banking / NEFT / Cheque / Cash. Transaction Reference text field (optional — for UTR/transaction ID). A note: "Your payment receipt will be automatically saved to your Documents."\n\nStaff view: same modal but titled "Record Payment" — used to record offline payments.\n\nPayment History tab shows past payments: Date, Amount, Method, Reference, Status, and Refund button (ADMIN/FINANCE only).',
  'Component: Payment Modal in PaymentsPage.jsx. Total calculated client-side: invoice.amount + invoice.taxAmount. POST /api/v1/payments. After success, activeTab switches to "payments". Refund: POST /api/v1/payments/{id}/refund (ADMIN/FINANCE only). Payment history: GET /api/v1/payments/customer/{customerId}.',
  'POST /api/v1/payments\nBody: {\n  invoiceId:        12,\n  customerId:       42,\n  amount:           1003.00,\n  method:           "UPI",\n  gatewayReference: "UPI123456789"\n}',
  'Controller: PaymentController.recordPayment() in premium-payment-service.\n(1) Validates invoice exists and status is ISSUED/PENDING/OVERDUE.\n(2) Saves Payment entity: invoiceId, customerId, amount, method, gatewayReference, status=SUCCESS, paymentDate=now().\n(3) Updates Invoice.status=PAID.\n(4) Feign call to document-service to register a payment receipt PDF.\n(5) Sends notification: "Payment of Rs X received for invoice INV-202505-000001."\n(6) Publishes audit event.\n\nREFUND (POST /payments/{id}/refund): Sets payment.status=REFUNDED, reverts invoice to previous status.',
  [
    '400 — Invoice already PAID',
    '400 — Payment amount does not match invoice total',
    '403 — Only ADMIN/FINANCE can process refunds',
    '404 — Invoice or payment not found',
  ],
  [
    ['gatewayReference', 'An optional transaction ID / UTR from the actual payment gateway or bank transfer. Stored for reconciliation. Not validated by the system.'],
    ['REFUNDED status', 'Sets payment.status=REFUNDED. Does not automatically reverse the invoice — admin must re-issue if needed.'],
  ]
);

// ── FEATURE 16 ─────────────────────────────────────────────────────────────
featureBlock(16, 'Document Management',
  'Users can upload files (PDFs, images, Word docs — up to 10 MB) linked to policies, claims, customers, or KYC records. Files are stored on disk with a SHA-256 checksum for integrity verification. Staff can view and download documents with access-level controls.',
  'POLICYHOLDER: Can upload KYC documents from a document type dropdown: NATIONAL_ID, PASSPORT, DRIVING_LICENSE, UTILITY_BILL, OTHER. File picker + upload button.\n\nSTAFF/ADMIN: Can search for a customer, then upload documents for any entity type (POLICY, CLAIM, CUSTOMER, KYC) with additional types: POLICY_WORDING, FIR, MEDICAL_REPORT, CLAIM_FORM, PAYMENT_RECEIPT, etc. Access level: PUBLIC / INTERNAL / RESTRICTED.\n\nDocument list shows: file name, entity type, access level, upload date, file size. "View" opens the file in a new browser tab (blob URL). "Download" triggers a browser download.',
  'Component: DocumentsPage.jsx. Uses multipart/form-data (NOT JSON) for upload — FormData object with fields: file (binary), entityType, entityId, documentType, accessLevel. The Authorization header is set manually; no Content-Type is set (browser auto-adds multipart boundary). View: GET /api/v1/documents/{id}/view returns file bytes as a blob → URL.createObjectURL(blob) → window.open().',
  'POST /api/v1/documents  (multipart/form-data)\nFields: file=<binary>, entityType=KYC, entityId=42,\n        documentType=NATIONAL_ID, accessLevel=INTERNAL\n\nGET /api/v1/documents/{id}/view\nResponse: binary file bytes with Content-Type header',
  'Controller: DocumentController.uploadDocument() in document-service.\n(1) Validates file size (max 10 MB configurable).\n(2) Generates UUID filename preserving original extension.\n(3) Saves file bytes to disk at: storagePath/{entityType}/{entityId}/{UUID}.ext\n(4) Calculates SHA-256 checksum of file bytes.\n(5) Saves Document entity: fileName, originalName, mimeType, fileSize, checksum, entityType, entityId, documentType, accessLevel, storagePath, uploadedBy=JWT userId.\n\nVIEW: Reads file bytes from disk path stored in DB. Returns ResponseEntity<byte[]> with correct Content-Type.',
  [
    '400 — File too large (> 10 MB)',
    '400 — Unsupported file type',
    '403 — RESTRICTED document accessed by insufficient-role user',
    '404 — Document record not found in database',
    '500 — File missing from disk (storage path mismatch)',
  ],
  [
    ['SHA-256 checksum', 'A fingerprint of the file content. If the stored checksum does not match a re-calculated checksum on retrieval, the file has been tampered with.'],
    ['multipart/form-data', 'An HTTP encoding for file uploads. Unlike JSON, it can carry binary data. The browser sets the Content-Type header automatically with a unique boundary string — the frontend must NOT set it manually or the upload breaks.'],
    ['Blob URL', 'URL.createObjectURL(blob) creates a temporary browser-local URL for binary data. Used to open a file in a new tab without exposing the actual API endpoint to the user.'],
    ['Access levels', 'PUBLIC — any authenticated user. INTERNAL — staff only. RESTRICTED — specific roles only (e.g. COMPLIANCE, ADMIN).'],
  ]
);

// ── FEATURE 17 ─────────────────────────────────────────────────────────────
featureBlock(17, 'Underwriting Risk Assessment',
  'When a policy is created for a type that requires underwriting, an UnderwritingRequest is automatically created. A RiskScoringEngine calculates a numeric risk score and may auto-decide low or high-risk cases. Mid-range cases are flagged for manual underwriter review.',
  'The Underwriting page (ADMIN/UNDERWRITER only) shows a table of pending requests: Request ID, Policy ID, Customer ID, Risk Score (0–100), Status (PENDING/IN_REVIEW/REFERRED/AUTO_APPROVED/AUTO_DECLINED/APPROVED/DECLINED), Created timestamp. Clicking a row opens a decision modal where the underwriter enters: Decision (APPROVED/DECLINED) and Remarks.',
  'Component: UnderwritingPage.jsx. List: GET /api/v1/underwriting. Decision: POST /api/v1/underwriting/{id}/decision with { decision: "APPROVED", remarks: "Low risk profile, standard coverage" }.',
  'GET /api/v1/underwriting?page=0&size=10&status=REFERRED\nPOST /api/v1/underwriting/{id}/decision\nBody: { decision: "APPROVED", remarks: "Low risk, standard issue" }',
  'Controller: UnderwritingController in underwriting-service.\n\nAUTO-SCORING (triggered on request creation via Feign call from policy-service):\nRiskScoringEngine calculates riskScore 0-100 from: coverage amount, customer age (from DOB), claim history frequency, policy type risk factor.\nriskScore < 30 → AUTO_APPROVED\nriskScore > 70 → AUTO_DECLINED\nriskScore 30-70 → REFERRED (needs manual review)\n\nMANUAL DECISION: (1) Updates UnderwritingRequest.status=APPROVED/DECLINED, stores remarks. (2) Feign call back to policy-service: if APPROVED → policy.status=ACTIVE; if DECLINED → policy.status=CANCELLED. (3) Sends notification to agent/policyholder. (4) Audit event.',
  [
    '403 — Only ADMIN/UNDERWRITER can make decisions',
    '400 — Decision already made (cannot re-decide a APPROVED/DECLINED request)',
    '404 — Underwriting request not found',
  ],
  [
    ['RiskScoringEngine', 'A Spring @Service bean in underwriting-service. Computes a 0-100 risk score using weighted factors: coverage amount weight, age bracket weight, historical claim frequency, policy type base risk.'],
    ['RiskRule entity', 'Configurable rules stored in the risk_rules table (threshold values, weight factors). Allows risk parameters to be adjusted without code changes.'],
    ['AUTO_APPROVED / AUTO_DECLINED', 'When the risk score falls clearly inside a threshold, the engine makes the decision immediately without a human reviewer. Only REFERRED cases queue for manual underwriter action.'],
  ]
);

// ── FEATURE 18 ─────────────────────────────────────────────────────────────
featureBlock(18, 'Analytics & KPI Reports',
  'Provides a live KPI dashboard showing claim pipeline health (approval rate, settlement rate) and lets authorised users generate point-in-time reports that are persisted in the database for audit and management review.',
  'KPI Hero Cards: 5 stat cards — Total Claims, Approved, Settled, Rejected, Pending Review.\n\nClaims Volume Breakdown: Horizontal progress bars showing each status as % of total claims.\n\nRate Gauges: Two visual gauge bars — Approval Rate % and Settlement Rate %, plus a "Claims Health Score" card (average of the two rates).\n\nGenerate Report panel (ADMIN/COMPLIANCE/FINANCE): Select KPI Metric, Report Period (MONTHLY/QUARTERLY/ANNUAL), optional Scope (ALL/HEALTH/LIFE/MOTOR/TRAVEL/PROPERTY). Click "Generate Report". Report appears in the table below with its captured metrics, period, scope, and generation timestamp. Clicking "Details" opens a metrics spotlight modal.',
  'Component: AnalyticsPage in OtherPages.jsx. GET /api/v1/analytics/kpis → array of KPI objects. GET /api/v1/analytics/reports?page=0&size=20 → list of generated reports. POST /api/v1/analytics/reports?kpiName=...&reportType=...&scope=... → generate new report.',
  'GET /api/v1/analytics/kpis\nResponse: [\n  { kpiName: "TOTAL_CLAIMS",   value: "142", trend: "up" },\n  { kpiName: "APPROVED_CLAIMS",value: "98",  trend: "stable" },\n  { kpiName: "APPROVAL_RATE",  value: "69.0",trend: "up" },\n  ...\n]\n\nPOST /api/v1/analytics/reports\n  ?kpiName=TOTAL_CLAIMS&reportType=MONTHLY&scope=HEALTH',
  'Controller: AnalyticsController in analytics-service.\n\nGET /kpis: Feign calls to claims-service to count claims by status. Computes: approvalRate = (approvedClaims / totalClaims) * 100, settlementRate = (settledClaims / totalClaims) * 100. Returns array of KPI DTOs.\n\nPOST /reports: Takes a live snapshot of current KPI values. Builds metrics JSON blob: { totalClaims:142, approvedClaims:98, approvalRate:69.01, ... }. Sets periodStart/periodEnd based on reportType (MONTHLY=last 30 days). Saves KPIReport entity to analytics DB.',
  [
    '403 — Only ADMIN/COMPLIANCE/FINANCE can generate reports (viewing KPIs is unrestricted for staff)',
    'Rate computation returns 0.0 if totalClaims is zero (division-by-zero guard)',
  ],
  [
    ['KPI', 'Key Performance Indicator. TOTAL_CLAIMS, APPROVED_CLAIMS, SETTLED_CLAIMS, REJECTED_CLAIMS, PENDING_CLAIMS, APPROVAL_RATE, SETTLEMENT_RATE, CLAIM_RATIO, PREMIUM_COLLECTION.'],
    ['metrics JSON column', 'The KPIReport entity stores a JSON blob in a TEXT column containing all the metric values at snapshot time. The frontend parses it with parseMetrics() to display human-readable labels.'],
  ]
);

// ── FEATURE 19 ─────────────────────────────────────────────────────────────
featureBlock(19, 'Compliance Audit Logs',
  'Every significant action (policy created, claim submitted, payment recorded, user login/logout) is written to an immutable audit log. Compliance officers and admins can search by user, action type, or resource, and export the full log as a CSV file.',
  'The Audit Logs page (ADMIN/COMPLIANCE only) shows a search bar with three filters: User ID, Action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT/VIEW), Resource Type (free text: POLICY, CLAIM, etc.). Results are shown in a table: Audit ID, User, Action (colour-coded: green=CREATE, amber=UPDATE, red=DELETE), Resource, Resource ID, IP Address, Timestamp. An "Export CSV" button opens a new tab that downloads the filtered log as a CSV.',
  'Component: AuditPage in OtherPages.jsx. GET /api/v1/audit-logs?page=0&size=20&userId=5&action=CREATE. Export: window.open(`${BASE_URL}/api/v1/audit-logs/export?userId=5&action=CREATE`, "_blank").',
  'GET /api/v1/audit-logs?page=0&size=20&userId=5&action=CREATE&resourceType=POLICY',
  'Controller: AuditController in audit-compliance-service. (1) Builds JPA Specification from query params. (2) AuditLogRepository.findAll(spec, pageable). (3) Export endpoint streams CSV using StreamingResponseBody.\n\nAudit entries are written by two paths: (a) Direct HTTP POST from each service to /api/v1/audit-logs/internal (no JWT required — internal only). (b) RabbitMQ consumers in audit-service that receive events published by each service on significant actions.',
  [
    '403 — Non-ADMIN/COMPLIANCE role attempting to access audit logs',
    'Audit logs are IMMUTABLE — no update or delete endpoints exist',
  ],
  [
    ['Immutable audit log', 'The audit_logs table has no UPDATE or DELETE endpoints. Records are insert-only. This satisfies regulatory requirements for tamper-evident event trails.'],
    ['JPA Specification', 'Spring Data pattern for building dynamic WHERE clauses. Allows optional filters (userId, action, resourceType) to be added only when they have values.'],
    ['StreamingResponseBody', 'Spring mechanism that streams large responses (CSV export) without buffering the entire result in memory.'],
  ]
);

// ── FEATURE 20 ─────────────────────────────────────────────────────────────
featureBlock(20, 'Notifications',
  'In-app notifications inform users about events relevant to them: claim status changes, policy activations, payment receipts, KYC updates. An unread badge on the bell icon shows the count. Notifications are polled every 60 seconds.',
  'A bell icon in the topbar shows an orange dot and/or a numbered badge when unread notifications exist. Clicking navigates to the Notifications page which lists all notifications: an amber dot (unread) or grey dot (read), message text, category badge (POLICY/CLAIMS/PAYMENT/etc.), status badge, and a "Mark Read" button per item. A "Mark All Read" button at the top batch-marks everything.',
  'Component: NotificationsPage in OtherPages.jsx. The unread count is maintained in AuthContext — fetched on login and polled every 60 seconds (setInterval in useEffect). GET /api/v1/notifications?page=0&size=20. Mark read: PATCH /api/v1/notifications/{id}/read. Mark all read: parallel PATCH calls for every unread notification. Both call refreshUnreadCount() after.',
  'GET /api/v1/notifications?page=0&size=20\nPATCH /api/v1/notifications/{id}/read\nGET /api/v1/notifications/unread-count',
  'Controller: NotificationController in notification-service. Notifications are created in two ways: (1) Feign calls from other services (e.g. claims-service calls POST /api/v1/notifications/internal when a claim status changes). (2) RabbitMQ consumers consuming domain events.\n\nNotification entity: userId, message, category (SYSTEM/POLICY/CLAIMS/PAYMENT/UNDERWRITING/DOCUMENTS), status (PENDING→SENT→READ/FAILED), channel (IN_APP/EMAIL/SMS), createdAt. PATCH /read sets status=READ.',
  [
    'Notifications to non-existent users are silently dropped (Feign call catches 404)',
    'The poll interval is 60 seconds — real-time push is NOT implemented (no WebSockets)',
  ],
  [
    ['setInterval polling', 'AuthContext sets a 60-second timer that calls GET /api/v1/notifications/unread-count. The timer is cleared (clearInterval) when the user logs out.'],
    ['IN_APP channel', 'The only channel fully implemented. EMAIL and SMS channels are defined in the schema but the actual sending logic (SMTP/SMS gateway) is not wired up in this version.'],
  ]
);

// ── FEATURE 21 ─────────────────────────────────────────────────────────────
featureBlock(21, 'User Management (Admin)',
  'Admins can create staff accounts with any role, deactivate users (revokes access immediately), reactivate them, and unlock accounts locked by too many failed login attempts.',
  'The User Management page (ADMIN only) shows a paginated table: ID, Username, Full Name, Email, Roles (chips), Status (ACTIVE/INACTIVE/LOCKED badge), Last Login, Actions.\n\nActions: Unlock button for LOCKED accounts. Deactivate button for ACTIVE non-admin accounts (browser confirm dialog). Reactivate button for INACTIVE accounts.\n\n"+ New User" opens a create modal: Username, Full Name, Email, Phone (optional), Password, Role dropdown (Agent/Adjuster/Underwriter/Compliance/Finance/Admin). Client-side and server-side validation on all fields.',
  'Component: UsersPage in OtherPages.jsx. List: GET /api/v1/auth/users?page=0&size=10. Create: POST /api/v1/auth/admin/users. Deactivate: DELETE /api/v1/auth/users/{id}. Reactivate: PATCH /api/v1/auth/users/{id}/reactivate. Unlock: POST /api/v1/auth/users/{id}/unlock.',
  'POST /api/v1/auth/admin/users\nBody: { username, fullName, email, phone,\n        password, role: "ROLE_AGENT" }\n\nDELETE /api/v1/auth/users/{id}     (deactivate — soft delete)\nPATCH  /api/v1/auth/users/{id}/reactivate\nPOST   /api/v1/auth/users/{id}/unlock',
  'Controller: AuthController.createUser() for admin-create. (1) Validates password strength via @StrongPassword. (2) Checks username/email uniqueness. (3) BCrypt-hashes password. (4) Sets forcePasswordChange=false (admin sets a real password). (5) Saves User with specified role.\n\nDEACTIVATE: Sets user.status=INACTIVE. Active JWTs remain valid until expiry — no immediate server-side invalidation (Redis blacklist is used only for logout).\n\nUNLOCK: Resets failed attempt counter, sets status=ACTIVE.',
  [
    '403 — Non-admin attempting user management operations',
    '409 — Duplicate username or email',
    '400 — Cannot deactivate another ADMIN account (guarded both on frontend and backend)',
    'Active JWTs for a deactivated user remain valid for up to 30 minutes until expiry',
  ],
  [
    ['Soft delete (deactivate)', 'Sets user.status=INACTIVE rather than deleting the row. All historical data linked to that userId is preserved.'],
    ['Account unlock', 'Resets login_attempts counter and sets status=ACTIVE. The 30-minute lockout timer is bypassed.'],
  ]
);

// ── FEATURE 22 ─────────────────────────────────────────────────────────────
featureBlock(22, 'My Profile & Password Change',
  'Every user can view their account details and change their own password. The profile view is role-sensitive: policyholders see only name/username/email; staff see full details including roles and MFA status.',
  'The Profile page is a two-column layout. Left card: Account Details — a read-only grid of user info. Right card: Change Password — two fields (Current Password, New Password) and an Update Password button. Success or error messages appear inline.',
  'Component: ProfilePage in OtherPages.jsx. PATCH /api/v1/auth/users/{userId}/password?currentPassword=...&newPassword=... Both query params are URL-encoded.',
  'PATCH /api/v1/auth/users/{userId}/password\n  ?currentPassword=OldPass%40123\n  &newPassword=NewPass%40456',
  'Controller: AuthController.changePassword(). Same logic as Force Password Change (Feature 3): BCrypt verify current, check password history, BCrypt hash new, update User.password, add to PasswordHistory, set forcePasswordChange=false.',
  [
    '400 — New password does not meet strength requirements',
    '400 — New password was used within last 5 passwords',
    '401 — Wrong current password',
    '403 — Trying to change another user\'s password (userId in path must match JWT userId, except ADMIN)',
  ],
  [
    ['DetailGrid', 'A reusable component in UI.jsx that renders a 2-column grid of [label, value] pairs. Used throughout the app for read-only data display.'],
  ]
);

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — DATA MODELS
// ════════════════════════════════════════════════════════════════════════════
chapterPage('3', 'Data Models', 'Every database entity, its fields, and how entities relate to each other');

h2('iam-service  (insurepro_iam database)');

h3('users table');
const userFields = [
  ['user_id (PK)', 'BIGINT AUTO_INCREMENT', 'Unique identifier for every user'],
  ['username', 'VARCHAR(50) UNIQUE', 'Login username'],
  ['password', 'VARCHAR(255)', 'BCrypt-hashed password'],
  ['email', 'VARCHAR(100) UNIQUE', 'Email address'],
  ['full_name', 'VARCHAR(100)', 'Display name'],
  ['phone', 'VARCHAR(20)', 'Optional phone number'],
  ['status', 'ENUM', 'ACTIVE / INACTIVE / LOCKED'],
  ['force_password_change', 'BOOLEAN', 'True when admin-created; cleared after first change'],
  ['mfa_enabled', 'BOOLEAN', 'TOTP 2FA toggle'],
  ['totp_secret', 'VARCHAR(64)', 'Encrypted TOTP seed (if MFA enabled)'],
  ['last_login_at', 'DATETIME', 'Timestamp of most recent successful login'],
  ['created_at', 'DATETIME', 'Account creation timestamp'],
];
const fw = [140, 120, W - 260];
tableRow(['Column', 'Type', 'Purpose'], fw, true);
userFields.forEach(r => tableRow(r, fw, false));
doc.moveDown(0.5);

h3('roles table  (join table: user_roles)');
body('A user can have multiple roles. Stored as a @ElementCollection on the User entity, mapping to a user_roles table with columns (user_id, role). Role values: ROLE_ADMIN, ROLE_AGENT, ROLE_ADJUSTER, ROLE_UNDERWRITER, ROLE_COMPLIANCE, ROLE_FINANCE, ROLE_POLICYHOLDER.');

h3('refresh_tokens table');
const rtFields = [
  ['id (PK)', 'BIGINT', 'Primary key'],
  ['user_id (FK)', 'BIGINT', 'Links to users.user_id'],
  ['token_hash', 'VARCHAR(64)', 'SHA-256 hash of the actual UUID token'],
  ['expires_at', 'DATETIME', 'Token expiry (7 days from issue)'],
  ['created_at', 'DATETIME', 'Issue time'],
];
tableRow(['Column', 'Type', 'Purpose'], fw, true);
rtFields.forEach(r => tableRow(r, fw, false));
doc.moveDown(0.5);

h3('login_attempts  |  password_history');
body('login_attempts: user_id, attempt_count, last_attempt_at. Tracks failed logins; >=5 triggers account lock.\npassword_history: user_id, password_hash, created_at. Keeps last 5 hashes per user to prevent reuse.');
doc.moveDown(0.5);

h2('customer-service  (insurepro_customer database)');
const custFields = [
  ['customer_id (PK)', 'BIGINT', 'Customer-service identity (separate from userId)'],
  ['user_id', 'BIGINT NULLABLE', 'Links to iam-service userId (null if agent-created and unregistered)'],
  ['full_name', 'VARCHAR(100)', 'Customer full name'],
  ['date_of_birth', 'DATE', 'Used in risk scoring'],
  ['gender', 'ENUM', 'MALE / FEMALE / OTHER'],
  ['national_id', 'VARCHAR(50) UNIQUE', 'Passport / Aadhaar / PAN'],
  ['email', 'VARCHAR(100) UNIQUE', 'Contact email'],
  ['phone', 'VARCHAR(20) UNIQUE', 'Mobile number'],
  ['address / city / state / pincode / country', 'VARCHAR', 'Mailing address fields'],
  ['kyc_status', 'ENUM', 'PENDING / IN_PROGRESS / VERIFIED / REJECTED / EXPIRED'],
  ['created_by', 'BIGINT NULLABLE', 'userId of the agent who created this record (null=self-registered)'],
  ['deleted', 'BOOLEAN', 'Soft-delete flag'],
  ['created_at / updated_at', 'DATETIME', 'Audit timestamps'],
];
tableRow(['Column', 'Type', 'Purpose'], fw, true);
custFields.forEach(r => tableRow(r, fw, false));
doc.moveDown(0.5);

h3('kyc_records table');
body('Stores individual KYC document submission records: customer_id (FK), document_type, document_number, verified_by (userId of verifying agent), verified_at, expiry_date, status.');

h2('policy-service  (insurepro_policy database)');
const polFields = [
  ['policy_id (PK)', 'BIGINT', 'Policy identity'],
  ['policy_number', 'VARCHAR(50) UNIQUE', 'Human-readable ref: POL-LIFE-2025-0000001'],
  ['customer_id', 'BIGINT', 'customer-service customerId (no FK — cross-service)'],
  ['policy_type_id (FK)', 'BIGINT', 'References policy_types.type_id'],
  ['coverage_amount', 'DECIMAL(15,2)', 'Maximum payout limit'],
  ['premium_amount', 'DECIMAL(12,2)', 'Annual premium'],
  ['start_date / end_date', 'DATE', 'Coverage period'],
  ['status', 'ENUM', 'DRAFT / PENDING_UNDERWRITING / ACTIVE / EXPIRED / CANCELLED / SUSPENDED / LAPSED'],
  ['nominee_name / nominee_relation', 'VARCHAR', 'Beneficiary details'],
  ['agent_id', 'BIGINT NULLABLE', 'userId of creating agent'],
  ['cancellation_reason', 'TEXT NULLABLE', 'Set on CANCELLED'],
  ['activated_at', 'DATETIME NULLABLE', 'When status became ACTIVE'],
  ['deleted', 'BOOLEAN', 'Soft-delete flag'],
];
tableRow(['Column', 'Type', 'Purpose'], fw, true);
polFields.forEach(r => tableRow(r, fw, false));
doc.moveDown(0.5);

h3('policy_types table  (seed data)');
body('type_id, name (e.g. "Term Life", "Health Insurance"), base_premium_rate (multiplier), requires_underwriting (boolean), description. Populated at startup; not user-editable.');

h3('policy_endorsements table');
body('endorsement_id, policy_id (FK), change_type (COVERAGE_CHANGE/NOMINEE_CHANGE/ADDRESS_CHANGE), previous_value (JSON TEXT), new_value (JSON TEXT), reason, effective_date, requested_by (userId).');

h2('claims-service  (insurepro_claims database)');
const clmFields = [
  ['claim_id (PK)', 'BIGINT', 'Claim identity'],
  ['claim_number', 'VARCHAR(30) UNIQUE', 'Human-readable: CLM-202505-0000001'],
  ['policy_id', 'BIGINT', 'policy-service policyId (cross-service ref)'],
  ['customer_id', 'BIGINT', 'customer-service customerId'],
  ['submitted_by', 'BIGINT', 'iam-service userId of submitter'],
  ['claim_type', 'ENUM', 'MEDICAL / ACCIDENT / THEFT / PROPERTY_DAMAGE / DEATH / TRAVEL'],
  ['incident_date', 'DATE', 'When the insured event occurred'],
  ['claim_date', 'DATETIME', 'When the claim was filed'],
  ['amount_requested', 'DECIMAL(12,2)', 'Amount claimed'],
  ['amount_approved', 'DECIMAL(12,2) NULLABLE', 'Approved by adjuster'],
  ['deductible_amount', 'DECIMAL(12,2) NULLABLE', 'Deductible applied'],
  ['description', 'TEXT', 'Incident description (min 20 chars)'],
  ['status', 'ENUM', 'SUBMITTED / UNDER_REVIEW / PENDING_DOCS / APPROVED / PARTIALLY_APPROVED / REJECTED / SETTLED / DISPUTED / CLOSED'],
  ['remarks', 'TEXT NULLABLE', 'Adjuster decision notes'],
  ['assigned_adjuster_id', 'BIGINT NULLABLE', 'userId of assigned adjuster'],
];
tableRow(['Column', 'Type', 'Purpose'], fw, true);
clmFields.forEach(r => tableRow(r, fw, false));
doc.moveDown(0.5);

h3('settlements  |  claim_notes  |  claim_disputes');
body('settlements: settlement_id, claim_id (FK), amount_approved, deductible_applied, net_payout, settlement_date, payment_mode, status (PENDING/PAID), remarks.\n\nclaim_notes: note_id, claim_id (FK), note_text, internal (boolean), created_by, created_at.\n\nclaim_disputes: dispute_id, claim_id (FK), reason, status (OPEN/UNDER_REVIEW/RESOLVED/ESCALATED), raised_by, raised_at.');

h2('premium-payment-service  (insurepro_payment database)');
const invFields = [
  ['invoice_id (PK)', 'BIGINT', 'Invoice identity'],
  ['invoice_number', 'VARCHAR(30) UNIQUE', 'INV-202505-000001'],
  ['policy_id', 'BIGINT', 'Cross-service policy reference'],
  ['customer_id', 'BIGINT', 'Cross-service customer reference'],
  ['amount', 'DECIMAL(12,2)', 'Base premium (before tax)'],
  ['tax_amount', 'DECIMAL(12,2)', '18% GST on amount'],
  ['period_start / period_end', 'DATE', 'Billing coverage period'],
  ['due_date', 'DATE', 'Payment deadline (issue date + 30 days)'],
  ['status', 'ENUM', 'ISSUED / PENDING / OVERDUE / PAID / CANCELLED'],
];
tableRow(['Column', 'Type', 'Purpose'], fw, true);
invFields.forEach(r => tableRow(r, fw, false));
doc.moveDown(0.5);

h3('payments table');
body('payment_id, invoice_id (FK), customer_id, amount, method (UPI/CARD/NETBANKING/NEFT/CHEQUE/CASH), gateway_reference (nullable UTR), status (SUCCESS/FAILED/REFUNDED), payment_date, created_at.');

h2('Other Service Entities (Summary)');
const otherEnts = [
  ['document-service', 'Document', 'document_id, file_name, original_name, mime_type, file_size, checksum (SHA-256), entity_type, entity_id, document_type, access_level, storage_path, uploaded_by, retention_date, deleted'],
  ['underwriting-service', 'UnderwritingRequest', 'request_id, policy_id, customer_id, risk_score, status (PENDING/IN_REVIEW/REFERRED/AUTO_APPROVED/AUTO_DECLINED/APPROVED/DECLINED), decision_remarks, decided_by, decided_at'],
  ['underwriting-service', 'RiskRule', 'rule_id, rule_name, threshold_min, threshold_max, weight, policy_type (nullable), active'],
  ['notification-service', 'Notification', 'notification_id, user_id, message, category, status (PENDING/SENT/READ/FAILED), channel, created_at'],
  ['audit-service', 'AuditLog', 'audit_id, user_id, username, action, resource_type, resource_id, service_name, ip_address, timestamp, details (JSON)'],
  ['analytics-service', 'KPIReport', 'report_id, kpi_name, report_type (MONTHLY/QUARTERLY/ANNUAL), scope (JSON), metrics (JSON), period_start, period_end, generated_at, generated_by'],
];
const ow = [110, 110, W - 220];
tableRow(['Service', 'Entity', 'Key Fields'], ow, true);
otherEnts.forEach(r => tableRow(r, ow, false));
doc.moveDown(1);

h2('Entity Relationships (Plain English)');
bullet([
  'One USER (iam-service) can have ONE CUSTOMER profile (customer-service) — linked by userId field.',
  'One CUSTOMER can have MANY POLICIES — linked by customerId on Policy.',
  'One POLICY can have MANY CLAIMS — linked by policyId on Claim.',
  'One CLAIM has at most ONE SETTLEMENT — linked by claimId on Settlement.',
  'One CLAIM can have MANY NOTES — linked by claimId on ClaimNote.',
  'One CLAIM can have at most ONE DISPUTE — linked by claimId on ClaimDispute.',
  'One POLICY can have MANY ENDORSEMENTS — linked by policyId on PolicyEndorsement.',
  'One POLICY can have MANY INVOICES (one per billing period) — linked by policyId on Invoice.',
  'One INVOICE can have MANY PAYMENT attempts — linked by invoiceId on Payment.',
  'One USER can have MANY NOTIFICATIONS — linked by userId on Notification.',
  'Cross-service references use plain BIGINT columns (not JPA foreign keys) because each service has its own database — referential integrity is enforced at the application layer via Feign validation calls.',
]);

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — FRONTEND-BACKEND WIRING
// ════════════════════════════════════════════════════════════════════════════
chapterPage('4', 'Frontend–Backend Wiring', 'How the React app finds and communicates with the backend');

h2('API Base URL & HTTP Client');
body('File: InsurePro-Frontend/src/api.js');
code('export const BASE_URL = "http://localhost:9090";  // API Gateway port\n\nconst api = {\n  get token()  { return localStorage.getItem("ip_access"); },\n\n  headers(extra = {}) {\n    const h = { "Content-Type": "application/json", ...extra };\n    if (this.token) h["Authorization"] = `Bearer ${this.token}`;\n    return h;\n  },\n\n  async req(method, path, body) {\n    const url = `${BASE_URL}${path}`;\n    let res = await fetch(url, { method, headers: this.headers() });\n\n    // Silent refresh on 401 (access token expired)\n    if (res.status === 401 && !path.startsWith("/api/v1/auth")) {\n      const ok = await this.tryRefresh();\n      if (ok) res = await fetch(url, { method, headers: this.headers() });\n    }\n    const data = res.headers.get("content-type")?.includes("json")\n      ? await res.json() : await res.text();\n    if (!res.ok) throw { status: res.status, data };\n    return data;\n  },\n  get:    (p)    => api.req("GET",    p),\n  post:   (p, b) => api.req("POST",   p, b),\n  patch:  (p, b) => api.req("PATCH",  p, b),\n  delete: (p)    => api.req("DELETE", p),\n};');

infoBox('Every API call in the app uses this single api object. It automatically adds the Authorization: Bearer <token> header from localStorage. If a 401 is received (token expired), it silently tries to refresh the token and retries once before propagating the error.', 'amber');

h2('CORS Configuration');
body('CORS (Cross-Origin Resource Sharing) is the browser\'s security mechanism that blocks JavaScript from calling a different domain/port unless the server explicitly allows it. The React frontend runs on http://localhost:5173 (Vite dev server); the API Gateway runs on http://localhost:9090 — different ports = different origin.');
body('The API Gateway\'s application.yml configures a global CORS policy:');
code('spring:\n  cloud:\n    gateway:\n      globalcors:\n        cors-configurations:\n          "[/**]":\n            allowedOrigins:\n              - "http://localhost:3000"\n              - "http://localhost:5173"\n              - "http://localhost:4200"\n            allowedMethods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]\n            allowedHeaders: ["*"]\n            allowCredentials: true\n            maxAge: 3600');
body('The allowedOrigins list covers React\'s default Vite port (5173), Create React App port (3000), and Angular CLI port (4200). OPTIONS preflight requests are allowed so the browser can confirm CORS before sending the actual request.');

h2('API Gateway Request Routing');
body('All traffic enters the API Gateway on port 9090. The gateway strips the first path segment and forwards to the discovered service via Eureka:');
const routes = [
  ['/api/v1/auth/**', 'iam-service (port 8081)'],
  ['/api/v1/customers/**', 'customer-service (port 8082)'],
  ['/api/v1/policies/**', 'policy-service (port 8083)'],
  ['/api/v1/claims/**', 'claims-service (port 8084)'],
  ['/api/v1/payments/**  /api/v1/invoices/**', 'premium-payment-service (port 8085)'],
  ['/api/v1/notifications/**', 'notification-service (port 8086)'],
  ['/api/v1/audit-logs/**', 'audit-compliance-service (port 8087)'],
  ['/api/v1/analytics/**', 'analytics-service (port 8088)'],
  ['/api/v1/underwriting/**', 'underwriting-service (port 8089)'],
  ['/api/v1/documents/**', 'document-service (port 8090)'],
];
tableRow(['URL Pattern', 'Routes To'], [230, W - 230], true);
routes.forEach(r => tableRow(r, [230, W - 230], false));
doc.moveDown(0.5);
body('The Gateway also validates the JWT on every request (except /auth/login, /auth/register, /auth/refresh which are public). Invalid or missing tokens receive a 401 before the request even reaches the target service.');

h2('Service-to-Service Communication (Feign)');
body('Microservices that need data from other microservices use Spring Cloud OpenFeign clients. They declare an interface and Feign generates the HTTP client automatically — service names are resolved via Eureka.');
code('// In policy-service — calls customer-service\n@FeignClient(name = "customer-service")\npublic interface CustomerClient {\n    @GetMapping("/api/v1/customers/{id}")\n    CustomerDto getCustomer(@PathVariable Long id);\n}\n\n// Usage in PolicyServiceImpl:\nCustomerDto customer = customerClient.getCustomer(customerId);\nif (!customer.getKycStatus().equals("VERIFIED")) {\n    throw new PolicyCreationException("KYC not verified");\n}');

// ════════════════════════════════════════════════════════════════════════════
// SECTION 5 — SECURITY
// ════════════════════════════════════════════════════════════════════════════
chapterPage('5', 'Security Architecture', 'Authentication, authorisation, and every security layer in the system');

h2('JWT Authentication Flow — Step by Step');
bullet([
  'Step 1 — Login: User POSTs credentials to /api/v1/auth/login. IAM service validates and returns accessToken (30 min) + refreshToken (7 days).',
  'Step 2 — Storage: Frontend stores both tokens in localStorage under ip_access and ip_refresh.',
  'Step 3 — Every Request: api.js reads ip_access and adds it as "Authorization: Bearer <token>" header.',
  'Step 4 — Gateway Validation: API Gateway\'s JwtAuthenticationFilter intercepts every non-public request. It calls JwtService.validateToken() which verifies the HS256 signature using the shared secret, checks expiry (exp claim), and checks the Redis blacklist (tokens invalidated by logout).',
  'Step 5 — Forwarding: If valid, the gateway forwards the request with the original Authorization header. The receiving microservice also validates the JWT (each service has its own Spring Security + JwtAuthenticationFilter).',
  'Step 6 — Role Check: @PreAuthorize("hasRole(\'ADMIN\')") or manual hasRole() calls in the service layer check the roles claim extracted from the JWT.',
  'Step 7 — Refresh: On 401, the frontend silently calls /auth/refresh. The IAM service rotates the refresh token and returns a new access token.',
  'Step 8 — Logout: Frontend POSTs to /api/v1/auth/logout. IAM service adds the current accessToken to the Redis blacklist (TTL = remaining token lifetime). All subsequent requests with that token return 401 even if not expired.',
]);

h2('Password Security Policies');
const pwPolicies = [
  ['Minimum length', '12 characters'],
  ['Complexity', 'Must contain uppercase, lowercase, digit, and special character'],
  ['Enforcement', '@StrongPassword custom JSR-303 annotation + validator'],
  ['Storage', 'BCrypt hashed (cost factor 10) — never stored in plain text'],
  ['History', 'Last 5 password hashes stored; new password rejected if it matches any'],
  ['Force change', 'Admin-created accounts have forcePasswordChange=true; change is mandatory on first login'],
  ['Lockout', '5 failed login attempts within a window → account locked for 30 minutes'],
  ['Unlock', 'Admin can manually unlock via POST /api/v1/auth/users/{id}/unlock; or wait 30 min'],
];
tableRow(['Policy', 'Detail'], [180, W - 180], true);
pwPolicies.forEach(r => tableRow(r, [180, W - 180], false));
doc.moveDown(0.5);

h2('Role-Based Access Control (RBAC)');
body('Every page and every API endpoint is gated by role. The frontend hides navigation items and action buttons; the backend enforces the same rules independently — you cannot bypass the UI to call a restricted endpoint.');
const rbac = [
  ['Dashboard', 'All roles', 'Content differs per role'],
  ['Buy Insurance (Marketplace)', 'POLICYHOLDER', '—'],
  ['Policyholders list', 'ADMIN, AGENT, ADJUSTER, UNDERWRITER, COMPLIANCE', 'POLICYHOLDER sees only own profile'],
  ['Policies', 'ADMIN, AGENT, POLICYHOLDER, UNDERWRITER, ADJUSTER', '—'],
  ['Create/Cancel Policy', 'ADMIN, AGENT', '—'],
  ['Activate Policy', 'ADMIN, UNDERWRITER', '—'],
  ['Claims', 'ADMIN, AGENT, POLICYHOLDER, ADJUSTER, COMPLIANCE', '—'],
  ['Adjudicate Claim', 'ADMIN, ADJUSTER', '—'],
  ['Payments', 'ADMIN, FINANCE, AGENT, POLICYHOLDER', '—'],
  ['Refund', 'ADMIN, FINANCE', '—'],
  ['Underwriting', 'ADMIN, UNDERWRITER', '—'],
  ['Documents', 'ADMIN, AGENT, ADJUSTER, UNDERWRITER, POLICYHOLDER', '—'],
  ['Audit Logs', 'ADMIN, COMPLIANCE', '—'],
  ['Analytics', 'ADMIN, FINANCE, COMPLIANCE', '—'],
  ['User Management', 'ADMIN only', '—'],
];
const rbw = [160, 170, W - 330];
tableRow(['Feature', 'Allowed Roles', 'Note'], rbw, true);
rbac.forEach(r => tableRow(r, rbw, false));
doc.moveDown(0.5);

h2('Additional Security Measures');
bullet([
  'X-Correlation-ID header: Each request gets a UUID correlation ID that is propagated across all microservice calls — enables end-to-end request tracing in logs.',
  'Redis JWT blacklist: Logout invalidates the access token immediately (before its natural expiry) by adding it to Redis with a TTL equal to the remaining token lifetime.',
  'Refresh token hashing: Plain UUID tokens are sent to browsers; SHA-256 hashes are stored in the database — a database dump cannot be used to forge sessions.',
  'Refresh token rotation: Each use of a refresh token generates a new one and invalidates the old — limits the window of token theft.',
  'HTTPS enforced in production: application.yml production profiles set server.ssl.enabled=true (TLS certificates required via environment variables).',
  'Rate limiting: Login endpoint protected by LoginAttempt tracking — 5 failures in a window triggers a 30-minute lockout.',
  'Soft deletes: No data is physically deleted — all entities have a "deleted" flag. Deleted records are filtered from queries but preserved for audit purposes.',
]);

// ════════════════════════════════════════════════════════════════════════════
// SECTION 6 — GLOSSARY
// ════════════════════════════════════════════════════════════════════════════
chapterPage('6', 'Beginner Glossary', 'Every technical term used in this project — defined in context, not from a textbook');

const glossary = [
  // Frontend
  ['React', 'A JavaScript library for building user interfaces. InsurePro uses React 19 to build its SPA — every page, modal, and table is a React component.'],
  ['SPA (Single-Page Application)', 'A web app that loads ONE HTML file and dynamically swaps content using JavaScript. InsurePro never fully reloads the page — navigation just re-renders a different React component.'],
  ['Component', 'A reusable UI building block in React. Examples: LoginPage, Dashboard, Modal, Badge, Pagination.'],
  ['useState', 'React hook for storing a piece of data that, when changed, triggers a re-render. Used for form values, loading flags, selected items, etc.'],
  ['useEffect', 'React hook that runs a side-effect (e.g. an API call) after the component renders, optionally re-running when certain values change.'],
  ['useCallback', 'React hook that memoises a function reference so it doesn\'t get recreated on every render. Used for fetchCustomerId and refreshUnreadCount in AuthContext.'],
  ['useMemo', 'React hook that caches the result of a computation. Used in AdminDashboard to avoid regrouping claims by status on every render.'],
  ['useApi(fn, deps)', 'Custom hook in UI.jsx. Calls fn() on mount and when deps change. Returns { data, loading, error, reload }. Used on every page for data fetching.'],
  ['Context / AuthContext', 'React\'s built-in state-sharing mechanism. AuthContext wraps the entire app and makes user, login, logout, hasRole, customerId available everywhere without passing them as props.'],
  ['Props', 'Data passed from a parent component to a child component. E.g. <Modal open={true} onClose={fn}>.'],
  ['JSX', 'HTML-like syntax inside JavaScript files that React compiles into DOM calls. The .jsx file extension indicates a file uses JSX.'],
  ['Vite', 'A fast build tool and development server for React. Runs on port 5173 in development. Replaces Create React App.'],
  ['localStorage', 'Browser key-value storage that survives page refresh. Stores ip_access (JWT), ip_refresh, ip_user (user object), ip_customer_id.'],
  ['Fetch API', 'The built-in browser function for making HTTP requests. InsurePro wraps it in api.js instead of using Axios.'],
  ['Bearer token', 'HTTP authentication scheme. The client sends "Authorization: Bearer <JWT>" in the request header. The server reads and validates the token.'],
  ['multipart/form-data', 'HTTP encoding type required for file uploads. Used in DocumentsPage. Unlike JSON, it can carry binary data. The browser sets the Content-Type boundary automatically.'],
  ['Blob URL', 'A temporary browser-local URL created by URL.createObjectURL(blob) to display binary data (e.g. a PDF) without exposing the API endpoint.'],
  // Backend — Spring
  ['Spring Boot', 'A Java framework for building web applications with minimal configuration. Every InsurePro microservice is a Spring Boot 3.2 application.'],
  ['@RestController', 'Spring annotation that marks a class as an HTTP API controller. Its methods return JSON responses directly (no HTML templates).'],
  ['@Service', 'Spring annotation marking a class as a business-logic service. Injected into controllers via @Autowired or constructor injection.'],
  ['@Repository', 'Spring annotation on JPA repository interfaces. Spring auto-generates SQL queries from method names like findByUserId().'],
  ['@Transactional', 'Wraps a method in a database transaction. If any step throws an exception, all database changes in that method are rolled back.'],
  ['@PreAuthorize', 'Spring Security annotation that checks a role condition before a method runs. E.g. @PreAuthorize("hasRole(\'ADMIN\')") blocks non-admins.'],
  ['JPA / Hibernate', 'Java Persistence API + Hibernate ORM. Maps Java classes (entities) to database tables. Generates SQL automatically from entity field definitions.'],
  ['Spring Data JPA', 'Extends JPA — you declare a repository interface and Spring generates the implementation, including SQL queries derived from method names.'],
  ['Pageable / Page<T>', 'Spring Data\'s pagination mechanism. Converts page, size, sort query params into a SQL LIMIT/OFFSET/ORDER BY clause. Returns Page<T> with content[], totalElements, totalPages.'],
  ['Feign Client', 'Spring Cloud library. Lets one microservice call another over HTTP as if it were a local method call. Service names are resolved via Eureka.'],
  ['Eureka', 'Netflix service registry. Each microservice registers itself on startup. Other services discover it by name — no hardcoded host:port required.'],
  ['Spring Cloud Gateway', 'Acts as the single entry point for all HTTP traffic. Routes requests to the correct microservice by URL prefix. Also validates JWTs and handles CORS.'],
  ['Spring Cloud Config', 'Central configuration server. All microservices fetch their application.yml from the config server on startup rather than each having a local copy.'],
  ['RabbitMQ', 'A message broker. Services publish events (e.g. CLAIM_SUBMITTED) to a queue asynchronously. Consumers (audit-service, notification-service) process them independently.'],
  ['Redis', 'An in-memory key-value store. InsurePro uses it for: (1) JWT blacklist on logout, (2) caching frequently read data.'],
  ['Flyway', 'Database migration tool. SQL scripts in resources/db/migration are executed in version order on startup, keeping all environments in sync.'],
  // Auth / Security
  ['JWT (JSON Web Token)', 'A base64-encoded string in 3 parts: header.payload.signature. The payload carries sub (username), roles, userId, exp (expiry). Signed with HS256 using a shared secret.'],
  ['HS256', 'HMAC-SHA256 — the JWT signing algorithm. Uses a single shared secret key (defined in application.yml as jwt.secret) to both sign and verify tokens.'],
  ['Access Token', 'Short-lived JWT (30 minutes). Sent with every API request in the Authorization header. Stateless — the server validates the signature; no DB lookup needed.'],
  ['Refresh Token', 'Long-lived UUID (7 days). Stored as a SHA-256 hash in the database. Used only to get a new access token when the old one expires.'],
  ['BCrypt', 'A password hashing algorithm. Adds a random "salt" before hashing so the same password produces a different hash each time. Cannot be reversed.'],
  ['SHA-256', 'A one-way cryptographic hash function. Used to hash refresh tokens before DB storage so that a DB dump cannot be used to impersonate users.'],
  ['Token rotation', 'Each use of a refresh token generates a new one and invalidates the old. Limits the damage window if a refresh token is stolen.'],
  ['RBAC', 'Role-Based Access Control. Users are assigned roles; roles are mapped to permissions. InsurePro has 7 roles: ADMIN, AGENT, ADJUSTER, UNDERWRITER, COMPLIANCE, FINANCE, POLICYHOLDER.'],
  ['CORS', 'Cross-Origin Resource Sharing. Browser security rule that blocks JavaScript from calling a different origin (domain/port) unless the server sends CORS headers allowing it.'],
  // Insurance Domain
  ['Policyholder', 'The customer who owns an insurance policy and is covered by it.'],
  ['Premium', 'The amount a policyholder pays for insurance coverage (e.g. Rs 12,000/year for a health policy).'],
  ['Coverage amount', 'The maximum amount the insurer will pay out on a claim under a given policy.'],
  ['Endorsement', 'A formal amendment to an existing policy (changing coverage amount, nominee, or address) without reissuing the policy.'],
  ['KYC', 'Know Your Customer. Regulatory identity verification. InsurePro requires VERIFIED KYC before a policy can be issued.'],
  ['Claim', 'A formal request from a policyholder asking the insurer to pay for a covered loss or event.'],
  ['Adjudication', 'The process of reviewing a claim and making a decision: Approve / Partially Approve / Reject.'],
  ['Deductible', 'The portion of a claim that the policyholder pays themselves before the insurer pays the rest. Net payout = approved amount - deductible.'],
  ['Settlement', 'The final payment record created when a claim is approved, documenting approved amount, deductible, and net payout.'],
  ['Underwriting', 'The process of evaluating risk before issuing a policy. High-risk applications may be declined or offered at higher premiums.'],
  ['GST (18%)', 'Indian Goods and Services Tax applied to insurance premiums. taxAmount = premiumAmount * 0.18.'],
  ['Invoice', 'A billing document issued to a policyholder for a premium payment due. Format: INV-YYYYMM-000001.'],
];

const gw = [160, W - 160];
glossary.forEach(([term, def]) => {
  if (doc.y > doc.page.height - 70) newPage();
  tableRow([term, def], gw, false);
});

// ════════════════════════════════════════════════════════════════════════════
// PAGE NUMBERS
// ════════════════════════════════════════════════════════════════════════════
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(pages.start + i);
  if (i === 0) continue;  // skip cover
  doc.fillColor(C.grayDk).font('Helvetica').fontSize(9)
     .text(`InsurePro Documentation  ·  Page ${i + 1}`,
           ML, doc.page.height - 38, { width: W, align: 'center' });
  doc.rect(ML, doc.page.height - 44, W, 1).fill(C.border);
}

doc.end();
console.log('PDF written to:', OUT);
