"use client";

import { useEffect, useState } from "react";
import type { Coordinates } from "@surakshanet/shared";
import { readLastLocation, saveLastLocation } from "./offline";

export interface LocationOptions {
  batterySaver?: boolean;
}

export function useLocation(options: LocationOptions = {}) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [lastKnownLocation, setLastKnownLocation] = useState<(Coordinates & { savedAt?: string }) | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    setLastKnownLocation(readLastLocation());
    if (!("geolocation" in navigator)) {
      setError("GPS is not available in this browser.");
      return;
    }
    setWatching(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(next);
        setLastKnownLocation({ ...next, savedAt: new Date().toISOString() });
        setAccuracyMeters(pos.coords.accuracy);
        saveLastLocation(next);
        setError(null);
      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: !options.batterySaver,
        maximumAge: options.batterySaver ? 60_000 : 10_000,
        timeout: options.batterySaver ? 30_000 : 20_000
      }
    );
    return () => {
      navigator.geolocation.clearWatch(id);
      setWatching(false);
    };
  }, [options.batterySaver]);

  return { location, lastKnownLocation, accuracyMeters, error, watching };
}
