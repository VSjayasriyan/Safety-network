"use client";

import useSWR from "swr";
import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Check,
  ChevronDown,
  Cloud,
  Database,
  HardDrive,
  MapPinned,
  MapPin,
  Route,
  ShieldCheck,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { getAlerts, getPlaces } from "@/lib/api";
import { useLocation } from "@/lib/useLocation";
import { AlertList } from "./AlertList";
import { AssistantPanel } from "./AssistantPanel";
import { LiveMap } from "./LiveMap";
import { MetricCard } from "./MetricCard";
import { PlaceList } from "./PlaceList";
import { SosButton } from "./SosButton";
import { IncidentReporter } from "./IncidentReporter";
import { LiveSharePanel } from "./LiveSharePanel";

export function SafetyWorkspace({ view = "home" }: { view?: "home" | "map" | "dashboard" | "assistant" | "nearby" | "alerts" | "analytics" }) {
  const [batterySaver, setBatterySaver] = useState(false);
  const { location, lastKnownLocation, accuracyMeters, error, watching } = useLocation({ batterySaver });
  const { data: alertData } = useSWR(location ? ["alerts", location] : "alerts-global", () => getAlerts(location ?? undefined), { refreshInterval: 60_000 });
  const { data: placeData } = useSWR(location ? ["places", location] : null, () => getPlaces(location!, 8000), { refreshInterval: 45_000 });
  const alerts = alertData?.alerts ?? [];
  const places = placeData?.places ?? [];
  const best = placeData?.best;
  const severe = alerts.filter((alert) => ["severe", "extreme"].includes(alert.severity)).length;

  const metrics = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="GPS Tracking" value={watching ? "Live" : "Idle"} icon={MapPin} tone="text-rescue" />
      <MetricCard label="Active Alerts" value={String(alerts.length)} icon={AlertTriangle} tone="text-signal" />
      <MetricCard label="Severe Threats" value={String(severe)} icon={Activity} tone="text-ember" />
      <MetricCard label="Best Safety Score" value={best ? String(best.safetyScore) : "--"} icon={ShieldCheck} tone="text-rescue" />
    </div>
  );

  if (view === "map") return <LiveMap location={location} accuracyMeters={accuracyMeters} places={places} alerts={alerts} />;
  if (view === "assistant") return <AssistantPanel location={location} />;
  if (view === "nearby") return <PlaceList places={places} />;
  if (view === "alerts") return <AlertList alerts={alerts} />;
  if (view === "analytics") return <Analytics alerts={alerts.length} places={places.length} bestScore={best?.safetyScore ?? 0} />;

  return (
    <div className="mx-auto max-w-[1500px]">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[18px] bg-[#111214] shadow-[0_0_0_1px_rgba(255,255,255,.04),0_26px_60px_rgba(0,0,0,.28)]">
        <div className="relative overflow-hidden rounded-t-[18px] bg-[#1d1f20]">
          <div className="grid min-h-[245px] lg:grid-cols-[1fr_.58fr]">
            <div className="relative z-10 p-6 sm:p-8">
              <p className="text-base font-semibold text-zinc-300">New from Suraksha Earth</p>
              <h1 className="mt-6 max-w-3xl text-3xl font-medium leading-tight text-zinc-100 sm:text-4xl lg:text-[42px]">
                Unlock live safety layers like hazard contours to see terrain risk before it reaches you
              </h1>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button className="rounded-full bg-[#215b93] px-7 py-4 text-sm font-bold text-[#d7ebff] shadow-[0_16px_34px_rgba(33,91,147,.32)]">
                  Explore data layers
                </button>
                <button onClick={() => setBatterySaver((value) => !value)} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-[#abc8ee] transition hover:bg-white/[0.08]">
                  <BatteryMedium size={17} />
                  {batterySaver ? "Battery saver GPS" : "High accuracy GPS"}
                </button>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-400">
                {accuracyMeters && <span>Accuracy: {Math.round(accuracyMeters)}m</span>}
                {lastKnownLocation?.savedAt && <span>Offline last fix saved</span>}
                {error && <span className="text-signal">{error}</span>}
              </div>
            </div>
            <div className="relative min-h-[245px] overflow-hidden bg-[#d8eadb]">
              <div className="absolute inset-0 terrain-texture opacity-95" />
              <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#1d1f20] to-transparent" />
              <button className="absolute right-6 top-6 grid size-8 place-items-center rounded-full bg-white/20 text-[#222]" aria-label="Close announcement">
                <X size={22} />
              </button>
              <div className="absolute bottom-7 right-7 grid gap-2 text-[#425448]">
                <span className="h-0.5 w-28 rotate-12 rounded-full bg-[#829184]" />
                <span className="ml-8 h-0.5 w-40 -rotate-6 rounded-full bg-[#829184]" />
                <span className="h-0.5 w-32 rotate-3 rounded-full bg-[#829184]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-3xl font-medium text-white">Projects</h2>
            <div className="inline-grid w-fit grid-cols-2 rounded-full border border-zinc-500/80 p-0.5 text-sm font-semibold text-zinc-300">
              <button className="inline-flex items-center gap-2 rounded-full bg-[#235d95] px-5 py-3 text-[#d7ebff]">
                <Check size={18} />
                Cloud drive
              </button>
              <button className="inline-flex items-center gap-2 rounded-full px-5 py-3">
                <HardDrive size={18} />
                Local device
              </button>
            </div>
          </div>

          <div className="mt-9 flex items-center gap-3">
            <ChevronDown size={22} className="text-zinc-300" />
            <h3 className="text-xl font-semibold text-white">Shortcuts</h3>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="rounded-md border border-zinc-600 px-4 py-3 text-sm font-semibold text-zinc-500">People</button>
            <button className="inline-flex items-center gap-3 rounded-md border border-zinc-500 px-4 py-3 text-sm font-semibold text-zinc-200">
              Modified
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="text-sm font-semibold text-zinc-300">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Owner</th>
                  <th className="px-5 py-4">Storage used</th>
                  <th className="px-5 py-4">Last modified</th>
                </tr>
              </thead>
              <tbody className="border-t border-zinc-700/80 text-sm text-zinc-400">
                {([
                  ["Flood response corridor", "Command desk", "148 MB", "12 minutes ago", Route],
                  ["Shelter availability grid", "Relief ops", "94 MB", "Today", Database],
                  ["Live hazard map", "Field team", "322 MB", "Yesterday", MapPinned]
                ] satisfies [string, string, string, string, LucideIcon][]).map(([name, owner, storage, modified, Icon]) => (
                  <tr key={String(name)} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-3 font-medium text-zinc-100">
                        <Icon size={18} className="text-[#8fc6ff]" />
                        {name}
                      </span>
                    </td>
                    <td className="px-5 py-4">{owner}</td>
                    <td className="px-5 py-4">{storage}</td>
                    <td className="px-5 py-4">{modified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-5 py-9 xl:grid-cols-[1fr_360px]">
            <div className="grid min-h-[270px] place-items-center rounded-lg border border-dashed border-zinc-700/70 bg-[#101112] p-8 text-center">
              <div>
                <div className="mx-auto grid size-24 place-items-center rounded-[8px] border border-zinc-700 bg-[#1b1d1f] text-zinc-400">
                  <Cloud size={42} />
                </div>
                <p className="mt-6 text-3xl font-medium text-white">Projects synced</p>
                <p className="mt-2 max-w-lg text-sm text-zinc-400">Live incident maps, shelter plans, and AI guidance boards are ready for command review.</p>
              </div>
            </div>
            <div className="space-y-4">
              <SosButton location={location} lastKnownLocation={lastKnownLocation} />
              {metrics}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <LiveMap location={location} accuracyMeters={accuracyMeters} places={places} alerts={alerts} />
        <div className="space-y-5">
          <AssistantPanel location={location} />
          <LiveSharePanel location={location} />
          <IncidentReporter location={location} />
          <AlertList alerts={alerts.slice(0, 3)} />
        </div>
      </div>
      <div className="mt-5">
        <PlaceList places={places} />
      </div>
    </div>
  );
}

function Analytics({ alerts, places, bestScore }: { alerts: number; places: number; bestScore: number }) {
  const rows = [
    ["Alert ingestion latency", "< 60 sec with cache warm"],
    ["Safe place candidates", String(places)],
    ["Active alert feeds", String(alerts)],
    ["Predicted best zone score", String(bestScore)]
  ];
  return (
    <div className="rounded-lg border border-white/10 bg-[#111214] p-5">
      <h2 className="text-xl font-semibold">Emergency Analytics</h2>
      <div className="mt-4 divide-y divide-white/10">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-3 text-sm">
            <span className="text-zinc-400">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
