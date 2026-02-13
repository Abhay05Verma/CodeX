const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3000";

type ApiOptions = RequestInit & {
  token?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: { message?: string };
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    cache: "no-store",
  });

  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(envelope.error?.message || envelope.message || "Request failed");
    }
    return (envelope.data ?? ({} as T)) as T;
  }

  return payload as T;
}

export type HealthResponse = {
  status: string;
  uptime: number;
  timestamp: string;
};

export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  category: string;
};

export type ProductsResponse = {
  products: Product[];
  message?: string;
};

export type BuyerAnalytics = {
  totalOrders: number;
  monthOrders: number;
  totalSpent: number;
  recentOrders: Array<{
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
};

export type SupplierAnalytics = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  monthRevenue: number;
};

export const api = {
  getHealth: () => request<HealthResponse>("/health"),
  getProducts: () => request<ProductsResponse>("/api/products"),
  getBuyerAnalytics: (token: string) =>
    request<BuyerAnalytics>("/api/analytics/buyer-summary", { token }),
  getSupplierAnalytics: (token: string) =>
    request<SupplierAnalytics>("/api/analytics/supplier-summary", { token }),
};
