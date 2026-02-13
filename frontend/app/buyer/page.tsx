"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Search, Store, Wallet, FileText } from "lucide-react";
import VendorHeader from "@/components/VendorHeader";
import { clearAuth, getMe, type AuthUser } from "@/lib/auth";

type Language = "en" | "hi";

export default function VendorHomePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "buyer" && me.role !== "admin") {
          setError("This page is only for vendors (buyers) or admin.");
          return;
        }
        setUser(me);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Authentication required"))
      .finally(() => setLoading(false));
  }, []);

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
      <VendorHeader
        user={user}
        language={language}
        onLanguageToggle={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
        onLogout={() => {
          clearAuth();
          window.location.href = "/";
        }}
      />

      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-16">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
        ) : (
          <>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">
              {language === "hi" ? "क्या करना चाहते हैं?" : "What would you like to do?"}
            </h2>
            <p className="mb-10 text-gray-600">
              {language === "hi"
                ? "आपूर्तिकर्ताओं से खरीदें या अपनी दुकान के लिए आइटम जोड़ें"
                : "Buy from suppliers or add items to your shop for customers"}
            </p>

            <div className="flex w-full max-w-5xl flex-col gap-6 sm:flex-row sm:flex-wrap">
              <Link
                href="/buyer/buy"
                className="group flex flex-1 flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 transition-transform duration-300 group-hover:scale-110">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">
                  {language === "hi" ? "आपूर्तिकर्ताओं से खरीदें" : "Buy from suppliers"}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                  {language === "hi"
                    ? "उत्पाद ब्राउज़ करें, कार्ट में डालें और ऑर्डर करें"
                    : "Browse products, add to cart and place orders"}
                </p>
                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 group-hover:scale-[1.02]">
                  {language === "hi" ? "खरीदारी करें" : "Shop"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/buyer/shop"
                className="group flex flex-1 flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">
                  {language === "hi" ? "मेरी दुकान" : "My shop"}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                  {language === "hi"
                    ? "ग्राहकों के लिए आइटम जोड़ें और ऑर्डर देखें"
                    : "Add items for customers and view orders"}
                </p>
                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 group-hover:scale-[1.02]">
                  {language === "hi" ? "दुकान खोलें" : "Open shop"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/buyer/loan"
                className="group flex flex-1 flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:min-w-[280px]"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 transition-transform duration-300 group-hover:scale-110">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">
                  {language === "hi" ? "ग्राहक से ऋण" : "Loan from Customer"}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                  {language === "hi"
                    ? "सक्रिय ऋणदाता ग्राहकों से कनेक्शन अनुरोध भेजें"
                    : "Send connection requests to customers who offer loans"}
                </p>
                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 group-hover:scale-[1.02]">
                  {language === "hi" ? "ऋण देखें" : "View lenders"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/buyer/policies"
                className="group flex flex-1 flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:min-w-[280px]"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 transition-transform duration-300 group-hover:scale-110">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">
                  {language === "hi" ? "सरकारी नीतियाँ" : "Gov Policies"}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                  {language === "hi"
                    ? "केंद्र और राज्य की योजनाएँ, पात्रता और आवेदन तिथियाँ देखें"
                    : "View central & state schemes, eligibility and application dates"}
                </p>
                <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 group-hover:scale-[1.02]">
                  {language === "hi" ? "नीतियाँ देखें" : "View policies"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
