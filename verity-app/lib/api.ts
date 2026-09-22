// =============================================================================
// VERITY — Resilient Multi-Environment API Client
// =============================================================================
// Automatically adapts between local FastAPI backend and Vercel Next.js
// serverless route handlers with automatic zero-downtime failover.
// =============================================================================

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // On local machine dev, use NEXT_PUBLIC_API_URL if configured
    if (isLocalhost && process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    }
    // On Vercel or any remote production domain, always use same-origin relative URLs ("")
    // to avoid Mixed-Content (HTTPS -> HTTP) and Cross-Origin network blocks.
    return "";
  }

  // Server-side (Node.js runtime)
  if (process.env.BACKEND_API_URL) {
    return process.env.BACKEND_API_URL.replace(/\/$/, "");
  }
  return "";
}

class VerityAPI {
  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, token, headers: extraHeaders } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const primaryBaseUrl = getBaseUrl();
    let response: Response;

    try {
      response = await fetch(`${primaryBaseUrl}${path}`, config);
    } catch (networkErr) {
      // If external primary baseUrl fails (e.g. port 8000 down or mixed content),
      // seamlessly fall back to Next.js serverless route handler on same origin
      if (primaryBaseUrl !== "") {
        console.warn(
          `[VerityAPI] Primary backend at ${primaryBaseUrl}${path} unavailable; failing over to native serverless handler:`,
          networkErr
        );
        response = await fetch(path, config);
      } else {
        throw networkErr;
      }
    }

    // If external backend returned 502/503/504 or 404, also attempt serverless fallback
    if (!response.ok && primaryBaseUrl !== "" && (response.status >= 500 || response.status === 404)) {
      try {
        const fallbackResp = await fetch(path, config);
        if (fallbackResp.ok) {
          return fallbackResp.json();
        }
      } catch {
        // Fallback also failed, proceed with original response error
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async signup(email: string, password: string, fullName: string) {
    return this.request("/api/v1/auth/signup", {
      method: "POST",
      body: { email, password, full_name: fullName },
    });
  }

  async getMe(token: string) {
    return this.request("/api/v1/auth/me", { token });
  }

  // Projects
  async getProjects(token: string) {
    return this.request("/api/v1/projects", { token });
  }

  async createProject(token: string, name: string, description?: string) {
    return this.request("/api/v1/projects", {
      method: "POST",
      token,
      body: { name, description },
    });
  }

  async getProject(token: string, id: string) {
    return this.request(`/api/v1/projects/${id}`, { token });
  }

  async deleteProject(token: string, id: string) {
    return this.request(`/api/v1/projects/${id}`, { method: "DELETE", token });
  }

  // Research
  async createResearch(token: string, projectId: string, question: string, mode: string) {
    return this.request("/api/v1/research", {
      method: "POST",
      token,
      body: { project_id: projectId, question, mode },
    });
  }

  async getResearch(token: string, id: string) {
    return this.request(`/api/v1/research/${id}`, { token });
  }

  async listResearch(token: string, projectId?: string) {
    const query = projectId ? `?project_id=${projectId}` : "";
    return this.request(`/api/v1/research${query}`, { token });
  }

  async getResearchSources(token: string, id: string) {
    return this.request(`/api/v1/research/${id}/sources`, { token });
  }

  async getResearchEvidence(token: string, id: string) {
    return this.request(`/api/v1/research/${id}/evidence`, { token });
  }

  async getResearchReport(token: string, id: string) {
    return this.request(`/api/v1/research/${id}/report`, { token });
  }

  async getResearchContradictions(token: string, id: string) {
    return this.request(`/api/v1/research/${id}/contradictions`, { token });
  }

  // Reports
  async getReports(token: string) {
    return this.request("/api/v1/reports", { token });
  }

  async getReport(token: string, id: string) {
    return this.request(`/api/v1/reports/${id}`, { token });
  }

  async exportReport(token: string, id: string, format: string) {
    return this.request(`/api/v1/reports/${id}/export`, {
      method: "POST",
      token,
      body: { format },
    });
  }

  // Admin
  async getAdminStats(token: string) {
    return this.request("/api/v1/admin/stats", { token });
  }

  async getAdminModelRuns(token: string) {
    return this.request("/api/v1/admin/model-runs", { token });
  }

  async getAdminAuditLogs(token: string) {
    return this.request("/api/v1/admin/audit-logs", { token });
  }

  // Health
  async healthCheck() {
    return this.request("/api/v1/health");
  }
}

export const api = new VerityAPI();
