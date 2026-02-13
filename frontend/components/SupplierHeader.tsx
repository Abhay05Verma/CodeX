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

type SupplierHeaderProps = {
  user: AuthUser | null;
  language: Language;
  onLanguageToggle: () => void;
  onLogout: () => void;
  showShopLink?: boolean;
  showBrowseLink?: boolean;
  showManageLink?: boolean;
  orderCount?: number;
  onAnalyticsClick?: () => void;
};

export default function SupplierHeader({
  user,
  language,
  onLanguageToggle,
  onLogout,
  showShopLink = false,
  showBrowseLink = false,
  showManageLink = false,
  orderCount = 0,
  onAnalyticsClick,
}: SupplierHeaderProps) {
  return (
    <header className="bg-white/90 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <Link
              href="/supplier"
              className="text-2xl font-bold text-gray-900 transition-opacity hover:opacity-90"
            >
              {language === "hi" ? "वेंटरेस्ट सप्लायर" : "Ventrest Supplier"}
            </Link>
            <p className="text-sm text-gray-600">
              {language === "hi" ? "अपने ऑर्डर और उत्पाद प्रबंधन" : "Orders and product management"}
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
              href="/supplier/shop"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Store className="h-4 w-4" />
              {language === "hi" ? "आपकी दुकान" : "Your Shop"}
              {orderCount > 0 ? (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {orderCount > 99 ? "99+" : orderCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          {showBrowseLink ? (
            <Link
              href="/supplier/browse"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Search className="h-4 w-4" />
              {language === "hi" ? "उत्पाद ब्राउज़ करें" : "Browse Products"}
            </Link>
          ) : null}
          {showManageLink ? (
            <Link
              href="/supplier/manage"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Package className="h-4 w-4" />
              {language === "hi" ? "उत्पाद प्रबंधन" : "Manage Products"}
            </Link>
          ) : null}
          {onAnalyticsClick ? (
            <button
              type="button"
              onClick={onAnalyticsClick}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700"
            >
              <BarChart3 className="h-4 w-4" />
              {language === "hi" ? "विश्लेषण" : "Analytics"}
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
