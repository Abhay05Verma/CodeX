"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, ExternalLink, FileText, ListChecks } from "lucide-react";
import VendorHeader from "@/components/VendorHeader";
import PolicyStatusBadge from "@/components/PolicyStatusBadge";
import { getPolicyById } from "@/lib/govPolicies";
import { clearAuth, getMe, type AuthUser } from "@/lib/auth";

type Language = "en" | "hi";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BuyerPolicyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [language, setLanguage] = useState<Language>("en");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const policy = id ? getPolicyById(id) : undefined;

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

  useEffect(() => {
    if (!loading && id && !policy) {
      setError("Policy not found.");
    }
  }, [loading, id, policy]);

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

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
        />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error || "Policy not found."}
          </p>
          <Link
            href="/buyer/policies"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === "hi" ? "नीतियों की सूची" : "Back to policies"}
          </Link>
        </main>
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
        pageSubtitle={policy.name}
      />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/buyer/policies"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "hi" ? "नीतियों की सूची" : "Back to policies"}
        </Link>

        <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{policy.name}</h1>
            <PolicyStatusBadge status={policy.status} language={language} />
          </div>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-800">
                <FileText className="h-4 w-4 text-teal-600" />
                {language === "hi" ? "विवरण" : "Description"}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{policy.description}</p>
            </section>

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-800">
                <ListChecks className="h-4 w-4 text-teal-600" />
                {language === "hi" ? "आवश्यकताएँ / पात्रता" : "Requirements / Eligibility"}
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                {policy.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-800">
                <Calendar className="h-4 w-4 text-teal-600" />
                {language === "hi" ? "आवेदन की अंतिम तिथि" : "Last Date to Apply"}
              </h2>
              <p className="text-sm text-gray-700">{formatDate(policy.lastDateToApply)}</p>
            </section>

            <section>
              <a
                href={policy.officialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100"
              >
                <ExternalLink className="h-4 w-4" />
                {language === "hi" ? "आधिकारिक लिंक" : "Official Link"}
              </a>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
