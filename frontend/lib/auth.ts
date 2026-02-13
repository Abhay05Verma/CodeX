const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3000");

const TOKEN_KEY = "codex_token";
const USER_KEY = "codex_user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "supplier" | "customer" | "admin";
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: "buyer" | "supplier" | "customer";
  phone?: string;
  businessName?: string;
  gstin?: string;
};

type LoginResponse = {
  user: AuthUser;
  token: string;
};

type MeResponse = {
  user: AuthUser;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: { message?: string };
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
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const raw = (await response.json()) as
    | (Partial<LoginResponse> & { message?: string; error?: { message?: string } })
    | ApiEnvelope<LoginResponse>;
  const payload =
    "success" in raw
      ? (raw.data as Partial<LoginResponse> | undefined)
      : (raw as Partial<LoginResponse>);
  const message =
    ("success" in raw ? raw.error?.message || raw.message : raw.error?.message || raw.message) ||
    "Login failed";
  if (!response.ok || !payload?.user || !payload?.token) {
    throw new Error(message);
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

  const raw = (await response.json()) as
    | (Partial<MeResponse> & { message?: string; error?: { message?: string } })
    | ApiEnvelope<MeResponse>;
  const payload =
    "success" in raw
      ? (raw.data as Partial<MeResponse> | undefined)
      : (raw as Partial<MeResponse>);
  const message =
    ("success" in raw ? raw.error?.message || raw.message : raw.error?.message || raw.message) ||
    "Failed to load user";
  if (!response.ok || !payload?.user) {
    throw new Error(message);
  }

  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  localStorage.setItem("user", JSON.stringify(payload.user));
  return payload.user;
}

export async function register(input: RegisterPayload): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const raw = (await response.json()) as
    | (Partial<LoginResponse> & { message?: string; error?: { message?: string } })
    | ApiEnvelope<LoginResponse>;
  const payload =
    "success" in raw
      ? (raw.data as Partial<LoginResponse> | undefined)
      : (raw as Partial<LoginResponse>);
  const message =
    ("success" in raw ? raw.error?.message || raw.message : raw.error?.message || raw.message) ||
    "Registration failed";

  if (!response.ok || !payload?.user || !payload?.token) {
    throw new Error(message);
  }

  storeAuth(payload.user, payload.token);
  return payload.user;
}
