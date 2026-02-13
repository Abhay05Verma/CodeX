"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { api, type BuyerAnalytics, type Product } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function BuyerDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [analytics, setAnalytics] = useState<BuyerAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "buyer" && me.role !== "admin") {
          setError("This dashboard is only for buyers/admin.");
          return;
        }
        setUser(me);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Authentication required"));
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = getStoredToken();
    if (!token) return;

    Promise.all([api.getBuyerAnalytics(token), api.getProducts()])
      .then(([analyticsData, productsData]) => {
        setAnalytics(analyticsData);
        setProducts(productsData.products || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load buyer dashboard"));
  }, [user]);

  function logout() {
    clearAuth();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
            <p className="text-sm text-zinc-600">Orders, spending, and live catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100">
              Home
            </Link>
            <button
              onClick={logout}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </header>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {analytics ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Order Snapshot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatsCard label="Total Orders" value={analytics.totalOrders} />
              <StatsCard label="This Month Orders" value={analytics.monthOrders} />
              <StatsCard label="Total Spent" value={formatCurrency(analytics.totalSpent)} />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium">Recent Orders</p>
              <ul className="mt-2 space-y-2">
                {analytics.recentOrders.map((order) => (
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
          </section>
        ) : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Available Products</h2>
          <p className="mt-1 text-sm text-zinc-600">{products.length} item(s)</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <li key={product._id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-zinc-600">{product.category}</p>
                <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
