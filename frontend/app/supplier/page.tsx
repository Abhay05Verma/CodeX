"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  DollarSign,
  Edit,
  Globe,
  LogOut,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { api, type Order, type Product, type SupplierAnalytics } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Language = "en" | "hi";

export default function SupplierDashboardPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token] = useState<string | null>(() => getStoredToken());
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
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
        if (me.role !== "supplier" && me.role !== "admin") {
          setError("This dashboard is only for suppliers/admin.");
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
    if (!user) return;
    const currentUser = user;

    async function loadSupplierData() {
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [analyticsData, productsData, ordersData] = await Promise.all([
          api.getSupplierAnalytics(token),
          api.getProducts(),
          api.getMyOrders(token),
        ]);

        const allProducts = productsData.products || [];
        const visibleProducts =
          currentUser.role === "admin"
            ? allProducts
            : allProducts.filter((p) => {
                const supplierId = typeof p.supplier === "string" ? p.supplier : p.supplier?._id;
                return supplierId === currentUser.id;
              });

        setAnalytics(analyticsData);
        setProducts(visibleProducts);
        setOrders(ordersData.orders || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load supplier dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadSupplierData();
  }, [token, user]);

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
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

      const updatedAnalytics = await api.getSupplierAnalytics(token);
      setAnalytics(updatedAnalytics);
      setShowEditor(false);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product");
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
      const updatedAnalytics = await api.getSupplierAnalytics(token);
      setAnalytics(updatedAnalytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    }
  }

  function logout() {
    clearAuth();
    window.location.href = "/";
  }

  if (loading) {
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
      <header className="bg-white/90 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex shrink-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <Link
                href="/"
                className="text-2xl font-bold text-gray-900 transition-opacity hover:opacity-90"
              >
                {language === "hi" ? "वेंटरेस्ट सप्लायर डैशबोर्ड" : "Ventrest Supplier Dashboard"}
              </Link>
              <p className="text-sm text-gray-600">
                {language === "hi" ? "अपने उत्पादों का प्रबंधन करें" : "Manage your products"}
              </p>
            </div>
            {user ? (
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAnalytics(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700"
            >
              <BarChart3 className="h-4 w-4" />
              {language === "hi" ? "विश्लेषण" : "Analytics"}
            </button>
            <button
              type="button"
              onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600"
            >
              <Globe className="h-4 w-4" />
              {language === "hi" ? "भाषा" : "Language"}
            </button>
            <div className="relative flex items-center justify-center rounded-lg px-3 py-2 text-gray-600">
              <Bell className="h-4 w-4" />
              {orders.length > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {orders.length > 99 ? "99+" : orders.length}
                </span>
              ) : null}
            </div>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-900"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              {language === "hi" ? "लॉगआउट" : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={language === "hi" ? "कुल उत्पाद" : "Total Products"}
            value={analytics?.totalProducts ?? products.length}
            icon={<Package className="h-8 w-8" />}
            iconClassName="text-indigo-600"
          />
          <StatsCard
            label={language === "hi" ? "सक्रिय उत्पाद" : "Active Products"}
            value={analytics?.activeProducts ?? products.filter((p) => (p.status || "active") === "active").length}
            icon={<TrendingUp className="h-8 w-8" />}
            iconClassName="text-green-600"
          />
          <StatsCard
            label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"}
            value={analytics?.totalOrders ?? orders.length}
            icon={<Bell className="h-8 w-8" />}
            iconClassName="text-blue-600"
          />
          <StatsCard
            label={language === "hi" ? "मासिक राजस्व" : "This Month Revenue"}
            value={formatCurrency(analytics?.monthRevenue ?? 0)}
            icon={<DollarSign className="h-8 w-8" />}
            iconClassName="text-yellow-600"
          />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "hi" ? "उत्पाद खोजें..." : "Search products..."}
                className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="recent">{language === "hi" ? "हाल का" : "Recent"}</option>
                <option value="name">{language === "hi" ? "नाम" : "Name"}</option>
                <option value="price">{language === "hi" ? "कीमत" : "Price"}</option>
              </select>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                {language === "hi" ? "उत्पाद जोड़ें" : "Add Product"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <article key={product._id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative">
                <Image
                  src={product.image || "https://placehold.co/600x400?text=Product"}
                  alt={product.name}
                  width={600}
                  height={400}
                  className="h-40 w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button onClick={() => startEdit(product)} className="rounded-full bg-white/90 p-1.5">
                    <Edit className="h-4 w-4 text-zinc-700" />
                  </button>
                  <button onClick={() => removeProduct(product._id)} className="rounded-full bg-white/90 p-1.5">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="line-clamp-2 text-sm text-zinc-600">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-indigo-700">{formatCurrency(product.price)}</p>
                  <span className="text-xs text-zinc-500">{language === "hi" ? "स्टॉक" : "Stock"}: {product.stock}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">{product.category}</span>
                  <span
                    className={`rounded-full px-2 py-1 ${(product.status || "active") === "active" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {(product.status || "active") === "active"
                      ? language === "hi"
                        ? "सक्रिय"
                        : "Active"
                      : language === "hi"
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>

        {filteredProducts.length === 0 ? (
          <section className="rounded-xl border border-gray-200 bg-white/80 py-12 text-center shadow-sm">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              {language === "hi" ? "कोई उत्पाद नहीं मिला" : "No products found"}
            </h3>
            <p className="mt-2 text-gray-600">
              {language === "hi"
                ? "उत्पाद जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें"
                : "Use the button above to add a product"}
            </p>
          </section>
        ) : null}
      </main>

      {showEditor ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <h2 className="text-lg font-semibold">{editingId ? (language === "hi" ? "उत्पाद संपादित करें" : "Edit Product") : (language === "hi" ? "नया उत्पाद जोड़ें" : "Add New Product")}</h2>
              <button onClick={() => setShowEditor(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3 p-5 sm:grid-cols-2">
              <input
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder={language === "hi" ? "नाम" : "Name"}
                value={form.name}
                onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                required
              />
              <input
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder={language === "hi" ? "श्रेणी" : "Category"}
                value={form.category}
                onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}
                required
              />
              <input
                type="number"
                min="0"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder={language === "hi" ? "कीमत" : "Price"}
                value={form.price}
                onChange={(e) => setForm((v) => ({ ...v, price: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                min="0"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder={language === "hi" ? "स्टॉक" : "Stock"}
                value={form.stock}
                onChange={(e) => setForm((v) => ({ ...v, stock: Number(e.target.value) }))}
                required
              />
              <input
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder={language === "hi" ? "इकाई" : "Unit"}
                value={form.unit}
                onChange={(e) => setForm((v) => ({ ...v, unit: e.target.value }))}
                required
              />
              <input
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Image URL"
                value={form.image}
                onChange={(e) => setForm((v) => ({ ...v, image: e.target.value }))}
              />
              <textarea
                className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder={language === "hi" ? "विवरण" : "Description"}
                value={form.description}
                onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
                required
              />
              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting
                    ? language === "hi"
                      ? "सहेजा जा रहा है..."
                      : "Saving..."
                    : editingId
                      ? language === "hi"
                        ? "अपडेट करें"
                        : "Update Product"
                      : language === "hi"
                        ? "उत्पाद जोड़ें"
                        : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
                >
                  {language === "hi" ? "रद्द करें" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showAnalytics ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white">
              <h2 className="text-xl font-bold">{language === "hi" ? "विश्लेषण डैशबोर्ड" : "Analytics Dashboard"}</h2>
              <button onClick={() => setShowAnalytics(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
                  <p className="text-sm opacity-90">{language === "hi" ? "कुल ऑर्डर" : "Total Orders"}</p>
                  <p className="text-2xl font-bold">{analytics?.totalOrders ?? orders.length}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-white">
                  <p className="text-sm opacity-90">{language === "hi" ? "कुल उत्पाद" : "Products"}</p>
                  <p className="text-2xl font-bold">{analytics?.totalProducts ?? products.length}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white">
                  <p className="text-sm opacity-90">{language === "hi" ? "सक्रिय" : "Active"}</p>
                  <p className="text-2xl font-bold">{analytics?.activeProducts ?? 0}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white">
                  <p className="text-sm opacity-90">{language === "hi" ? "मासिक राजस्व" : "Month Revenue"}</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics?.monthRevenue ?? 0)}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">{language === "hi" ? "हाल के ऑर्डर" : "Recent Orders"}</h3>
                <ul className="space-y-2">
                  {orders.slice(0, 12).map((order) => (
                    <li key={order._id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                      <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                      <span className="mx-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs">{order.status}</span>
                      <Calendar className="mr-1 inline h-3 w-3" />
                      <span className="text-zinc-500">{formatDateTime(order.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button className="fixed bottom-4 right-4 z-30 rounded-full bg-white p-3 shadow-lg">
        <TrendingUp className="h-5 w-5 text-zinc-700" />
      </button>
    </div>
  );
}
