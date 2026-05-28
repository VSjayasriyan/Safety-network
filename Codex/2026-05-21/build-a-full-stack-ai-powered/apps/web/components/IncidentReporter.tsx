"use client";

import { Flag, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Coordinates, DisasterType } from "@surakshanet/shared";
import { reportIncident } from "@/lib/api";

export function IncidentReporter({ location }: { location: Coordinates | null }) {
  const [type, setType] = useState<DisasterType>("flood");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!location) {
      setStatus("Enable GPS before reporting an incident.");
      return;
    }
    await reportIncident({ ...location, type, description, severity: 3 });
    setDescription("");
    setStatus("Incident submitted for verification.");
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex items-center gap-2">
        <Flag className="text-signal" size={18} />
        <h2 className="font-semibold">Crowd Incident Report</h2>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <select value={type} onChange={(event) => setType(event.target.value as DisasterType)} className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-white/10">
          {["flood", "earthquake", "cyclone", "tsunami", "fire", "riot", "weather", "medical"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what you see" className="min-h-24 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-white/10" />
        <button className="inline-flex items-center gap-2 rounded-md bg-ember px-3 py-2 text-sm font-medium text-white">
          <Send size={16} />
          Submit
        </button>
      </form>
      {status && <p className="mt-2 text-sm text-rescue">{status}</p>}
    </section>
  );
}
