"use client";

import { Bot, Navigation, Send, Volume2 } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Coordinates, SafePlace } from "@surakshanet/shared";
import { chat, getSafeRoute } from "@/lib/api";
import { googleDirectionsLink } from "@/lib/googleMaps";

const quickPrompts = [
  "Where should I go during a flood?",
  "Find nearest safe hospital.",
  "Show safest route.",
  "What should I do in an earthquake?"
];

export function AssistantPanel({ location }: { location: Coordinates | null }) {
  const [message, setMessage] = useState(quickPrompts[0]);
  const [answer, setAnswer] = useState("Ask SurakshaNet AI for location-aware emergency guidance.");
  const [recommendedPlace, setRecommendedPlace] = useState<SafePlace | null>(null);
  const [routeNote, setRouteNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    try {
      const result = await chat(message, location ?? undefined);
      setAnswer(result.answer);
      setRecommendedPlace(result.recommendedPlace ?? null);
      if (location && result.recommendedPlace) {
        const route = await getSafeRoute(location, result.recommendedPlace.coordinates);
        setRouteNote(`Route risk ${route.routeRiskScore}/100${route.distance ? ` · ${route.distance}` : ""}${route.eta ? ` · ${route.eta}` : ""}`);
      } else {
        setRouteNote("");
      }
    } finally {
      setLoading(false);
    }
  }

  function speak() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(answer));
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="text-signal" />
        <h2 className="text-lg font-semibold">AI Safety Assistant</h2>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button key={prompt} onClick={() => setMessage(prompt)} className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-white/10">
            {prompt}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input value={message} onChange={(event) => setMessage(event.target.value)} className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-white/10" />
        <button className="grid size-10 place-items-center rounded-md bg-ember text-white" aria-label="Send">
          <Send size={18} />
        </button>
      </form>
      <div className="mt-4 rounded-lg bg-zinc-100 p-4 text-sm leading-6 dark:bg-black/30">
        {loading ? "Analyzing alerts, safe places, and hazard proximity..." : answer}
      </div>
      {routeNote && <p className="mt-3 text-sm text-rescue">{routeNote}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={speak} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-white/10">
          <Volume2 size={16} />
          Voice
        </button>
        {location && recommendedPlace && (
          <a href={googleDirectionsLink(location, recommendedPlace.coordinates)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-ember px-3 py-2 text-sm font-medium text-white">
            <Navigation size={16} />
            Open navigation
          </a>
        )}
      </div>
    </section>
  );
}
