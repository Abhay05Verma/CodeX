"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  DollarSign,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import VendorHeader from "@/components/VendorHeader";
import { api, type Order, type Product, type SupplierAnalytics } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Language = "en" | "hi";

const STATUS_OPTIONS = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;

function getBuyerName(order: Order): string {
  const b = order.buyer;
  if (!b) return "—";
  if (typeof b === "string") return `Customer`;
  return b.name || b.email || "Customer";
}

export default function BuyerShopPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token] = useState<string | null>(() => getStoredToken());
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "street-food",
    unit: "kg",
    status: "active",
    image: "",
  });

  const categories = useMemo(
    () => [
      { id: "all", name: language === "hi" ? "सभी श्रेणियाँ" : "All Categories" },
      { id: "street-food", name: language === "hi" ? "स्ट्रीट फूड" : "Street Food" },
      { id: "beverages", name: language === "hi" ? "पेय पदार्थ" : "Beverages" },
      { id: "snacks", name: language === "hi" ? "स्नैक्स" : "Snacks" },
      { id: "desserts", name: language === "hi" ? "मिठाई" : "Desserts" },
      { id: "ingredients", name: language === "hi" ? "सामग्री" : "Ingredients" },
    ],
    [language]
  );

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "buyer" && me.role !== "admin") {
          setError("This page is only for vendors (buyers)/admin.");
          setLoading(false);
          return;
        }
        setUser(me);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Authentication required");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    Promise.all([
      api.getMyProducts(token),
      api.getSupplierOrders(token),
      api.getSupplierAnalytics(token),
    ])
      .then(([productsData, ordersData, analyticsData]) => {
        setProducts(productsData.products || []);
        setOrders(ordersData.orders || []);
        setAnalytics(analyticsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user, token]);

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price") return b.price - a.price;
        return b._id.localeCompare(a._id);
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "street-food",
      unit: "kg",
      status: "active",
      image: "",
    });
  }

  function openCreate() {
    resetForm();
    setShowEditor(true);
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
      status: product.status || "active",
      image: product.image || "",
    });
    setShowEditor(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return setError("Authentication required");
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
      setShowEditor(false);
      resetForm();
      const updated = await api.getSupplierAnalytics(token);
      setAnalytics(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProduct(id: string) {
    if (!token) return;
    try {
      setError(null);
      await api.deleteProduct(token, id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      if (editingId === id) resetForm();
      const updated = await api.getSupplierAnalytics(token);
      setAnalytics(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function updateStatus(orderId: string, status: string) {
    if (!token) return;
    setUpdatingId(orderId);
    setError(null);
    try {
      const { order } = await api.updateOrderStatus(token, orderId, status);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? order : o)));
      const updated = await api.getSupplierAnalytics(token);
      setAnalytics(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !products.length && !orders.length && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="text-gray-600">{language === "hi" ? "लोड हो रहा है..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900">
      <VendorHeader
        user={user}
        language={language}
        onLanguageToggle={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
        onLogout={() => { clearAuth(); window.location.href = "/"; }}
        showBrowseLink
        onAnalyticsClick={() => setShowAnalytics(true)}
        pageTitle={language === "hi" ? "मेरी दुकान" : "My Shop"}
        pageSubtitle={language === "hi" ? "अपने उत्पादों का प्रबंधन करें" : "Manage your products"}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label={language === "hi" ? "मेरे उत्पाद" : "My Products"} value={products.length} icon={<Package className="h-8 w-8" />} iconClassName="text-indigo-600" />
          <StatsCard label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"} value={analytics?.totalOrders ?? orders.length} icon={<Bell className="h-8 w-8" />} iconClassName="text-blue-600" />
          <StatsCard label={language === "hi" ? "लंबित" : "Pending"} value={orders.filter((o) => o.status === "pending").length} icon={<Calendar className="h-8 w-8" />} iconClassName="text-amber-600" />
          <StatsCard label={language === "hi" ? "मासिक राजस्व" : "Month Revenue"} value={formatCurrency(analytics?.monthRevenue ?? 0)} icon={<DollarSign className="h-8 w-8" />} iconClassName="text-green-600" />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === "hi" ? "उत्पाद खोजें..." : "Search products..."} className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="recent">{language === "hi" ? "हाल का" : "Recent"}</option>
                <option value="name">{language === "hi" ? "नाम" : "Name"}</option>
                <option value="price">{language === "hi" ? "कीमत" : "Price"}</option>
              </select>
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-sm font-medium text-white">
                <Plus className="h-4 w-4" />
                {language === "hi" ? "उत्पाद जोड़ें" : "Add Product"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article key={product._id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="relative">
                  <Image src={product.image || "https://placehold.co/600x400?text=Product"} alt={product.name} width={600} height={400} className="h-40 w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button type="button" onClick={() => startEdit(product)} className="rounded-full bg-white/90 p-1.5"><Edit className="h-4 w-4 text-zinc-700" /></button>
                    <button type="button" onClick={() => removeProduct(product._id)} className="rounded-full bg-white/90 p-1.5"><Trash2 className="h-4 w-4 text-red-600" /></button>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="line-clamp-2 text-sm text-zinc-600">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-indigo-700">{formatCurrency(product.price)}</p>
                    <span className="text-xs text-zinc-500">{language === "hi" ? "स्टॉक" : "Stock"}: {product.stock}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center">
              <Package className="mx-auto mb-2 h-10 w-10 text-zinc-400" />
              <p className="text-sm text-gray-600">{language === "hi" ? "कोई उत्पाद नहीं। ऊपर से जोड़ें।" : "No products. Add one above."}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">{language === "hi" ? "ग्राहकों के ऑर्डर" : "Orders from customers"}</h2>
          {orders.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 py-8 text-center">
              <Bell className="mx-auto mb-2 h-10 w-10 text-zinc-400" />
              <p className="text-sm text-gray-600">{language === "hi" ? "अभी तक कोई ऑर्डर नहीं" : "No orders yet"}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order._id} className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{getBuyerName(order)} · {formatCurrency(order.totalAmount)}</p>
                    <p className="text-sm text-gray-500"><Calendar className="mr-1 inline h-3 w-3" />{formatDateTime(order.createdAt)}</p>
                    {order.notes ? <p className="mt-1 text-sm text-gray-600">{order.notes}</p> : null}
                  </div>
                  <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)} disabled={updatingId === order._id} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {showEditor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <h2 className="text-lg font-semibold">{editingId ? (language === "hi" ? "उत्पाद संपादित करें" : "Edit Product") : (language === "hi" ? "नया उत्पाद जोड़ें" : "Add Product")}</h2>
              <button type="button" onClick={() => { setShowEditor(false); resetForm(); }}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3 p-5 sm:grid-cols-2">
              <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder={language === "hi" ? "नाम" : "Name"} value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required />
              <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder={language === "hi" ? "श्रेणी" : "Category"} value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} required />
              <input type="number" min="0" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder={language === "hi" ? "कीमत" : "Price"} value={form.price} onChange={(e) => setForm((v) => ({ ...v, price: Number(e.target.value) }))} required />
              <input type="number" min="0" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder={language === "hi" ? "स्टॉक" : "Stock"} value={form.stock} onChange={(e) => setForm((v) => ({ ...v, stock: Number(e.target.value) }))} required />
              <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder={language === "hi" ? "इकाई" : "Unit"} value={form.unit} onChange={(e) => setForm((v) => ({ ...v, unit: e.target.value }))} required />
              <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Image URL" value={form.image} onChange={(e) => setForm((v) => ({ ...v, image: e.target.value }))} />
              <textarea className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder={language === "hi" ? "विवरण" : "Description"} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} required />
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{submitting ? (language === "hi" ? "सहेजा जा रहा है..." : "Saving...") : editingId ? (language === "hi" ? "अपडेट करें" : "Update") : (language === "hi" ? "जोड़ें" : "Add")}</button>
                <button type="button" onClick={() => { setShowEditor(false); resetForm(); }} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100">{language === "hi" ? "रद्द करें" : "Cancel"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAnalytics && analytics && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <h2 className="text-xl font-bold">{language === "hi" ? "विश्लेषण" : "Analytics"}</h2>
              <button type="button" onClick={() => setShowAnalytics(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"} value={analytics.totalOrders} icon={<Bell className="h-8 w-8" />} iconClassName="text-blue-600" />
                <StatsCard label={language === "hi" ? "इस महीने" : "This Month"} value={analytics.thisMonthOrders ?? 0} icon={<Calendar className="h-8 w-8" />} iconClassName="text-indigo-600" />
                <StatsCard label={language === "hi" ? "कुल राजस्व" : "Total Revenue"} value={formatCurrency(analytics.totalRevenue ?? 0)} icon={<DollarSign className="h-8 w-8" />} iconClassName="text-green-600" />
                <StatsCard label={language === "hi" ? "मासिक राजस्व" : "Month Revenue"} value={formatCurrency(analytics.monthRevenue ?? 0)} icon={<DollarSign className="h-8 w-8" />} iconClassName="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
