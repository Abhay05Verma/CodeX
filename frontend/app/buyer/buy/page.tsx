"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  Package,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import VendorHeader from "@/components/VendorHeader";
import ProductGridSection from "@/components/ProductGridSection";
import CartModal from "@/components/CartModal";
import { api, type BuyerAnalytics, type Order, type Product } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getSupplierId, getSupplierName } from "@/lib/productUtils";

type CartItem = Product & { quantity: number };
type Language = "en" | "hi";

const CATEGORIES: { id: string; nameEn: string; nameHi: string }[] = [
  { id: "all", nameEn: "All Categories", nameHi: "सभी श्रेणियाँ" },
  { id: "ingredients", nameEn: "Ingredients", nameHi: "सामग्री" },
  { id: "street-food", nameEn: "Street Food", nameHi: "स्ट्रीट फूड" },
  { id: "beverages", nameEn: "Beverages", nameHi: "पेय पदार्थ" },
  { id: "snacks", nameEn: "Snacks", nameHi: "स्नैक्स" },
  { id: "desserts", nameEn: "Desserts", nameHi: "मिठाई" },
];

export default function BuyerBuyPage() {
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
    () => CATEGORIES.map((c) => ({ id: c.id, name: language === "hi" ? c.nameHi : c.nameEn })),
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
    if (!user || !token) return;
    setLoading(true);
    Promise.all([
      api.getProducts({ supplierOnly: true }),
      api.getBuyerAnalytics(token),
      api.getMyOrders(token),
    ])
      .then(([productsData, analyticsData, ordersData]) => {
        setProducts(productsData.products || []);
        setAnalytics(analyticsData);
        setOrders(ordersData.orders || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user, token]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getSupplierName(p).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b._id).getTime() - new Date(a._id).getTime();
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

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
      const result = await api.createOrder(token, {
        supplierId,
        notes: "Order placed from buyer dashboard",
        items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
      });
      setOrders((prev) => [result.order, ...prev]);
      setCart([]);
      setShowCart(false);
      const updated = await api.getBuyerAnalytics(token);
      setAnalytics(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    }
  }

  if (loading && !products.length) {
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
      <VendorHeader
        user={user}
        language={language}
        onLanguageToggle={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
        onLogout={() => { clearAuth(); window.location.href = "/"; }}
        showShopLink
        showCart
        cartCount={cart.length}
        onCartClick={() => setShowCart(true)}
        showAnalytics
        onAnalyticsClick={() => setShowAnalytics(true)}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label={language === "hi" ? "कुल उत्पाद" : "Total Products"} value={products.length} icon={<Package className="h-8 w-8" />} iconClassName="text-indigo-600" />
          <StatsCard label={language === "hi" ? "कार्ट में आइटम" : "Items in Cart"} value={cart.length} icon={<ShoppingCart className="h-8 w-8" />} iconClassName="text-green-600" />
          <StatsCard label={language === "hi" ? "कुल खर्च" : "Total Spent"} value={formatCurrency(analytics?.totalSpent ?? 0)} icon={<Truck className="h-8 w-8" />} iconClassName="text-yellow-600" />
          <StatsCard label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"} value={analytics?.totalOrders ?? 0} icon={<Bell className="h-8 w-8" />} iconClassName="text-blue-600" />
        </section>

        <ProductGridSection
          products={filteredProducts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
          language={language}
          onAddToCart={addToCart}
          wishlist={wishlist}
          onWishlistToggle={(id) => {
            setWishlist((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
        />
      </main>

      <CartModal open={showCart} onClose={() => setShowCart(false)} items={cart} onUpdateQuantity={updateCartQuantity} onPlaceOrder={placeOrder} language={language} />

      {showAnalytics && analytics ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
              <h2 className="text-xl font-bold">{language === "hi" ? "विश्लेषण डैशबोर्ड" : "Analytics Dashboard"}</h2>
              <button type="button" onClick={() => setShowAnalytics(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <StatsCard label={language === "hi" ? "कुल ऑर्डर" : "Total Orders"} value={analytics.totalOrders} icon={<Bell className="h-8 w-8" />} iconClassName="text-blue-600" />
                <StatsCard label={language === "hi" ? "इस महीने ऑर्डर" : "This Month Orders"} value={analytics.monthOrders} icon={<Calendar className="h-8 w-8" />} iconClassName="text-indigo-600" />
                <StatsCard label={language === "hi" ? "कुल खर्च" : "Total Spent"} value={formatCurrency(analytics.totalSpent)} icon={<Truck className="h-8 w-8" />} iconClassName="text-yellow-600" />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">{language === "hi" ? "हाल के ऑर्डर" : "Recent Orders"}</h3>
                <ul className="space-y-2">
                  {orders.slice(0, 10).map((order) => (
                    <li key={order._id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                      <span className="font-medium">{formatCurrency(order.totalAmount)}</span> <span className="text-zinc-600">· {order.status}</span> <Calendar className="mx-1 inline h-3 w-3" />
                      <span className="text-zinc-500">{formatDateTime(order.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
