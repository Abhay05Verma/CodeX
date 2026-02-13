"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  type BuyerAnalytics,
  type HealthResponse,
  type Product,
  type SupplierAnalytics,
} from "@/lib/api";
import { clearAuth, getMe, getStoredToken, getStoredUser, type AuthUser } from "@/lib/auth";
import StatsCard from "@/components/StatsCard";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [buyerAnalytics, setBuyerAnalytics] = useState<BuyerAnalytics | null>(null);
  const [supplierAnalytics, setSupplierAnalytics] = useState<SupplierAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    []
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [healthData, productsData] = await Promise.all([
          api.getHealth(),
          api.getProducts(),
        ]);

        if (!active) return;
        setHealth(healthData);
        setProducts(productsData.products || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load API data");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cached = getStoredUser();
    if (cached) setUser(cached);

    getMe()
      .then((me) => setUser(me))
      .catch(() => {
        if (!cached) setUser(null);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setBuyerAnalytics(null);
      setSupplierAnalytics(null);
      setAnalyticsError(null);
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setAnalyticsError(null);
    if (user.role === "supplier") {
      api
        .getSupplierAnalytics(token)
        .then((data) => setSupplierAnalytics(data))
        .catch((err) => setAnalyticsError(err instanceof Error ? err.message : "Failed to load analytics"));
      return;
    }

    api
      .getBuyerAnalytics(token)
      .then((data) => setBuyerAnalytics(data))
      .catch((err) => setAnalyticsError(err instanceof Error ? err.message : "Failed to load analytics"));
  }, [user]);

  function handleLogout() {
    clearAuth();
    setUser(null);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">CodeX Dashboard</h1>
            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-600">
                  Signed in as {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
              >
                Login
              </Link>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Frontend: Next.js | Backend API: {apiBase}
          </p>
        </header>

        {user ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Your Analytics</h2>
            {analyticsError ? <p className="mt-2 text-sm text-red-600">{analyticsError}</p> : null}

            {user.role === "supplier" && supplierAnalytics ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard label="Total Products" value={supplierAnalytics.totalProducts} />
                <StatsCard label="Active Products" value={supplierAnalytics.activeProducts} />
                <StatsCard label="Total Orders" value={supplierAnalytics.totalOrders} />
                <StatsCard
                  label="This Month Revenue"
                  value={formatCurrency(supplierAnalytics.monthRevenue)}
                />
              </div>
            ) : null}

            {(user.role === "buyer" || user.role === "admin") && buyerAnalytics ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <StatsCard label="Total Orders" value={buyerAnalytics.totalOrders} />
                  <StatsCard label="This Month Orders" value={buyerAnalytics.monthOrders} />
                  <StatsCard label="Total Spent" value={formatCurrency(buyerAnalytics.totalSpent)} />
                </div>
                <div>
                  <p className="text-sm font-medium">Recent Orders</p>
                  <ul className="mt-2 space-y-2">
                    {buyerAnalytics.recentOrders.map((order) => (
                      <li
                        key={order._id}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{formatCurrency(order.totalAmount)}</span>{" "}
                        <span className="text-zinc-600">· {order.status}</span>{" "}
                        <span className="text-zinc-500">· {formatDateTime(order.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Backend Health</h2>
          {loading && <p className="mt-2 text-sm text-zinc-600">Checking backend...</p>}
          {!loading && error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {!loading && !error && health && (
            <div className="mt-3 space-y-1 text-sm">
              <p>Status: {health.status}</p>
              <p>Uptime: {Math.round(health.uptime)}s</p>
              <p>Timestamp: {formatDateTime(health.timestamp)}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {products.length} item(s) fetched from `/api/products`
          </p>
          <ul className="mt-4 space-y-3">
            {products.map((product) => (
              <li
                key={product._id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-zinc-600">
                  {product.category} · {product.stock} {product.unit} in stock
                </p>
                <p className="text-sm font-medium">Rs. {product.price}</p>
              </li>
            ))}
            {!loading && !error && products.length === 0 && (
              <li className="text-sm text-zinc-500">No products yet.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
