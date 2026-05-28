import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, tone, icon: Icon }: { label: string; value: string; tone?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#181a1c] p-4 shadow-[0_16px_34px_rgba(0,0,0,.22)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{label}</span>
        <Icon className={tone ?? "text-signal"} size={20} />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-normal text-white">{value}</div>
    </div>
  );
}
