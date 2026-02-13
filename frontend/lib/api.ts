const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3000");

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
  image?: string;
  status?: string;
  supplier?: string | { _id: string; name?: string; email?: string };
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
  categoryBreakdown?: Array<{ _id: string; total: number; count: number }>;
};

export type SupplierAnalytics = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  thisMonthOrders?: number;
  totalRevenue?: number;
  monthRevenue: number;
  recentOrders?: Order[];
  topProducts?: Array<{ _id: string; name: string; totalSold: number; totalRevenue: number }>;
};

export type Order = {
  _id: string;
  buyer?: { _id: string; name?: string; email?: string } | string;
  supplier?: { _id: string; name?: string; email?: string } | string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  items: Array<{
    product: Product | string;
    quantity: number;
    price: number;
    total: number;
  }>;
};

export type ProductsQuery = {
  q?: string;
  category?: string;
  status?: string;
  supplier?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  page?: number | string;
  limit?: number | string;
  sort?: "latest" | "price_asc" | "price_desc";
  vendorOnly?: boolean | string;
  supplierOnly?: boolean | string;
};

export const api = {
  getHealth: () => request<HealthResponse>("/health"),
  getProducts: (query?: ProductsQuery) => {
    const params = query ? new URLSearchParams(query as Record<string, string>).toString() : "";
    return request<ProductsResponse & { meta?: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/products${params ? `?${params}` : ""}`
    );
  },
  getMyProducts: (token: string) =>
    request<{ products: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/api/products/my-products",
      { token }
    ),
  createProduct: (
    token: string,
    payload: {
      name: string;
      description: string;
      price: number;
      stock: number;
      category: string;
      unit: string;
      status?: string;
      image?: string;
    }
  ) => request<{ product: Product }>("/api/products", { token, method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (
    token: string,
    id: string,
    payload: {
      name: string;
      description: string;
      price: number;
      stock: number;
      category: string;
      unit: string;
      status?: string;
      image?: string;
    }
  ) => request<{ product: Product }>(`/api/products/${id}`, { token, method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (token: string, id: string) =>
    request<Record<string, never>>(`/api/products/${id}`, { token, method: "DELETE" }),
  getMyOrders: (token: string) => request<{ orders: Order[] }>("/api/orders/my-orders", { token }),
  getSupplierOrders: (token: string) => request<{ orders: Order[] }>("/api/orders/supplier-orders", { token }),
  createOrder: (
    token: string,
    payload: {
      supplierId: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
    }
  ) => request<{ order: Order }>("/api/orders", { token, method: "POST", body: JSON.stringify(payload) }),
  updateOrderStatus: (token: string, orderId: string, status: string) =>
    request<{ order: Order }>(`/api/orders/${orderId}/status`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getBuyerAnalytics: (token: string) =>
    request<BuyerAnalytics>("/api/analytics/buyer-summary", { token }),
  getSupplierAnalytics: (token: string) =>
    request<SupplierAnalytics>("/api/analytics/supplier-summary", { token }),

  // Customer (vendors = suppliers in CodeX)
  getCustomerProfile: (token: string) =>
    request<{ customer: CustomerProfile }>("/api/customer/me", { token }),
  updateCustomerProfile: (
    token: string,
    payload: { isLendingActive?: boolean; totalLentAmount?: number; impactBadges?: string[] }
  ) => request<{ customer: CustomerProfile }>("/api/customer/me", { token, method: "PUT", body: JSON.stringify(payload) }),
  getCustomerCart: (token: string) => request<{ cart: CustomerCartVendor[] }>("/api/customer/cart", { token }),
  updateCustomerCart: (token: string, cart: CustomerCartVendor[]) =>
    request<{ cart: CustomerCartVendor[] }>("/api/customer/cart", { token, method: "PUT", body: JSON.stringify({ cart }) }),
  getCustomerFavorites: (token: string) =>
    request<{ favorites: Array<{ _id: string; name?: string; email?: string }> }>("/api/customer/favorites", { token }),
  addCustomerFavorite: (token: string, vendorId: string) =>
    request<{ favorites: Array<{ _id: string; name?: string; email?: string }> }>(
      `/api/customer/favorites/${vendorId}`,
      { token, method: "POST" }
    ),
  removeCustomerFavorite: (token: string, vendorId: string) =>
    request<{ favorites: Array<{ _id: string; name?: string; email?: string }> }>(
      `/api/customer/favorites/${vendorId}`,
      { token, method: "DELETE" }
    ),

  // Loan from Customer
  getLoanProviders: (token: string) =>
    request<{ providers: LoanProvider[] }>("/api/loan-requests/providers", { token }),
  sendLoanRequest: (token: string, customerId: string) =>
    request<{ request: LoanRequest }>("/api/loan-requests", {
      token,
      method: "POST",
      body: JSON.stringify({ customerId }),
    }),
  getVendorLoanRequests: (token: string) =>
    request<{ requests: LoanRequest[] }>("/api/loan-requests/vendor", { token }),
  getCustomerLoanRequests: (token: string) =>
    request<{ requests: LoanRequest[] }>("/api/loan-requests/customer", { token }),
  respondToLoanRequest: (token: string, requestId: string, status: "accepted" | "rejected") =>
    request<{ request: LoanRequest }>(`/api/loan-requests/${requestId}/respond`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export type LoanProvider = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type LoanRequest = {
  _id: string;
  vendorId: string | { _id: string; name?: string; email?: string };
  customerId: string | { _id: string; name?: string; email?: string };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type CustomerProfile = {
  _id: string;
  userId: string;
  favorites: Array<{ _id: string; name?: string; email?: string }>;
  isLendingActive: boolean;
  totalLentAmount: number;
  impactBadges: string[];
  cart: CustomerCartVendor[];
};

export type CustomerCartItem = {
  itemName: string;
  qty: number;
  price: number;
};

export type CustomerCartVendor = {
  vendorId: string | { _id: string; name?: string; email?: string };
  items: CustomerCartItem[];
};
