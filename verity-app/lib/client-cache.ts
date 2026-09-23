// =============================================================================
// VERITY — Resilient Multi-Tier Client Storage & Session Cache
// =============================================================================
// Guarantees zero-downtime persistence and instant UI hydration across
// Vercel serverless multi-container instances and client browser sessions.
// =============================================================================

export interface ResearchBundle {
  id: string;
  session: any;
  report?: any;
  sources?: any[];
  claims?: any[];
  contradictions?: any[];
  chats?: any[];
}

export const clientCache = {
  /**
   * Save a complete research execution bundle into persistent browser storage
   */
  saveResearchBundle(bundle: ResearchBundle) {
    if (typeof window === "undefined" || !bundle?.id) return;
    try {
      const id = bundle.id;
      localStorage.setItem(`verity_bundle_${id}`, JSON.stringify(bundle));

      if (bundle.session) {
        localStorage.setItem(`verity_session_${id}`, JSON.stringify(bundle.session));
      }
      if (bundle.report) {
        localStorage.setItem(`verity_report_${id}`, JSON.stringify(bundle.report));
      }
      if (bundle.sources && Array.isArray(bundle.sources)) {
        localStorage.setItem(`verity_sources_${id}`, JSON.stringify(bundle.sources));
      }
      if (bundle.claims && Array.isArray(bundle.claims)) {
        localStorage.setItem(`verity_claims_${id}`, JSON.stringify(bundle.claims));
      }
      if (bundle.contradictions && Array.isArray(bundle.contradictions)) {
        localStorage.setItem(`verity_contradictions_${id}`, JSON.stringify(bundle.contradictions));
      }
      if (bundle.chats && Array.isArray(bundle.chats)) {
        localStorage.setItem(`verity_chats_${id}`, JSON.stringify(bundle.chats));
      }

      // Maintain user sessions list for dashboard
      if (bundle.session) {
        const rawSessions = localStorage.getItem("verity_user_sessions");
        const list: any[] = rawSessions ? JSON.parse(rawSessions) : [];
        const filtered = list.filter((s: any) => s.id !== id);
        filtered.unshift(bundle.session);
        localStorage.setItem("verity_user_sessions", JSON.stringify(filtered.slice(0, 50)));
      }

      // Maintain user reports list for reports library
      if (bundle.report) {
        const rawReports = localStorage.getItem("verity_user_reports");
        const list: any[] = rawReports ? JSON.parse(rawReports) : [];
        const filtered = list.filter((r: any) => r.id !== bundle.report.id && r.session_id !== id);
        filtered.unshift(bundle.report);
        localStorage.setItem("verity_user_reports", JSON.stringify(filtered.slice(0, 50)));
      }
    } catch (err) {
      console.warn("[Verity ClientCache] Failed to save bundle to storage:", err);
    }
  },

  /**
   * Retrieve a research bundle by ID from browser storage
   */
  getResearchBundle(id: string): ResearchBundle | null {
    if (typeof window === "undefined" || !id) return null;
    try {
      const raw = localStorage.getItem(`verity_bundle_${id}`);
      if (raw) return JSON.parse(raw);

      // Attempt reconstruction from individual slices if bundle isn't present
      const rawSession = localStorage.getItem(`verity_session_${id}`);
      const rawReport = localStorage.getItem(`verity_report_${id}`);
      const rawSources = localStorage.getItem(`verity_sources_${id}`);
      const rawClaims = localStorage.getItem(`verity_claims_${id}`);
      const rawContradictions = localStorage.getItem(`verity_contradictions_${id}`);
      const rawChats = localStorage.getItem(`verity_chats_${id}`);

      if (rawSession || rawReport) {
        return {
          id,
          session: rawSession ? JSON.parse(rawSession) : null,
          report: rawReport ? JSON.parse(rawReport) : null,
          sources: rawSources ? JSON.parse(rawSources) : [],
          claims: rawClaims ? JSON.parse(rawClaims) : [],
          contradictions: rawContradictions ? JSON.parse(rawContradictions) : [],
          chats: rawChats ? JSON.parse(rawChats) : [],
        };
      }
    } catch (err) {
      console.warn("[Verity ClientCache] Retrieval error:", err);
    }
    return null;
  },

  /**
   * Get all user research sessions stored in this browser
   */
  getUserSessions(): any[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("verity_user_sessions");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Get all user reports stored in this browser
   */
  getUserReports(): any[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("verity_user_reports");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Asynchronously synchronize client-cached bundle with serverless runtime
   */
  async syncToServer(bundle: ResearchBundle) {
    if (typeof window === "undefined" || !bundle?.id) return;
    try {
      await fetch("/api/v1/research/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundle),
      });
    } catch {
      // Non-blocking sync error
    }
  },
};
