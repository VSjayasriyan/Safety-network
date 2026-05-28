"use client";

import { Link2, Square, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Coordinates } from "@surakshanet/shared";
import { saveLastLocation } from "@/lib/offline";

export function LiveSharePanel({ location }: { location: Coordinates | null }) {
  const [activeUntil, setActiveUntil] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const sessionId = useMemo(() => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), []);
  const active = Boolean(activeUntil && activeUntil > Date.now());
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/live-map?share=${sessionId}` : "";

  useEffect(() => {
    if (!active || !location) return;
    saveLastLocation(location);
    localStorage.setItem(`surakshanet:live-share:${sessionId}`, JSON.stringify({ location, activeUntil }));
  }, [active, activeUntil, location, sessionId]);

  useEffect(() => {
    if (!activeUntil) return;
    const id = window.setInterval(() => {
      if (activeUntil <= Date.now()) setActiveUntil(null);
    }, 5000);
    return () => window.clearInterval(id);
  }, [activeUntil]);

  function start() {
    setActiveUntil(Date.now() + durationMinutes * 60_000);
  }

  async function copyLink() {
    if (!active) start();
    await navigator.clipboard?.writeText(shareUrl);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="text-rescue" size={18} />
        <h2 className="font-semibold">Live Location Sharing</h2>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min={5} max={240} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="w-24 rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-white/10" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">minutes</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-md bg-rescue px-3 py-2 text-sm font-medium text-zinc-950">
          <TimerReset size={16} />
          Start and copy link
        </button>
        <button onClick={() => setActiveUntil(null)} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-white/10">
          <Square size={16} />
          Stop
        </button>
      </div>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{active ? `Sharing until ${new Date(activeUntil!).toLocaleTimeString()}` : "Location sharing is off."}</p>
    </section>
  );
}
