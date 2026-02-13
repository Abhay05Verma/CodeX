"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type HealthResponse, type Product } from "@/lib/api";
import { clearAuth, getMe, getStoredUser, type AuthUser } from "@/lib/auth";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
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

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Backend Health</h2>
          {loading && <p className="mt-2 text-sm text-zinc-600">Checking backend...</p>}
          {!loading && error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {!loading && !error && health && (
            <div className="mt-3 space-y-1 text-sm">
              <p>Status: {health.status}</p>
              <p>Uptime: {Math.round(health.uptime)}s</p>
              <p>Timestamp: {new Date(health.timestamp).toLocaleString()}</p>
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
