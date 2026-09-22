// =============================================================================
// VERITY — Universal Authentication & Session Manager
// =============================================================================
// Handles user sessions, signup, login, and cookie-based middleware compatibility.
// =============================================================================

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "researcher" | "admin";
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

const SESSION_COOKIE_NAME = "verity_session";
const USER_STORAGE_KEY = "verity_auth_user";
const USERS_REGISTRY_KEY = "verity_registered_users";

function setCookie(name: string, value: string, days: number = 30) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

// Get registered users list from local storage
function getStoredUsers(): Record<string, { passwordHash: string; user: AuthUser }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, { passwordHash: string; user: AuthUser }>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export const auth = {
  /**
   * Get current authenticated user
   */
  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback to cookie inspection
    }

    const token = getCookie(SESSION_COOKIE_NAME);
    if (token) {
      return {
        id: "usr-" + token.slice(-8),
        email: "researcher@verity.ai",
        full_name: "Researcher",
        role: "researcher",
        created_at: new Date().toISOString(),
      };
    }
    return null;
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const cookie = getCookie(SESSION_COOKIE_NAME);
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return Boolean(cookie || stored);
  },

  /**
   * Register a new user account and log in immediately
   */
  async signUp(fullName: string, email: string, password: string):Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim() || cleanEmail.split("@")[0] || "Researcher";

    if (!cleanEmail || !password || password.length < 6) {
      throw new Error("Please provide a valid email and password (minimum 6 characters).");
    }

    const users = getStoredUsers();
    
    // Create new user profile
    const newUser: AuthUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 10),
      email: cleanEmail,
      full_name: cleanName,
      role: "researcher",
      created_at: new Date().toISOString(),
    };

    // Store in registered users registry
    users[cleanEmail] = {
      passwordHash: password, // For local dev/demo verification
      user: newUser,
    };
    saveStoredUsers(users);

    const token = "vrt_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const session: AuthSession = {
      access_token: token,
      token_type: "bearer",
      user: newUser,
    };

    // Save session cookie & local storage
    setCookie(SESSION_COOKIE_NAME, token, 30);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

    return session;
  },

  /**
   * Sign in an existing user or authenticate with demo account
   */
  async signIn(email: string, password: string): Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error("Please enter both email and password.");
    }

    const users = getStoredUsers();
    let user: AuthUser;

    if (users[cleanEmail]) {
      // Check password if previously registered
      if (users[cleanEmail].passwordHash && users[cleanEmail].passwordHash !== password) {
        throw new Error("Incorrect password. Please verify and try again.");
      }
      user = users[cleanEmail].user;
    } else {
      // If user isn't yet registered, register on first valid login seamlessly
      user = {
        id: "usr-" + Math.random().toString(36).substring(2, 10),
        email: cleanEmail,
        full_name: cleanEmail.split("@")[0].replace(/[._-]/g, " ") || "Researcher",
        role: "researcher",
        created_at: new Date().toISOString(),
      };
      users[cleanEmail] = { passwordHash: password, user };
      saveStoredUsers(users);
    }

    const token = "vrt_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const session: AuthSession = {
      access_token: token,
      token_type: "bearer",
      user,
    };

    // Save session cookie & local storage
    setCookie(SESSION_COOKIE_NAME, token, 30);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    return session;
  },

  /**
   * Sign out current user
   */
  signOut() {
    deleteCookie(SESSION_COOKIE_NAME);
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem("verity-admin-auth");
    }
  },
};
