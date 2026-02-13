"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { api, type BuyerAnalytics, type Order, type Product } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function BuyerDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<BuyerAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [qtyByProductId, setQtyByProductId] = useState<Record<string, number>>({});
  const [submittingOrder, setSubmittingOrder] = useState(false);
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
    const authToken = getStoredToken();
    if (!authToken) return;
    setToken(authToken);

    Promise.all([api.getBuyerAnalytics(authToken), api.getProducts(), api.getMyOrders(authToken)])
      .then(([analyticsData, productsData, ordersData]) => {
        setAnalytics(analyticsData);
        setProducts(productsData.products || []);
        setOrders(ordersData.orders || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load buyer dashboard"));
  }, [user]);

  const suppliers = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      const rawSupplier = product.supplier;
      const id = typeof rawSupplier === "string" ? rawSupplier : rawSupplier?._id;
      const name =
        typeof rawSupplier === "string"
          ? `Supplier ${rawSupplier.slice(-4)}`
          : rawSupplier?.name || rawSupplier?.email || `Supplier ${String(id).slice(-4)}`;
      if (id) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const supplierProducts = useMemo(() => {
    if (!supplierId) return [];
    return products.filter((product) => {
      const rawSupplier = product.supplier;
      const id = typeof rawSupplier === "string" ? rawSupplier : rawSupplier?._id;
      return id === supplierId;
    });
  }, [products, supplierId]);

  const selectedItems = useMemo(
    () =>
      Object.entries(qtyByProductId)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ productId, quantity: Math.floor(quantity) })),
    [qtyByProductId]
  );

  const estimatedTotal = useMemo(() => {
    let total = 0;
    for (const item of selectedItems) {
      const product = supplierProducts.find((p) => p._id === item.productId);
      if (product) total += product.price * item.quantity;
    }
    return total;
  }, [selectedItems, supplierProducts]);

  async function placeOrder() {
    if (!token) return setError("Authentication required");
    if (!supplierId) return setError("Select a supplier first");
    if (selectedItems.length === 0) return setError("Add at least one product quantity");

    try {
      setSubmittingOrder(true);
      setError(null);
      const result = await api.createOrder(token, {
        supplierId,
        notes,
        items: selectedItems,
      });
      setOrders((prev) => [result.order, ...prev]);
      setQtyByProductId({});
      setNotes("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSubmittingOrder(false);
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

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Place New Order</h2>
          <div className="mt-3 space-y-3">
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setQtyByProductId({});
              }}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            {supplierProducts.length > 0 ? (
              <ul className="space-y-2">
                {supplierProducts.map((product) => (
                  <li
                    key={product._id}
                    className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-zinc-600">{formatCurrency(product.price)} · stock {product.stock}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={product.stock}
                      value={qtyByProductId[product._id] || 0}
                      onChange={(e) =>
                        setQtyByProductId((prev) => ({
                          ...prev,
                          [product._id]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-right"
                    />
                  </li>
                ))}
              </ul>
            ) : null}

            <textarea
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Order notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-700">
                Selected items: {selectedItems.length} · Estimated total:{" "}
                <span className="font-medium">{formatCurrency(estimatedTotal)}</span>
              </p>
              <button
                onClick={placeOrder}
                disabled={submittingOrder}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submittingOrder ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">My Orders</h2>
          <p className="mt-1 text-sm text-zinc-600">{orders.length} order(s)</p>
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order._id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium">
                  {formatCurrency(order.totalAmount)} · {order.status}
                </p>
                <p className="text-sm text-zinc-600">
                  {order.items.length} item(s) · {formatDateTime(order.createdAt)}
                </p>
                {order.notes ? <p className="text-sm text-zinc-500">Note: {order.notes}</p> : null}
              </li>
            ))}
            {orders.length === 0 ? <li className="text-sm text-zinc-500">No orders yet.</li> : null}
          </ul>
        </section>
      </div>
    </main>
  );
}
