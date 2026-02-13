"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Send, User, Wallet } from "lucide-react";
import VendorHeader from "@/components/VendorHeader";
import { api, type LoanProvider, type LoanRequest } from "@/lib/api";
import { clearAuth, getMe, getStoredToken, type AuthUser } from "@/lib/auth";

type Language = "en" | "hi";

export default function BuyerLoanPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token] = useState<string | null>(() => getStoredToken());
  const [providers, setProviders] = useState<LoanProvider[]>([]);
  const [myRequests, setMyRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "buyer" && me.role !== "admin") {
          setError("This page is only for vendors (buyers) or admin.");
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
    Promise.all([api.getLoanProviders(token), api.getVendorLoanRequests(token)])
      .then(([providersRes, requestsRes]) => {
        setProviders(providersRes.providers || []);
        setMyRequests(requestsRes.requests || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user, token]);

  function getRequestStatus(customerId: string): "pending" | "accepted" | "rejected" | null {
    const req = myRequests.find(
      (r) => String(typeof r.customerId === "object" ? r.customerId?._id : r.customerId) === String(customerId)
    );
    return req ? (req.status as "pending" | "accepted" | "rejected") : null;
  }

  async function sendRequest(customerId: string) {
    if (!token) return;
    setSendingId(customerId);
    setError(null);
    try {
      const { request } = await api.sendLoanRequest(token, customerId);
      setMyRequests((prev) => [request, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setSendingId(null);
    }
  }

  if (loading && !providers.length) {
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
        onLogout={() => {
          clearAuth();
          window.location.href = "/";
        }}
        showShopLink
        showBrowseLink
        pageTitle={language === "hi" ? "ग्राहक से ऋण" : "Loan from Customer"}
        pageSubtitle={language === "hi" ? "सक्रिय ऋणदाता ग्राहकों से जुड़ें" : "Connect with customers who offer loans"}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <Link
          href="/buyer"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "hi" ? "वेंडर होम" : "Vendor home"}
        </Link>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <Wallet className="h-5 w-5 text-amber-600" />
            {language === "hi" ? "सक्रिय ऋणदाता ग्राहक" : "Active loan providers"}
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            {language === "hi"
              ? "इन ग्राहकों ने ऋण देना सक्रिय किया है। कनेक्शन अनुरोध भेजें।"
              : "These customers have lending active. Send them a connection request."}
          </p>

          {providers.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 py-12 text-center">
              <User className="mx-auto mb-3 h-12 w-12 text-zinc-400" />
              <p className="text-sm text-gray-600">
                {language === "hi" ? "अभी कोई सक्रिय ऋणदाता नहीं।" : "No active loan providers yet."}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {language === "hi" ? "ग्राहक लेंडिंग सक्रिय करेंगे तो यहाँ दिखेंगे।" : "Customers will appear here when they turn on lending."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {providers.map((provider) => {
                const status = getRequestStatus(provider._id);
                return (
                  <li
                    key={provider._id}
                    className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        {provider.email ? (
                          <p className="text-sm text-gray-600">{provider.email}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "pending" && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                          {language === "hi" ? "लंबित" : "Pending"}
                        </span>
                      )}
                      {status === "accepted" && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                          {language === "hi" ? "स्वीकृत" : "Accepted"}
                        </span>
                      )}
                      {status === "rejected" && (
                        <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700">
                          {language === "hi" ? "अस्वीकृत" : "Rejected"}
                        </span>
                      )}
                      {!status && (
                        <button
                          type="button"
                          disabled={sendingId === provider._id}
                          onClick={() => sendRequest(provider._id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {sendingId === provider._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {language === "hi" ? "अनुरोध भेजें" : "Send request"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
