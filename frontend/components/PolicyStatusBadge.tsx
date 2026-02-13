"use client";

import type { PolicyStatus } from "@/lib/govPolicies";

type PolicyStatusBadgeProps = {
  status: PolicyStatus;
  language?: "en" | "hi";
  className?: string;
};

const LABELS: Record<PolicyStatus, { en: string; hi: string; className: string }> = {
  past: {
    en: "Past",
    hi: "समाप्त",
    className: "border border-zinc-400 bg-zinc-100 text-zinc-700",
  },
  ongoing: {
    en: "Ongoing",
    hi: "चल रहा",
    className: "border border-green-500 bg-green-50 text-green-800",
  },
  upcoming: {
    en: "Upcoming",
    hi: "आगामी",
    className: "border border-amber-500 bg-amber-50 text-amber-800",
  },
};

export default function PolicyStatusBadge({ status, language = "en", className = "" }: PolicyStatusBadgeProps) {
  const { en, hi, className: statusClass } = LABELS[status];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass} ${className}`}
      title={status}
    >
      {language === "hi" ? hi : en}
    </span>
  );
}
