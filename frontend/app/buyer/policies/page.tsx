"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import VendorHeader from "@/components/VendorHeader";
import PolicyStatusBadge from "@/components/PolicyStatusBadge";
import { GOV_POLICIES, getPoliciesByStatus, type GovPolicy, type PolicyStatus } from "@/lib/govPolicies";
import { clearAuth, getMe, type AuthUser } from "@/lib/auth";

type Language = "en" | "hi";

const STATUS_ORDER: PolicyStatus[] = ["ongoing", "upcoming", "past"];
const SECTION_LABELS: Record<PolicyStatus, { en: string; hi: string }> = {
  ongoing: { en: "Ongoing", hi: "चल रही योजनाएँ" },
  upcoming: { en: "Upcoming", hi: "आगामी योजनाएँ" },
  past: { en: "Past", hi: "समाप्त योजनाएँ" },
};

export default function BuyerPoliciesListPage() {
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
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Authentication required");
      })
      .finally(() => setLoading(false));
  }, []);

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
        pageTitle={language === "hi" ? "सरकारी नीतियाँ" : "Gov Policies"}
        pageSubtitle={language === "hi" ? "केंद्र और राज्य की योजनाएँ" : "Central & state government schemes"}
      />

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : (
          <>
            <Link
              href="/buyer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === "hi" ? "वेंडर होम" : "Vendor home"}
            </Link>

            {STATUS_ORDER.map((status) => {
              const policies = getPoliciesByStatus(status);
              if (policies.length === 0) return null;
              const labels = SECTION_LABELS[status];
              return (
                <section key={status} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                    <FileText className="h-5 w-5 text-teal-600" />
                    {language === "hi" ? labels.hi : labels.en}
                  </h2>
                  <ul className="space-y-3">
                    {policies.map((policy) => (
                      <li key={policy.id}>
                        <Link
                          href={`/buyer/policies/${policy.id}`}
                          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/30 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{policy.name}</p>
                            {policy.shortDescription ? (
                              <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">
                                {policy.shortDescription}
                              </p>
                            ) : null}
                          </div>
                          <div className="shrink-0">
                            <PolicyStatusBadge status={policy.status} language={language} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
