export type DisasterType =
  | "flood"
  | "earthquake"
  | "cyclone"
  | "tsunami"
  | "fire"
  | "riot"
  | "weather"
  | "medical"
  | "unknown";

export type SafePlaceType =
  | "hospital"
  | "police"
  | "shelter"
  | "fire_station"
  | "emergency_camp"
  | "restaurant"
  | "pharmacy"
  | "office"
  | "public_zone";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EmergencyAlert {
  id: string;
  source: string;
  title: string;
  type: DisasterType;
  severity: "minor" | "moderate" | "severe" | "extreme";
  certainty: "observed" | "likely" | "possible" | "unknown";
  area: string;
  coordinates?: Coordinates;
  radiusKm?: number;
  startsAt?: string;
  endsAt?: string;
  url?: string;
  instructions?: string[];
}

export interface SafePlace {
  id: string;
  name: string;
  type: SafePlaceType;
  coordinates: Coordinates;
  distanceMeters: number;
  openNow?: boolean;
  capacityScore?: number;
  accessibilityScore?: number;
  contact?: string;
  address?: string;
  source: string;
  safetyScore: number;
  routeRiskScore?: number;
  reasons: string[];
}

export interface IncidentReport {
  id: string;
  type: DisasterType;
  description: string;
  coordinates: Coordinates;
  severity: number;
  createdAt: string;
  verified: boolean;
}
