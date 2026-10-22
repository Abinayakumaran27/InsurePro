// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — change to match your API Gateway port (default: 8080)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_URL = "http://localhost:9090";

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const api = {
  get token()        { return localStorage.getItem("ip_access");  },
  get refreshToken() { return localStorage.getItem("ip_refresh"); },

  headers(extra = {}) {
    const h = { "Content-Type": "application/json", ...extra };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  },

  // Silently attempt to get a new access token using the refresh token.
  // Returns true if a new token was stored, false otherwise.
  async tryRefresh() {
    const rt = this.refreshToken;
    if (!rt) return false;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return false;
      const d = await res.json();
      // Support both wrapped { data: { accessToken } } and flat { accessToken } shapes
      const access  = d?.data?.accessToken  ?? d?.accessToken;
      const refresh = d?.data?.refreshToken ?? d?.refreshToken;
      if (!access) return false;
      localStorage.setItem("ip_access",  access);
      if (refresh) localStorage.setItem("ip_refresh", refresh);
      return true;
    } catch {
      return false;
    }
  },

  async req(method, path, body, opts = {}) {
    const url = `${BASE_URL}${path}`;
    const cfg = { method, headers: this.headers(opts.headers || {}) };
    if (body !== undefined) cfg.body = JSON.stringify(body);

    let res = await fetch(url, cfg);

    // On 401, try a silent token refresh once before giving up
    if (res.status === 401 && !path.startsWith("/api/v1/auth")) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        cfg.headers = this.headers(opts.headers || {});
        res = await fetch(url, cfg);
      }
    }

    const ct   = res.headers.get("content-type") || "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) throw { status: res.status, data };
    return data;
  },

  get:    (p, o)    => api.req("GET",    p, undefined, o),
  post:   (p, b, o) => api.req("POST",   p, b, o),
  put:    (p, b, o) => api.req("PUT",    p, b, o),
  patch:  (p, b, o) => api.req("PATCH",  p, b, o),
  delete: (p, o)    => api.req("DELETE", p, undefined, o),
};

export default api;
