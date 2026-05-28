"use client";

import { Loader } from "@googlemaps/js-api-loader";
import type { Coordinates, EmergencyAlert } from "@surakshanet/shared";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

let loaderPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps() {
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured."));
  }
  if (!loaderPromise) {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "geometry", "visualization", "marker"],
      mapIds: mapId ? [mapId] : undefined
    });
    loaderPromise = loader.load();
  }
  return loaderPromise;
}

export function googleMapsLink(location: Coordinates) {
  return `https://maps.google.com/?q=${location.lat},${location.lng}`;
}

export function googleDirectionsLink(origin: Coordinates, destination: Coordinates) {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

export function buildDangerCircles(alerts: EmergencyAlert[]) {
  return alerts
    .filter((alert) => alert.coordinates)
    .map((alert) => ({
      id: alert.id,
      center: alert.coordinates!,
      radiusMeters: (alert.radiusKm ?? 8) * 1000,
      color: alert.severity === "extreme" || alert.severity === "severe" ? "#ff3b1f" : "#ff8a00"
    }));
}

export function googleMapOptions(center: Coordinates, dark: boolean): google.maps.MapOptions {
  return {
    center,
    zoom: 13,
    mapId,
    disableDefaultUI: false,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    clickableIcons: true,
    gestureHandling: "greedy",
    styles: mapId
      ? undefined
      : dark
        ? [
            { elementType: "geometry", stylers: [{ color: "#15171d" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#f4f4f5" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0d1017" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d313b" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#101827" }] }
          ]
        : undefined
  };
}
