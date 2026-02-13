"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  BarChart3,
  Bell,
  Calendar,
  Globe,
  Heart,
  LogOut,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { api, type BuyerAnalytics, type Order, type Product } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";

type CartItem = Product & { quantity: number };
type Language = "en" | "hi";

function getSupplierId(product: Product): string | null {
  const supplier = product.supplier;
  if (!supplier) return null;
  return typeof supplier === "string" ? supplier : supplier._id;
}

function getSupplierName(product: Product): string {
  const supplier = product.supplier;
  if (!supplier) return "Unknown Supplier";
  if (typeof supplier === "string") return `Supplier ${supplier.slice(-4)}`;
  return supplier.name || supplier.email || "Supplier";
}

export default function BuyerDashboardPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token] = useState<string | null>(() => getStoredToken());
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<BuyerAnalytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showCart, setShowCart] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: "all", name: language === "hi" ? "सभी श्रेणियाँ" : "All Categories" },
      { id: "ingredients", name: language === "hi" ? "सामग्री" : "Ingredients" },
      { id: "street-food", name: language === "hi" ? "स्ट्रीट फूड" : "Street Food" },
      { id: "beverages", name: language === "hi" ? "पेय पदार्थ" : "Beverages" },
      { id: "snacks", name: language === "hi" ? "स्नैक्स" : "Snacks" },
      { id: "desserts", name: language === "hi" ? "मिठाई" : "Desserts" },
    ],
    [language]
  );

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
    async function loadDashboard() {
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [productsData, analyticsData, ordersData] = await Promise.all([
          api.getProducts(),
          api.getBuyerAnalytics(token),
          api.getMyOrders(token),
        ]);
        setProducts(productsData.products || []);
        setAnalytics(analyticsData);
        setOrders(ordersData.orders || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load buyer dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token, user]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getSupplierName(product).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b._id).getTime() - new Date(a._id).getTime();
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  function toggleWishlist(productId: string) {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function addToCart(product: Product) {
    const productSupplierId = getSupplierId(product);
    if (!productSupplierId) {
      setError("Product supplier is missing.");
      return;
    }

    setError(null);
    setCart((prev) => {
      if (prev.length > 0) {
        const existingSupplierId = getSupplierId(prev[0]);
        if (existingSupplierId && existingSupplierId !== productSupplierId) {
          setError("Cart can contain products from one supplier at a time.");
          return prev;
        }
      }

      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item._id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      )
    );
  }

  async function placeOrder() {
    if (!token) return setError("Authentication required.");
    if (cart.length === 0) return setError("Add at least one product to cart.");

    const supplierId = getSupplierId(cart[0]);
    if (!supplierId) return setError("Supplier not found for cart.");

    try {
      setError(null);
      const payload = {
        supplierId,
        notes: "Order placed from buyer dashboard",
        items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
      };
      const result = await api.createOrder(token, payload);
      setOrders((prev) => [result.order, ...prev]);
      setCart([]);
      setShowCart(false);
      const updatedAnalytics = await api.getBuyerAnalytics(token);
      setAnalytics(updatedAnalytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    }
  }

  function handleLogout() {
    clearAuth();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
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
            <div className="flex shrink-0 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-2">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <Link
                href="/"
                className="text-2xl font-bold text-gray-900 transition-opacity hover:opacity-90"
              >
                {language === "hi" ? "वेंटरेस्ट वेंडर पोर्टल" : "Ventrest Vendor Portal"}
              </Link>
              <p className="text-sm text-gray-600">
                {language === "hi" ? "सर्वोत्तम स्ट्रीट फूड खोजें" : "Discover the best street food"}
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
              onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600"
            >
              <Globe className="h-4 w-4" />
              {language === "hi" ? "भाषा" : "Language"}
            </button>
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
              onClick={() => setShowCart(true)}
              className="relative inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700"
            >
              <ShoppingCart className="h-4 w-4" />
              {language === "hi" ? "कार्ट" : "Cart"}
              {cart.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cart.length}
                </span>
              ) : null}
            </button>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-900"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              {language === "hi" ? "लॉगआउट" : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={language === "hi" ? "कुल उत्पाद" : "Total Products"}
            value={products.length}
            icon={<Package className="h-8 w-8" />}
            iconClassName="text-indigo-600"
          />
          <StatsCard
            label={language === "hi" ? "कार्ट में आइटम" : "Items in Cart"}
            value={cart.length}
            icon={<ShoppingCart className="h-8 w-8" />}
            iconClassName="text-green-600"
          />
          <StatsCard
            label={language === "hi" ? "कुल खर्च" : "Total Spent"}
            value={formatCurrency(analytics?.totalSpent ?? 0)}
            icon={<Truck className="h-8 w-8" />}
            iconClassName="text-yellow-600"
          />
          <StatsCard
            label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"}
            value={analytics?.totalOrders ?? 0}
            icon={<Bell className="h-8 w-8" />}
            iconClassName="text-blue-600"
          />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "hi"
                  ? "उत्पाद, सप्लायर या विवरण खोजें..."
                  : "Search products, suppliers, or descriptions..."
              }
              className="w-full rounded-xl border border-zinc-300 py-3 pl-12 pr-10 text-sm outline-none focus:border-green-500"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                showFilters ? "bg-green-500 text-white" : "border border-zinc-300 bg-white"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {language === "hi" ? "फ़िल्टर" : "Filters"}
            </button>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    selectedCategory === c.id
                      ? "bg-green-500 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
              >
                <option value="recent">{language === "hi" ? "नया पहले" : "Recent"}</option>
                <option value="price-low">{language === "hi" ? "कम कीमत" : "Price Low"}</option>
                <option value="price-high">{language === "hi" ? "उच्च कीमत" : "Price High"}</option>
                <option value="name">{language === "hi" ? "नाम" : "Name"}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white/80 py-12 text-center shadow-sm">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                {language === "hi" ? "कोई उत्पाद नहीं मिला" : "No products found"}
              </h3>
              <p className="mt-2 text-gray-600">
                {language === "hi"
                  ? "अपनी खोज मापदंड बदलने का प्रयास करें"
                  : "Try changing your search criteria"}
              </p>
            </div>
          ) : null}
          {filteredProducts.map((product) => (
            <article key={product._id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative">
                <Image
                  src={product.image || "https://placehold.co/600x400?text=Product"}
                  alt={product.name}
                  width={600}
                  height={400}
                  className="h-44 w-full object-cover"
                />
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2"
                >
                  <Heart
                    className={`h-4 w-4 ${wishlist.has(product._id) ? "fill-red-500 text-red-500" : "text-zinc-500"}`}
                  />
                </button>
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-zinc-600">{product.description}</p>
                <p className="text-xs text-zinc-500">{getSupplierName(product)}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Star className="h-4 w-4 text-yellow-500" />
                  4.5
                  <Truck className="ml-2 h-4 w-4" />
                  20-30 min
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-700">{formatCurrency(product.price)}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="inline-flex items-center gap-1 rounded-md bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                  >
                    <Plus className="h-4 w-4" />
                    {language === "hi" ? "कार्ट" : "Add"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {showCart ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 md:items-center">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{language === "hi" ? "आपका कार्ट" : "Your Cart"}</h2>
              <button onClick={() => setShowCart(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-zinc-500">{language === "hi" ? "कार्ट खाली है" : "Cart is empty"}</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li key={item._id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-zinc-600">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                            className="rounded border border-zinc-300 p-1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                            className="rounded border border-zinc-300 p-1"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg bg-zinc-100 p-3">
                  <p className="text-sm text-zinc-600">{language === "hi" ? "कुल" : "Total"}</p>
                  <p className="text-xl font-bold">{formatCurrency(cartTotal)}</p>
                </div>
                <button
                  onClick={placeOrder}
                  className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {language === "hi" ? "ऑर्डर करें" : "Place Order"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showAnalytics && analytics ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
              <h2 className="text-xl font-bold">{language === "hi" ? "विश्लेषण डैशबोर्ड" : "Analytics Dashboard"}</h2>
              <button onClick={() => setShowAnalytics(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <StatsCard
                  label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"}
                  value={analytics.totalOrders}
                  icon={<Bell className="h-8 w-8" />}
                  iconClassName="text-blue-600"
                />
                <StatsCard
                  label={language === "hi" ? "इस महीने ऑर्डर" : "This Month Orders"}
                  value={analytics.monthOrders}
                  icon={<Calendar className="h-8 w-8" />}
                  iconClassName="text-indigo-600"
                />
                <StatsCard
                  label={language === "hi" ? "कुल खर्च" : "Total Spent"}
                  value={formatCurrency(analytics.totalSpent)}
                  icon={<Truck className="h-8 w-8" />}
                  iconClassName="text-yellow-600"
                />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">{language === "hi" ? "हाल के ऑर्डर" : "Recent Orders"}</h3>
                <ul className="space-y-2">
                  {orders.slice(0, 10).map((order) => (
                    <li key={order._id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                      <span className="font-medium">{formatCurrency(order.totalAmount)}</span>{" "}
                      <span className="text-zinc-600">· {order.status}</span>{" "}
                      <Calendar className="mx-1 inline h-3 w-3" />
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
        <Bell className="h-5 w-5 text-zinc-700" />
      </button>
    </div>
  );
}
