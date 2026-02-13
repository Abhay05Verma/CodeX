import type { ReactNode } from "react";

type StatsCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  /** ASUUS-style: icon on the right, use w-8 h-8 and color class (e.g. text-indigo-600) */
  icon?: ReactNode;
  iconClassName?: string;
};

export default function StatsCard({ label, value, hint, icon, iconClassName }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-600">{hint}</p> : null}
        </div>
        {icon ? (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${iconClassName ?? "text-gray-500"}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
