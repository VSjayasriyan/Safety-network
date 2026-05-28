import type { EmergencyAlert } from "@surakshanet/shared";
import { AlertTriangle } from "lucide-react";

export function AlertList({ alerts }: { alerts: EmergencyAlert[] }) {
  if (!alerts.length) {
    return <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.04]">No active alerts found for the current query.</div>;
  }
  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <article key={alert.id} className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 text-signal" size={20} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{alert.title}</h3>
                <span className="rounded bg-ember px-2 py-0.5 text-xs font-medium text-white">{alert.severity}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{alert.source} · {alert.area}</p>
              {alert.instructions?.[0] && <p className="mt-2 text-sm">{alert.instructions[0]}</p>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
