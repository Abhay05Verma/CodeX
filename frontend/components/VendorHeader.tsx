"use client";

import Link from "next/link";
import {
  BarChart3,
  Globe,
  Home,
  LogOut,
  Package,
  Search,
  ShoppingCart,
  Store,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";

type Language = "en" | "hi";

type VendorHeaderProps = {
  user: AuthUser | null;
  language: Language;
  onLanguageToggle: () => void;
  onLogout: () => void;
  showShopLink?: boolean;
  showBrowseLink?: boolean;
  showCart?: boolean;
  cartCount?: number;
  onCartClick?: () => void;
  showAnalytics?: boolean;
  onAnalyticsClick?: () => void;
  /** When set (e.g. "My Shop"), show as page title with same layout as supplier dashboard */
  pageTitle?: string;
  pageSubtitle?: string;
};

export default function VendorHeader({
  user,
  language,
  onLanguageToggle,
  onLogout,
  showShopLink = false,
  showBrowseLink = false,
  showCart = false,
  cartCount = 0,
  onCartClick,
  showAnalytics = false,
  onAnalyticsClick,
  pageTitle,
  pageSubtitle,
}: VendorHeaderProps) {
  const title = pageTitle ?? (language === "hi" ? "वेंटरेस्ट वेंडर पोर्टल" : "Ventrest Vendor Portal");
  const subtitle = pageSubtitle ?? (language === "hi" ? "सर्वोत्तम स्ट्रीट फूड खोजें" : "Discover the best street food");
  return (
    <header className="bg-white/90 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <Link
              href="/buyer"
              className="text-2xl font-bold text-gray-900 transition-opacity hover:opacity-90"
            >
              {title}
            </Link>
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          </div>
          {user ? (
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLanguageToggle}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600"
          >
            <Globe className="h-4 w-4" />
            {language === "hi" ? "भाषा" : "Language"}
          </button>
          {showShopLink ? (
            <Link
              href="/buyer/shop"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Store className="h-4 w-4" />
              {language === "hi" ? "आपकी दुकान" : "Your Shop"}
            </Link>
          ) : null}
          {showBrowseLink ? (
            <Link
              href="/buyer/buy"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Search className="h-4 w-4" />
              {language === "hi" ? "आपूर्तिकर्ताओं से खरीदें" : "Buy from suppliers"}
            </Link>
          ) : null}
          {showAnalytics && onAnalyticsClick ? (
            <button
              type="button"
              onClick={onAnalyticsClick}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700"
            >
              <BarChart3 className="h-4 w-4" />
              {language === "hi" ? "विश्लेषण" : "Analytics"}
            </button>
          ) : null}
          {showCart && onCartClick ? (
            <button
              type="button"
              onClick={onCartClick}
              className="relative inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700"
            >
              <ShoppingCart className="h-4 w-4" />
              {language === "hi" ? "कार्ट" : "Cart"}
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          ) : null}
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-900"
          >
            <Home className="inline h-4 w-4" />
            <span className="ml-1">{language === "hi" ? "होम" : "Home"}</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            {language === "hi" ? "लॉगआउट" : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
