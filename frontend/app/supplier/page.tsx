"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { api, type Product, type SupplierAnalytics } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";

export default function SupplierDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "ingredients",
    unit: "kg",
    status: "active",
    image: "",
  });

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "supplier" && me.role !== "admin") {
          setError("This dashboard is only for suppliers/admin.");
          return;
        }
        setUser(me);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Authentication required"));
  }, []);

  useEffect(() => {
    if (!user) return;
    const authToken = getStoredToken();
    if (!authToken) return;
    setToken(authToken);

    Promise.all([api.getSupplierAnalytics(authToken), api.getProducts()])
      .then(([analyticsData, productsData]) => {
        setAnalytics(analyticsData);
        const allProducts = productsData.products || [];
        setProducts(
          user.role === "admin"
            ? allProducts
            : allProducts.filter((p) => {
                const supplierId =
                  typeof p.supplier === "string" ? p.supplier : p.supplier?._id;
                return supplierId === user.id;
              })
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load supplier dashboard"));
  }, [user]);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "ingredients",
      unit: "kg",
      status: "active",
      image: "",
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingId) {
        const result = await api.updateProduct(token, editingId, form);
        setProducts((prev) => prev.map((p) => (p._id === editingId ? result.product : p)));
      } else {
        const result = await api.createProduct(token, form);
        setProducts((prev) => [result.product, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      unit: product.unit,
      status: "active",
      image: "",
    });
  }

  async function removeProduct(id: string) {
    if (!token) return;
    try {
      setError(null);
      await api.deleteProduct(token, id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  function logout() {
    clearAuth();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
            <p className="text-sm text-zinc-600">Catalog, order demand, and revenue snapshot</p>
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
            <h2 className="text-lg font-semibold">Business Snapshot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard label="Total Products" value={analytics.totalProducts} />
              <StatsCard label="Active Products" value={analytics.activeProducts} />
              <StatsCard label="Total Orders" value={analytics.totalOrders} />
              <StatsCard label="This Month Revenue" value={formatCurrency(analytics.monthRevenue)} />
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit Product" : "Create Product"}
          </h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              required
            />
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}
              required
            />
            <input
              type="number"
              min="0"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm((v) => ({ ...v, price: Number(e.target.value) }))}
              required
            />
            <input
              type="number"
              min="0"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm((v) => ({ ...v, stock: Number(e.target.value) }))}
              required
            />
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Unit"
              value={form.unit}
              onChange={(e) => setForm((v) => ({ ...v, unit: e.target.value }))}
              required
            />
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Image URL (optional)"
              value={form.image}
              onChange={(e) => setForm((v) => ({ ...v, image: e.target.value }))}
            />
            <textarea
              className="sm:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              required
            />
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Saving..." : editingId ? "Update Product" : "Create Product"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Product Catalog</h2>
          <p className="mt-1 text-sm text-zinc-600">{products.length} item(s)</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <li key={product._id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-zinc-600">
                  {product.category} · {product.stock} {product.unit}
                </p>
                <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => startEdit(product)}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeProduct(product._id)}
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
