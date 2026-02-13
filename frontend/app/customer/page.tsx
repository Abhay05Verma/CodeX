"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  LogOut,
  Package,
  ShoppingCart,
  Globe,
  User,
  BadgeCheck,
  Trash2,
  X,
  Wallet,
  Check,
  Loader2,
} from "lucide-react";
import ProductGridSection from "@/components/ProductGridSection";
import CartModal from "@/components/CartModal";
import { api, type CustomerProfile, type CustomerCartVendor, type Product, type LoanRequest } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";
import { getSupplierId, getSupplierName } from "@/lib/productUtils";

type Language = "en" | "hi";
type CartItem = Product & { quantity: number };

const CATEGORIES = [
  { id: "all", nameEn: "All Categories", nameHi: "सभी श्रेणियाँ" },
  { id: "ingredients", nameEn: "Ingredients", nameHi: "सामग्री" },
  { id: "street-food", nameEn: "Street Food", nameHi: "स्ट्रीट फूड" },
  { id: "beverages", nameEn: "Beverages", nameHi: "पेय पदार्थ" },
  { id: "snacks", nameEn: "Snacks", nameHi: "स्नैक्स" },
  { id: "desserts", nameEn: "Desserts", nameHi: "मिठाई" },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

export default function CustomerDashboardPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lendingToggle, setLendingToggle] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [shopCart, setShopCart] = useState<CartItem[]>([]);
  const [showShopCart, setShowShopCart] = useState(false);
  const [shopSearch, setShopSearch] = useState("");
  const [shopCategory, setShopCategory] = useState("all");
  const [shopSort, setShopSort] = useState("recent");
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const token = getStoredToken();
  const pendingLoanCount = loanRequests.filter((r) => r.status === "pending").length;
  const categories = useMemo(
    () => CATEGORIES.map((c) => ({ id: c.id, name: language === "hi" ? c.nameHi : c.nameEn })),
    [language]
  );

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "customer" && me.role !== "admin") {
          setError("This dashboard is for customers only.");
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
    api
      .getCustomerProfile(token)
      .then((data) => {
        setProfile(data.customer);
        setLendingToggle(data.customer?.isLendingActive ?? false);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user, token]);

  useEffect(() => {
    if (!user) return;
    api
      .getProducts({ vendorOnly: true })
      .then((data) => setVendorProducts(data.products || []))
      .catch(() => setVendorProducts([]));
  }, [user]);

  useEffect(() => {
    if (!user || !token) return;
    api
      .getCustomerLoanRequests(token)
      .then((data) => setLoanRequests(data.requests || []))
      .catch(() => setLoanRequests([]));
  }, [user, token]);

  const filteredVendorProducts = useMemo(() => {
    return vendorProducts
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(shopSearch.toLowerCase()) ||
          getSupplierName(p).toLowerCase().includes(shopSearch.toLowerCase());
        const matchesCategory = shopCategory === "all" || p.category === shopCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (shopSort === "price-low") return a.price - b.price;
        if (shopSort === "price-high") return b.price - a.price;
        if (shopSort === "name") return a.name.localeCompare(b.name);
        return new Date(b._id).getTime() - new Date(a._id).getTime();
      });
  }, [vendorProducts, shopSearch, shopCategory, shopSort]);

  function addToShopCart(product: Product) {
    const vendorId = getSupplierId(product);
    if (!vendorId) {
      setError("Product vendor is missing.");
      return;
    }
    setError(null);
    setShopCart((prev) => {
      if (prev.length > 0) {
        const existingVendorId = getSupplierId(prev[0]);
        if (existingVendorId && existingVendorId !== vendorId) {
          setError("Cart can contain products from one vendor at a time.");
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

  function updateShopCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setShopCart((prev) => prev.filter((item) => item._id !== productId));
      return;
    }
    setShopCart((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      )
    );
  }

  async function placeShopOrder() {
    if (!token) return setError("Authentication required.");
    if (shopCart.length === 0) return setError("Add at least one product to cart.");
    const vendorId = getSupplierId(shopCart[0]);
    if (!vendorId) return setError("Vendor not found for cart.");
    try {
      setError(null);
      await api.createOrder(token, {
        supplierId: vendorId,
        notes: "Order from customer dashboard",
        items: shopCart.map((item) => ({ productId: item._id, quantity: item.quantity })),
      });
      setShopCart([]);
      setShowShopCart(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    }
  }

  async function toggleLending() {
    if (!token) return;
    const next = !lendingToggle;
    try {
      await api.updateCustomerProfile(token, { isLendingActive: next });
      setLendingToggle(next);
      setProfile((p) => (p ? { ...p, isLendingActive: next } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function respondToLoanRequest(requestId: string, status: "accepted" | "rejected") {
    if (!token) return;
    setRespondingId(requestId);
    setError(null);
    try {
      const { request } = await api.respondToLoanRequest(token, requestId, status);
      setLoanRequests((prev) => prev.map((r) => (r._id === requestId ? request : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update request");
    } finally {
      setRespondingId(null);
    }
  }

  async function removeFavorite(vendorId: string) {
    if (!token || !profile) return;
    try {
      await api.removeCustomerFavorite(token, vendorId);
      setProfile((p) =>
        p
          ? { ...p, favorites: p.favorites.filter((f) => (f as { _id: string })._id !== vendorId) }
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  function logout() {
    clearAuth();
    window.location.href = "/";
  }

  if (loading && !profile) {
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
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <Link
                href="/"
                className="text-2xl font-bold text-gray-900 transition-opacity hover:opacity-90"
              >
                {language === "hi" ? "वेंटरेस्ट ग्राहक" : "Ventrest Customer"}
              </Link>
              <p className="text-sm text-gray-600">
                {language === "hi" ? "फेवरेट्स, कार्ट और लेंडिंग" : "Favorites, cart & lending"}
              </p>
            </div>
            {user ? (
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {pendingLoanCount > 0 ? (
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
                {pendingLoanCount} {language === "hi" ? "ऋण अनुरोध" : "loan request(s)"}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setShowShopCart(true)}
              className="relative inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <ShoppingCart className="h-4 w-4" />
              {language === "hi" ? "कार्ट" : "Cart"}
              {shopCart.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {shopCart.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600"
            >
              <Globe className="h-4 w-4" />
              {language === "hi" ? "भाषा" : "Language"}
            </button>
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

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {/* Lending */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <BadgeCheck className="h-5 w-5 text-indigo-600" />
            {language === "hi" ? "लोन नियंत्रण" : "Loan Control"}
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={lendingToggle}
                onChange={toggleLending}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {language === "hi" ? "लेंडिंग सक्रिय करें" : "Lending active"}
              </span>
            </label>
            <p className="text-sm text-gray-600">
              {language === "hi" ? "कुल उधार राशि:" : "Total lent:"}{" "}
              <strong>{formatCurrency(profile?.totalLentAmount ?? 0)}</strong>
            </p>
            <p className="text-xs text-gray-500">
              {language === "hi" ? "चालू करने पर वेंडर आपको ऋण कनेक्शन अनुरोध भेज सकते हैं।" : "When on, vendors can send you loan connection requests."}
            </p>
            {profile?.impactBadges?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.impactBadges.map((badge, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Loan requests from vendors */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <Wallet className="h-5 w-5 text-amber-600" />
            {language === "hi" ? "ऋण अनुरोध" : "Loan requests"}
            {pendingLoanCount > 0 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {pendingLoanCount} {language === "hi" ? "नए" : "new"}
              </span>
            ) : null}
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            {language === "hi" ? "वेंडर आपसे ऋण कनेक्शन के लिए अनुरोध भेज सकते हैं। स्वीकार या अस्वीकार करें।" : "Vendors can send you loan connection requests. Accept or reject below."}
          </p>
          {loanRequests.length === 0 ? (
            <p className="text-sm text-gray-500">
              {language === "hi" ? "अभी कोई ऋण अनुरोध नहीं।" : "No loan requests yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {loanRequests.map((req) => {
                const vendor = req.vendorId;
                const vendorName = typeof vendor === "object" && vendor?.name ? vendor.name : "Vendor";
                const vendorEmail = typeof vendor === "object" && vendor?.email ? vendor.email : null;
                const isPending = req.status === "pending";
                return (
                  <li
                    key={req._id}
                    className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{vendorName}</p>
                      {vendorEmail ? <p className="text-sm text-gray-600">{vendorEmail}</p> : null}
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          req.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : req.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {req.status === "pending"
                          ? language === "hi"
                            ? "लंबित"
                            : "Pending"
                          : req.status === "accepted"
                            ? language === "hi"
                              ? "स्वीकृत"
                              : "Accepted"
                            : language === "hi"
                              ? "अस्वीकृत"
                              : "Rejected"}
                      </span>
                    </div>
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={respondingId === req._id}
                          onClick={() => respondToLoanRequest(req._id, "accepted")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {respondingId === req._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          {language === "hi" ? "स्वीकार" : "Accept"}
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === req._id}
                          onClick={() => respondToLoanRequest(req._id, "rejected")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-zinc-50 disabled:opacity-60"
                        >
                          <X className="h-4 w-4" />
                          {language === "hi" ? "अस्वीकार" : "Reject"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Favorites (Vendors = Suppliers in CodeX) */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <Heart className="h-5 w-5 text-red-500" />
            {language === "hi" ? "पसंदीदा वेंडर" : "Favorite Vendors"}
          </h2>
          {profile?.favorites?.length ? (
            <ul className="space-y-2">
              {profile.favorites.map((fav: { _id: string; name?: string; email?: string }) => (
                <li
                  key={fav._id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{fav.name ?? "Vendor"}</p>
                    <p className="text-sm text-gray-500">{fav.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavorite(fav._id)}
                    className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title={language === "hi" ? "हटाएं" : "Remove"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              {language === "hi" ? "अभी कोई पसंदीदा वेंडर नहीं।" : "No favorite vendors yet."}
            </p>
          )}
        </section>

        {/* Cart */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            {language === "hi" ? "कार्ट" : "Cart"}
          </h2>
          {profile?.cart?.length ? (
            <div className="space-y-4">
              {(profile.cart as CustomerCartVendor[]).map((entry, idx) => {
                const vendor = entry.vendorId;
                const vendorName =
                  typeof vendor === "object" && vendor?.name ? vendor.name : "Vendor";
                const items = entry.items || [];
                const total = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="mb-2 font-medium text-gray-800">{vendorName}</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {items.map((item, i) => (
                        <li key={i}>
                          {item.itemName} × {item.qty} — {formatCurrency((item.price || 0) * (item.qty || 1))}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm font-semibold">
                      {language === "hi" ? "कुल:" : "Total:"} {formatCurrency(total)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {language === "hi" ? "कार्ट खाली है।" : "Cart is empty."}
            </p>
          )}
        </section>

        {/* Shop from vendors only */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <Package className="h-5 w-5 text-indigo-600" />
            {language === "hi" ? "वेंडर्स से खरीदें" : "Shop from vendors"}
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            {language === "hi" ? "केवल वेंडर उत्पाद (स्ट्रीट फूड वेंडर्स)। खरीदने के लिए कार्ट में जोड़ें और ऑर्डर करें।" : "Vendor products only (street food vendors). Add to cart and place order to buy."}
          </p>
          <ProductGridSection
            products={filteredVendorProducts}
            searchQuery={shopSearch}
            onSearchChange={setShopSearch}
            selectedCategory={shopCategory}
            onCategoryChange={setShopCategory}
            sortBy={shopSort}
            onSortChange={setShopSort}
            categories={categories}
            language={language}
            onAddToCart={addToShopCart}
          />
        </section>

      </main>

      <CartModal
        open={showShopCart}
        onClose={() => setShowShopCart(false)}
        items={shopCart}
        onUpdateQuantity={updateShopCartQuantity}
        onPlaceOrder={placeShopOrder}
        language={language}
      />
    </div>
  );
}
