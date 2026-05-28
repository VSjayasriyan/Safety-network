import { Database, RadioTower, ShieldAlert, Users } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Feed Connectors" value="80+" icon={RadioTower} />
        <MetricCard label="Authority Sources" value="Ready" icon={ShieldAlert} tone="text-ember" />
        <MetricCard label="PostGIS Tables" value="6" icon={Database} tone="text-rescue" />
        <MetricCard label="Responder Roles" value="RBAC" icon={Users} />
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="font-semibold">Operational Controls</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Use this page to manage verified shelters, approve crowd reports, monitor ingest health, and publish authority notices. Production deployments should gate it behind Firebase Auth custom claims.</p>
      </section>
    </div>
  );
}
