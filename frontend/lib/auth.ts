const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3000";

const TOKEN_KEY = "codex_token";
const USER_KEY = "codex_user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "supplier" | "admin";
};

type LoginResponse = {
  user: AuthUser;
  token: string;
};

type MeResponse = {
  user: AuthUser;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function storeAuth(user: AuthUser, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json()) as Partial<LoginResponse> & { message?: string };
  if (!response.ok || !payload.user || !payload.token) {
    throw new Error(payload.message || "Login failed");
  }

  storeAuth(payload.user, payload.token);
  return payload.user;
}

export async function getMe(): Promise<AuthUser> {
  const token = getStoredToken();
  if (!token) throw new Error("No auth token");

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as Partial<MeResponse> & { message?: string };
  if (!response.ok || !payload.user) {
    throw new Error(payload.message || "Failed to load user");
  }

  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload.user;
}
