import type { Coordinates, EmergencyAlert, IncidentReport, SafePlace } from "@surakshanet/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function getAlerts(location?: Coordinates) {
  const params = location ? `?lat=${location.lat}&lng=${location.lng}` : "";
  return request<{ alerts: EmergencyAlert[] }>(`/api/alerts${params}`);
}

export function getPlaces(location: Coordinates, radiusMeters = 5000) {
  return request<{ places: SafePlace[]; best: SafePlace | null }>(
    `/api/places?lat=${location.lat}&lng=${location.lng}&radiusMeters=${radiusMeters}`
  );
}

export function chat(message: string, location?: Coordinates, language = "en") {
  return request<{ answer: string; recommendedPlace?: SafePlace; actions: string[]; dangerScore: number }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, language, lat: location?.lat, lng: location?.lng })
  });
}

export function getSafeRoute(origin: Coordinates, destination: Coordinates) {
  return request<{ routeRiskScore: number; distance: string | null; eta: string | null; navigationUrl: string; avoidZones: unknown[] }>(
    `/api/routes/safe?fromLat=${origin.lat}&fromLng=${origin.lng}&toLat=${destination.lat}&toLng=${destination.lng}`
  );
}

export function sendSos(location: Coordinates, message: string, contacts: { name: string; phone: string }[]) {
  return request<{ id: string; delivery: string; message: string; liveLocationUrl?: string; shareLinks?: Record<string, string> }>("/api/sos", {
    method: "POST",
    body: JSON.stringify({ lat: location.lat, lng: location.lng, message, contacts })
  });
}

export function reportIncident(input: Omit<IncidentReport, "id" | "createdAt" | "verified" | "coordinates"> & Coordinates) {
  return request<{ id: string }>("/api/incidents", { method: "POST", body: JSON.stringify(input) });
}
