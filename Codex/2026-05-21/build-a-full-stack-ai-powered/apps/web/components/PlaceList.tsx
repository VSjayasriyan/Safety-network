import type { SafePlace } from "@surakshanet/shared";
import { Building2, Navigation } from "lucide-react";

export function PlaceList({ places }: { places: SafePlace[] }) {
  if (!places.length) {
    return <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.04]">Enable GPS to find nearby safe places.</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {places.slice(0, 12).map((place) => (
        <article key={place.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <Building2 size={18} className="text-rescue" />
                {place.name}
              </div>
              <p className="mt-1 text-sm capitalize text-zinc-500 dark:text-zinc-400">{place.type.replace("_", " ")} · {Math.round(place.distanceMeters)}m</p>
            </div>
            <span className="rounded-md bg-rescue px-2 py-1 text-sm font-semibold text-zinc-950">{place.safetyScore}</span>
          </div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{place.reasons.join(" · ")}</p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-white/10"
          >
            <Navigation size={16} />
            Route
          </a>
        </article>
      ))}
    </div>
  );
}
