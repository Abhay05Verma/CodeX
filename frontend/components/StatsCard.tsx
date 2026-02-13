type StatsCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function StatsCard({ label, value, hint }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </div>
  );
}
