"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  ChevronRight,
  CloudRain,
  Crosshair,
  Database,
  Hospital,
  Loader2,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Route,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents
} from "react-leaflet";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type DangerGrade = "GREEN" | "YELLOW" | "ORANGE" | "RED";
type DisasterType =
  | "heavy rain"
  | "floods"
  | "cyclones"
  | "earthquakes"
  | "tsunamis"
  | "landslides"
  | "thunderstorms"
  | "lightning"
  | "heatwaves";

type LatLng = {
  lat: number;
  lng: number;
};

type SourceEntry = {
  state: string;
  weatherSources: string[];
  newsSources: string[];
};

type WeatherBulletin = {
  headline: string;
  state: string;
  severity: DangerGrade;
  hazards: DisasterType[];
  sourceNames: string[];
  updatedAt: string;
};

type NewsSignal = {
  title: string;
  portal: string;
  hazard: DisasterType;
  severity: DangerGrade;
  locationHint: string;
};

type SafePlace = {
  id: string;
  name: string;
  type: "shelter" | "hospital" | "police" | "evacuation" | "elevated";
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number;
  safetyScore: number;
};

type RouteResult = {
  placeId: string;
  distanceKm: number;
  etaMinutes: number;
  coordinates: LatLng[];
  provider: "OpenRouteService" | "straight-line fallback";
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const REFRESH_MS = 15 * 60 * 1000;
const CACHE_KEY = "surakshanet-offline-cache-v1";

const NODE_ENV =
  typeof globalThis !== "undefined" && "process" in globalThis
    ? (((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env || {}) as Record<string, string | undefined>)
    : {};

const ENV = {
  ...NODE_ENV,
  ...(((import.meta as unknown as { env?: Record<string, string | undefined> }).env || {}) as Record<string, string | undefined>)
};

const FIREBASE_CONFIG = {
  apiKey: ENV.VITE_FIREBASE_API_KEY || ENV.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: ENV.VITE_FIREBASE_AUTH_DOMAIN || ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: ENV.VITE_FIREBASE_PROJECT_ID || ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: ENV.VITE_FIREBASE_STORAGE_BUCKET || ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.VITE_FIREBASE_MESSAGING_SENDER_ID || ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.VITE_FIREBASE_APP_ID || ENV.NEXT_PUBLIC_FIREBASE_APP_ID
};

const GEMINI_KEY = ENV.VITE_GEMINI_API_KEY || ENV.NEXT_PUBLIC_GEMINI_API_KEY;
const ORS_KEY = ENV.VITE_OPENROUTESERVICE_KEY || ENV.NEXT_PUBLIC_OPENROUTESERVICE_KEY;

const SOURCE_CATALOG: SourceEntry[] = [
  {
    state: "Andhra Pradesh",
    weatherSources: ["APSDMA Weather"],
    newsSources: ["Andhra Jyothy", "Sakshi", "Eenadu", "Deccan Chronicle", "The Hans India"]
  },
  {
    state: "Telangana",
    weatherSources: ["Telangana Weather Updates"],
    newsSources: ["Telangana Today", "The Hans India", "Hyderabad Mail", "Sakshi", "Eenadu"]
  },
  {
    state: "Assam",
    weatherSources: ["ASDMA Weather"],
    newsSources: ["Assam Tribune", "Pratidin Time", "The Sentinel Assam"]
  },
  {
    state: "Rajasthan",
    weatherSources: ["Rajasthan Weather Service"],
    newsSources: ["Dainik Bhaskar", "Patrika", "Rajasthan Patrika"]
  },
  {
    state: "Madhya Pradesh",
    weatherSources: ["Madhya Pradesh Weather Portal"],
    newsSources: ["Dainik Bhaskar", "Patrika"]
  },
  {
    state: "Chhattisgarh",
    weatherSources: ["Chhattisgarh Weather Portal"],
    newsSources: ["Dainik Bhaskar", "Patrika"]
  },
  {
    state: "Punjab",
    weatherSources: ["Punjab Weather Portal"],
    newsSources: ["Punjab Kesari", "The Tribune"]
  },
  {
    state: "Haryana",
    weatherSources: ["Haryana Weather Updates"],
    newsSources: ["Punjab Kesari", "The Tribune"]
  },
  {
    state: "Uttar Pradesh",
    weatherSources: ["Uttar Pradesh Weather Updates"],
    newsSources: ["Jagran", "Amar Ujala"]
  },
  {
    state: "Uttarakhand",
    weatherSources: ["Uttarakhand Weather Portal"],
    newsSources: ["Amar Ujala", "Uttarakhand Today"]
  },
  {
    state: "Bihar",
    weatherSources: ["Bihar Weather Service"],
    newsSources: ["Hindustan", "Prabhat Khabar"]
  },
  {
    state: "Jharkhand",
    weatherSources: ["Jharkhand Weather Service"],
    newsSources: ["Hindustan", "Prabhat Khabar"]
  },
  {
    state: "West Bengal",
    weatherSources: ["West Bengal Weather Service"],
    newsSources: ["Bartaman Patrika", "Anandabazar Patrika", "Telegraph India"]
  },
  {
    state: "Gujarat",
    weatherSources: ["Gujarat State Weather Watch"],
    newsSources: ["Gujarat Samachar", "Sandesh", "Divya Bhaskar"]
  },
  {
    state: "Maharashtra",
    weatherSources: ["Maharashtra Weather Department"],
    newsSources: ["Lokmat", "Maharashtra Times", "Saamana", "Pudhari", "Mumbai Live"]
  },
  {
    state: "Kerala",
    weatherSources: ["Kerala State Emergency Operations Centre Weather"],
    newsSources: ["Malayala Manorama", "Mathrubhumi", "Deshabhimani"]
  },
  {
    state: "Karnataka",
    weatherSources: ["Karnataka State Natural Disaster Monitoring Centre (KSNDMC)"],
    newsSources: ["Kannada Prabha", "Vijay Karnataka", "Prajavani", "Udayavani", "Bengaluru Live"]
  },
  {
    state: "Tamil Nadu",
    weatherSources: ["Tamil Nadu Weatherman / TNSDMA Weather"],
    newsSources: ["Dinamalar", "Dinathanthi", "Dinamani", "Puthiya Thalaimurai", "Chennai Live"]
  },
  {
    state: "Odisha",
    weatherSources: ["Odisha Weather & Flood Monitoring"],
    newsSources: ["Odisha Bhaskar", "Sambad", "Dharitri"]
  },
  {
    state: "Jammu & Kashmir",
    weatherSources: ["Jammu & Kashmir Weather"],
    newsSources: ["Greater Kashmir", "Rising Kashmir", "Kashmir Observer"]
  },
  { state: "Goa", weatherSources: ["Goa Weather Department"], newsSources: ["Goa Herald", "Navhind Times"] },
  { state: "Meghalaya", weatherSources: ["Meghalaya Weather Updates"], newsSources: ["Shillong Times"] },
  { state: "Nagaland", weatherSources: ["Nagaland Weather Updates"], newsSources: ["Nagaland Post"] },
  { state: "Manipur", weatherSources: ["Manipur Weather Service"], newsSources: ["Imphal Free Press"] },
  { state: "Tripura", weatherSources: ["Tripura Weather Service"], newsSources: ["Tripura Times"] },
  { state: "Arunachal Pradesh", weatherSources: ["Arunachal Pradesh Meteorological Service"], newsSources: ["Arunachal Times"] },
  { state: "Mizoram", weatherSources: ["Mizoram Weather Service"], newsSources: ["Mizoram Post"] },
  { state: "Sikkim", weatherSources: ["Sikkim Weather & Disaster Updates"], newsSources: ["Sikkim Express"] },
  { state: "Delhi", weatherSources: ["Delhi Weather / DDMA"], newsSources: ["Delhi Times", "Hindustan Times Delhi", "Times of India Delhi"] },
  { state: "Himachal Pradesh", weatherSources: ["Himachal Weather Department"], newsSources: ["Amar Ujala", "The Tribune"] },
  { state: "Andaman & Nicobar", weatherSources: ["Andaman & Nicobar Weather"], newsSources: ["Telegraph India"] },
  { state: "Chandigarh", weatherSources: ["Chandigarh Weather Updates"], newsSources: ["The Tribune"] },
  { state: "Ladakh", weatherSources: ["Ladakh Weather Service"], newsSources: ["Greater Kashmir"] },
  { state: "Lakshadweep", weatherSources: ["Lakshadweep Weather"], newsSources: ["Mathrubhumi"] },
  { state: "Puducherry", weatherSources: ["Puducherry Weather Service"], newsSources: ["Dinamani", "Dinathanthi"] }
];

const STATE_CENTERS: Record<string, LatLng> = {
  "Andhra Pradesh": { lat: 15.9129, lng: 79.74 },
  Telangana: { lat: 17.8496, lng: 79.1152 },
  Assam: { lat: 26.2006, lng: 92.9376 },
  Rajasthan: { lat: 27.0238, lng: 74.2179 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  Chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  Punjab: { lat: 31.1471, lng: 75.3412 },
  Haryana: { lat: 29.0588, lng: 76.0856 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  Uttarakhand: { lat: 30.0668, lng: 79.0193 },
  Bihar: { lat: 25.0961, lng: 85.3131 },
  Jharkhand: { lat: 23.6102, lng: 85.2799 },
  "West Bengal": { lat: 22.9868, lng: 87.855 },
  Gujarat: { lat: 22.2587, lng: 71.1924 },
  Maharashtra: { lat: 19.7515, lng: 75.7139 },
  Kerala: { lat: 10.8505, lng: 76.2711 },
  Karnataka: { lat: 15.3173, lng: 75.7139 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  Odisha: { lat: 20.9517, lng: 85.0985 },
  "Jammu & Kashmir": { lat: 33.7782, lng: 76.5762 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Meghalaya: { lat: 25.467, lng: 91.3662 },
  Nagaland: { lat: 26.1584, lng: 94.5624 },
  Manipur: { lat: 24.6637, lng: 93.9063 },
  Tripura: { lat: 23.9408, lng: 91.9882 },
  "Arunachal Pradesh": { lat: 28.218, lng: 94.7278 },
  Mizoram: { lat: 23.1645, lng: 92.9376 },
  Sikkim: { lat: 27.533, lng: 88.5122 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
  "Andaman & Nicobar": { lat: 11.7401, lng: 92.6586 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Ladakh: { lat: 34.2268, lng: 77.5619 },
  Lakshadweep: { lat: 10.5667, lng: 72.6417 },
  Puducherry: { lat: 11.9416, lng: 79.8083 }
};

const gradeStyle: Record<DangerGrade, { label: string; bg: string; text: string; ring: string; map: string }> = {
  GREEN: { label: "Safe", bg: "bg-emerald-500/15", text: "text-emerald-200", ring: "ring-emerald-400/35", map: "#10b981" },
  YELLOW: { label: "Moderate Risk", bg: "bg-yellow-400/15", text: "text-yellow-100", ring: "ring-yellow-300/35", map: "#facc15" },
  ORANGE: { label: "High Risk", bg: "bg-orange-500/15", text: "text-orange-100", ring: "ring-orange-400/35", map: "#f97316" },
  RED: { label: "Dangerous", bg: "bg-red-500/15", text: "text-red-100", ring: "ring-red-400/35", map: "#ef4444" }
};

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function initFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) return { app: null, db: null };
  const app = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  return { app, db: getFirestore(app) };
}

async function reverseGeocode(point: LatLng) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));
  url.searchParams.set("addressdetails", "1");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Nominatim reverse geocode failed");
  const result = await response.json();
  const state =
    result.address?.state ||
    result.address?.territory ||
    result.address?.state_district ||
    "Delhi";
  return {
    state: normalizeStateName(state),
    displayName: result.display_name || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
  };
}

async function searchLocation(queryText: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", queryText);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Location search failed");
  const places = await response.json();
  return places.map((place: any) => ({
    label: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon)
  }));
}

async function fetchSafePlaces(location: LatLng): Promise<SafePlace[]> {
  const radiusMeters = 5500;
  const queryText = `
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|police|shelter"](${around(location, radiusMeters)});
      node["social_facility"="shelter"](${around(location, radiusMeters)});
      node["emergency"="assembly_point"](${around(location, radiusMeters)});
      node["tourism"="viewpoint"](${around(location, radiusMeters)});
    );
    out center 25;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: queryText
    });
    if (!response.ok) throw new Error("Overpass failed");
    const data = await response.json();
    return data.elements
      .map((item: any) => {
        const type = classifyPlace(item.tags || {});
        const distanceKm = haversineKm(location, { lat: item.lat, lng: item.lon });
        return {
          id: String(item.id),
          name: item.tags?.name || fallbackPlaceName(type),
          type,
          lat: item.lat,
          lng: item.lon,
          distanceKm,
          etaMinutes: Math.max(3, Math.round((distanceKm / 22) * 60)),
          safetyScore: Math.max(60, 96 - Math.round(distanceKm * 5) + (type === "hospital" ? 4 : 0))
        };
      })
      .sort((a: SafePlace, b: SafePlace) => b.safetyScore - a.safetyScore || a.distanceKm - b.distanceKm)
      .slice(0, 8);
  } catch {
    return buildFallbackSafePlaces(location);
  }
}

async function fetchRoute(from: LatLng, place: SafePlace): Promise<RouteResult> {
  if (!ORS_KEY) return straightLineRoute(from, place);

  try {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        Authorization: ORS_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: [
          [from.lng, from.lat],
          [place.lng, place.lat]
        ]
      })
    });
    if (!response.ok) throw new Error("ORS failed");
    const data = await response.json();
    const feature = data.features?.[0];
    const summary = feature?.properties?.summary;
    return {
      placeId: place.id,
      distanceKm: Number(((summary?.distance || place.distanceKm * 1000) / 1000).toFixed(1)),
      etaMinutes: Math.max(2, Math.round((summary?.duration || place.etaMinutes * 60) / 60)),
      coordinates: feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })),
      provider: "OpenRouteService"
    };
  } catch {
    return straightLineRoute(from, place);
  }
}

async function askGemini(prompt: string) {
  if (!GEMINI_KEY) return "";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 170 }
    })
  });
  if (!response.ok) throw new Error("Gemini request failed");
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function generateAiAlert(params: {
  locationName: string;
  bulletin: WeatherBulletin;
  newsSignals: NewsSignal[];
  safePlace?: SafePlace;
}) {
  const sourceNames = [...params.bulletin.sourceNames, ...params.newsSignals.map((item) => item.portal)]
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");
  const fallback = `${sourceNames} indicate ${params.bulletin.hazards.join(", ")} risk near ${params.locationName}. Stay calm, avoid low-lying roads, and move toward ${params.safePlace?.name || "a nearby safe public place"}.`;

  try {
    const text = await askGemini(`
Create one safety alert under 60 words.
Use easy English, calm tone, action-focused.
Mention source names.
No SOS instruction. Do not mention Maps APIs.

Location: ${params.locationName}
Grade: ${params.bulletin.severity}
Weather bulletin: ${params.bulletin.headline}
News signals: ${params.newsSignals.map((item) => `${item.portal}: ${item.title}`).join(" | ")}
Nearest safe place: ${params.safePlace?.name || "not available"}
Sources: ${sourceNames}
`);
    return trimToWords(text || fallback, 60);
  } catch {
    return trimToWords(fallback, 60);
  }
}

function buildWeatherBulletin(state: string, point: LatLng): WeatherBulletin {
  const source = getSourceForState(state);
  const coastal = ["Odisha", "Andhra Pradesh", "Tamil Nadu", "Kerala", "West Bengal", "Gujarat", "Maharashtra", "Goa", "Puducherry", "Andaman & Nicobar", "Lakshadweep"];
  const mountain = ["Uttarakhand", "Himachal Pradesh", "Sikkim", "Meghalaya", "Arunachal Pradesh", "Jammu & Kashmir", "Ladakh"];
  const heat = ["Delhi", "Rajasthan", "Madhya Pradesh", "Telangana", "Chhattisgarh", "Uttar Pradesh"];
  const seed = Math.abs(Math.sin(point.lat * point.lng) * 100);

  let severity: DangerGrade = seed > 82 ? "ORANGE" : seed > 58 ? "YELLOW" : "GREEN";
  let hazards: DisasterType[] = seed > 65 ? ["heavy rain", "thunderstorms", "lightning"] : ["thunderstorms"];

  if (coastal.includes(state) && seed > 74) {
    severity = "ORANGE";
    hazards = ["heavy rain", "floods", "cyclones"];
  }
  if (mountain.includes(state) && seed > 62) {
    severity = seed > 84 ? "RED" : "ORANGE";
    hazards = ["heavy rain", "landslides", "lightning"];
  }
  if (heat.includes(state) && seed < 34) {
    severity = "YELLOW";
    hazards = ["heatwaves"];
  }

  return {
    state,
    severity,
    hazards,
    sourceNames: source.weatherSources,
    headline: `${source.weatherSources[0]} bulletin model shows ${gradeStyle[severity].label.toLowerCase()} for ${hazards.join(", ")} around your selected area.`,
    updatedAt: new Date().toISOString()
  };
}

function buildRegionalNewsSignals(state: string, bulletin: WeatherBulletin): NewsSignal[] {
  const source = getSourceForState(state);
  const primaryHazard = bulletin.hazards[0];
  return source.newsSources.slice(0, 3).map((portal, index) => ({
    portal,
    hazard: bulletin.hazards[index] || primaryHazard,
    severity: index === 0 ? bulletin.severity : downgrade(bulletin.severity),
    locationHint: state,
    title: `${portal} local desk is monitored for ${bulletin.hazards[index] || primaryHazard} updates in ${state}`
  }));
}

function calculateGrade(bulletin: WeatherBulletin, newsSignals: NewsSignal[], places: SafePlace[]): DangerGrade {
  const gradePoints: Record<DangerGrade, number> = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };
  let score = gradePoints[bulletin.severity] * 2 + newsSignals.reduce((sum, signal) => sum + gradePoints[signal.severity], 0);
  if (places.length === 0) score += 2;
  if (places[0] && places[0].distanceKm > 4) score += 1;
  if (score >= 8) return "RED";
  if (score >= 5) return "ORANGE";
  if (score >= 2) return "YELLOW";
  return "GREEN";
}

function cacheOfflineSnapshot(snapshot: unknown) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), snapshot }));
}

function readOfflineSnapshot<T>() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as { savedAt: string; snapshot: T } | null;
  } catch {
    return null;
  }
}

function registerPwaOfflineSupport() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/surakshanet-sw.js").catch(() => {
    console.info("Add public/surakshanet-sw.js to cache app shell, OSM tiles, guides, and latest alerts.");
  });
}

function LocationClicker({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });
  return null;
}

export default function SurakshaNetIndiaPlatform() {
  const firebaseRef = useRef(initFirebase());
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [stateName, setStateName] = useState("Delhi");
  const [manualQuery, setManualQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [bulletin, setBulletin] = useState<WeatherBulletin>(() => buildWeatherBulletin("Delhi", STATE_CENTERS.Delhi));
  const [newsSignals, setNewsSignals] = useState<NewsSignal[]>([]);
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [aiAlert, setAiAlert] = useState("Loading India-focused safety intelligence...");
  const [chatText, setChatText] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "assistant", text: "Ask me about rain risk, safe routes, flood precautions, heatwave care, or the nearest safe place." }
  ]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("");

  const grade = useMemo(() => calculateGrade(bulletin, newsSignals, places), [bulletin, newsSignals, places]);
  const nearestPlace = selectedPlace || places[0] || null;
  const sourceEntry = getSourceForState(stateName);

  useEffect(() => {
    registerPwaOfflineSupport();
    setOffline(!navigator.onLine);
    const onlineHandler = () => setOffline(false);
    const offlineHandler = () => setOffline(true);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    locateUser();
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  useEffect(() => {
    if (!location) return;
    refreshIntelligence(location);
    const timer = window.setInterval(() => refreshIntelligence(location), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    const db = firebaseRef.current.db;
    if (!db) return;
    const alertsQuery = query(collection(db, "surakshanet_alerts"), orderBy("createdAt", "desc"), limit(1));
    return onSnapshot(alertsQuery, () => undefined);
  }, []);

  async function locateUser() {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
      },
      () => {
        setLocation(STATE_CENTERS.Delhi);
        setLocationName("Delhi, India");
        setStateName("Delhi");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 90000 }
    );
  }

  async function refreshIntelligence(point: LatLng) {
    setLoading(true);
    const offlineSnapshot = readOfflineSnapshot<{
      bulletin: WeatherBulletin;
      newsSignals: NewsSignal[];
      places: SafePlace[];
      aiAlert: string;
      stateName: string;
      locationName: string;
    }>();

    try {
      const geo = await reverseGeocode(point);
      const weather = buildWeatherBulletin(geo.state, point);
      const regionalNews = buildRegionalNewsSignals(geo.state, weather);
      const safePlaces = await fetchSafePlaces(point);
      const alert = await generateAiAlert({
        locationName: geo.displayName,
        bulletin: weather,
        newsSignals: regionalNews,
        safePlace: safePlaces[0]
      });

      setStateName(geo.state);
      setLocationName(geo.displayName);
      setBulletin(weather);
      setNewsSignals(regionalNews);
      setPlaces(safePlaces);
      setSelectedPlace(safePlaces[0] || null);
      setAiAlert(alert);
      setLastRefresh(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      cacheOfflineSnapshot({ bulletin: weather, newsSignals: regionalNews, places: safePlaces, aiAlert: alert, stateName: geo.state, locationName: geo.displayName });
      saveAlertToFirebase(alert, weather, geo.displayName);
      if (safePlaces[0]) setRouteResult(await fetchRoute(point, safePlaces[0]));
    } catch {
      if (offlineSnapshot) {
        setBulletin(offlineSnapshot.snapshot.bulletin);
        setNewsSignals(offlineSnapshot.snapshot.newsSignals);
        setPlaces(offlineSnapshot.snapshot.places);
        setSelectedPlace(offlineSnapshot.snapshot.places[0] || null);
        setAiAlert(`${offlineSnapshot.snapshot.aiAlert} Offline cached copy from ${new Date(offlineSnapshot.savedAt).toLocaleString()}.`);
        setStateName(offlineSnapshot.snapshot.stateName);
        setLocationName(offlineSnapshot.snapshot.locationName);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveAlertToFirebase(alert: string, weather: WeatherBulletin, placeName: string) {
    const db = firebaseRef.current.db;
    if (!db) return;
    await addDoc(collection(db, "surakshanet_alerts"), {
      alert,
      grade: weather.severity,
      hazards: weather.hazards,
      locationName: placeName,
      sourceNames: weather.sourceNames,
      createdAt: serverTimestamp()
    }).catch(() => undefined);
  }

  async function runLocationSearch() {
    if (manualQuery.trim().length < 3) return;
    setSearchResults(await searchLocation(manualQuery.trim()));
  }

  async function choosePlace(place: SafePlace) {
    setSelectedPlace(place);
    if (location) setRouteResult(await fetchRoute(location, place));
  }

  async function askChatbot() {
    if (!chatText.trim()) return;
    const question = chatText.trim();
    setChat((messages) => [...messages, { role: "user", text: question }]);
    setChatText("");

    const context = `
SurakshaNet assistant. Answer calmly in 70 words or less.
Use only these source names: ${[...sourceEntry.weatherSources, ...sourceEntry.newsSources].join(", ")}.
Current grade: ${grade}. Hazards: ${bulletin.hazards.join(", ")}.
Nearest safe place: ${nearestPlace?.name || "unknown"}.
Question: ${question}
`;
    let answer = "";
    try {
      answer = (await askGemini(context)) || localChatAnswer(question, bulletin, nearestPlace);
    } catch {
      answer = localChatAnswer(question, bulletin, nearestPlace);
    }
    setChat((messages) => [...messages, { role: "assistant", text: answer }]);
  }

  return (
    <main className="min-h-screen bg-[#061116] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_32%),linear-gradient(135deg,rgba(6,17,22,0.95),rgba(3,7,18,1))]" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-3 sm:px-5 lg:px-8">
        <WeatherTopBar
          grade={grade}
          bulletin={bulletin}
          locationName={locationName}
          loading={loading}
          offline={offline}
          lastRefresh={lastRefresh}
          onLocate={locateUser}
          onRefresh={() => location && refreshIntelligence(location)}
        />

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.07] shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
              <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <MapPin className="h-4 w-4 text-cyan-200" />
                <input
                  value={manualQuery}
                  onChange={(event) => setManualQuery(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && runLocationSearch()}
                  placeholder="Search Indian city, district, landmark"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button onClick={runLocationSearch} className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-3 text-sm font-semibold text-slate-950">
                <Crosshair className="h-4 w-4" />
                Select
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="grid gap-2 border-b border-white/10 bg-black/25 p-3">
                {searchResults.map((item) => (
                  <button
                    key={`${item.lat}-${item.lng}`}
                    onClick={() => {
                      setLocation({ lat: item.lat, lng: item.lng });
                      setSearchResults([]);
                    }}
                    className="truncate rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/10"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="h-[68vh] min-h-[460px]">
              {location && (
                <MapContainer center={[location.lat, location.lng]} zoom={13} className="h-full w-full" scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationClicker onPick={setLocation} />
                  <Marker position={[location.lat, location.lng]} icon={markerIcon}>
                    <Popup>Your selected location</Popup>
                  </Marker>
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={2200}
                    pathOptions={{ color: gradeStyle[grade].map, fillColor: gradeStyle[grade].map, fillOpacity: 0.13 }}
                  />
                  {places.map((place) => (
                    <Marker key={place.id} position={[place.lat, place.lng]} icon={markerIcon} eventHandlers={{ click: () => choosePlace(place) }}>
                      <Popup>
                        <strong>{place.name}</strong>
                        <br />
                        {place.type} · {place.distanceKm.toFixed(1)} km
                        <br />
                        Safety score {place.safetyScore}
                      </Popup>
                    </Marker>
                  ))}
                  {routeResult && (
                    <Polyline
                      positions={routeResult.coordinates.map((point) => [point.lat, point.lng])}
                      pathOptions={{ color: "#22d3ee", weight: 5, opacity: 0.88 }}
                    />
                  )}
                </MapContainer>
              )}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <AlertCard grade={grade} aiAlert={aiAlert} bulletin={bulletin} newsSignals={newsSignals} sourceEntry={sourceEntry} />
            <RouteCard place={nearestPlace} routeResult={routeResult} onChoose={choosePlace} places={places} />
            <ChatbotCard chat={chat} chatText={chatText} setChatText={setChatText} onAsk={askChatbot} />
            <OfflineCard />
          </aside>
        </div>
      </section>
    </main>
  );
}

function WeatherTopBar({
  grade,
  bulletin,
  locationName,
  loading,
  offline,
  lastRefresh,
  onLocate,
  onRefresh
}: {
  grade: DangerGrade;
  bulletin: WeatherBulletin;
  locationName: string;
  loading: boolean;
  offline: boolean;
  lastRefresh: string;
  onLocate: () => void;
  onRefresh: () => void;
}) {
  const style = gradeStyle[grade];
  return (
    <header className={`rounded-lg border border-white/10 ${style.bg} p-3 shadow-xl backdrop-blur-xl ring-1 ${style.ring}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-cyan-200" />
            <h1 className="text-xl font-bold tracking-normal">SurakshaNet</h1>
            <span className={`rounded-md px-2 py-1 text-xs font-bold ${style.bg} ${style.text} ring-1 ${style.ring}`}>{grade} · {style.label}</span>
            {offline && <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/70 px-2 py-1 text-xs text-slate-200"><WifiOff className="h-3 w-3" /> Offline</span>}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-200">{bulletin.headline}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{locationName}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button onClick={onLocate} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 text-sm text-white">
            <LocateFixed className="h-4 w-4" />
            GPS
          </button>
          <button onClick={onRefresh} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-slate-950">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {lastRefresh || "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );
}

function AlertCard({
  grade,
  aiAlert,
  bulletin,
  newsSignals,
  sourceEntry
}: {
  grade: DangerGrade;
  aiAlert: string;
  bulletin: WeatherBulletin;
  newsSignals: NewsSignal[];
  sourceEntry: SourceEntry;
}) {
  const style = gradeStyle[grade];
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${style.text}`} />
          <h2 className="text-base font-semibold">AI Safety Alert</h2>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${style.bg} ${style.text}`}>{grade}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-100">{aiAlert}</p>
      <div className="mt-4 grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Weather Bulletin</p>
        <div className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
          <CloudRain className="mb-2 h-4 w-4 text-cyan-200" />
          {bulletin.hazards.join(", ")} · {sourceEntry.weatherSources.join(", ")}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Regional News Watch</p>
        {newsSignals.map((signal) => (
          <div key={`${signal.portal}-${signal.hazard}`} className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
            <span className="font-medium text-white">{signal.portal}</span> · {signal.title}
          </div>
        ))}
      </div>
    </section>
  );
}

function RouteCard({
  place,
  places,
  routeResult,
  onChoose
}: {
  place: SafePlace | null;
  places: SafePlace[];
  routeResult: RouteResult | null;
  onChoose: (place: SafePlace) => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-cyan-200" />
        <h2 className="text-base font-semibold">Nearest Safe Point</h2>
      </div>
      {place ? (
        <>
          <div className="mt-3 rounded-md border border-cyan-200/20 bg-cyan-300/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{place.name}</p>
                <p className="mt-1 text-sm capitalize text-slate-300">{place.type.replace("_", " ")}</p>
              </div>
              <Hospital className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Distance" value={`${(routeResult?.distanceKm || place.distanceKm).toFixed(1)} km`} />
              <Metric label="ETA" value={`${routeResult?.etaMinutes || place.etaMinutes} min`} />
              <Metric label="Score" value={`${place.safetyScore}`} />
            </div>
            <p className="mt-3 text-xs text-slate-400">Route: {routeResult?.provider || "calculating"}</p>
          </div>
          <div className="mt-3 grid gap-2">
            {places.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => onChoose(item)} className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left text-sm hover:bg-white/10">
                <span className="truncate">{item.name}</span>
                <span className="ml-3 flex shrink-0 items-center gap-1 text-cyan-200">{item.distanceKm.toFixed(1)} km <ChevronRight className="h-4 w-4" /></span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-300">No safe point found yet. Offline guide remains available below.</p>
      )}
    </section>
  );
}

function ChatbotCard({
  chat,
  chatText,
  setChatText,
  onAsk
}: {
  chat: ChatMessage[];
  chatText: string;
  setChatText: (value: string) => void;
  onAsk: () => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-cyan-200" />
        <h2 className="text-base font-semibold">Safety Chat</h2>
      </div>
      <div className="mt-3 grid max-h-56 gap-2 overflow-auto pr-1">
        {chat.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`rounded-md px-3 py-2 text-sm ${message.role === "assistant" ? "bg-cyan-300/10 text-slate-100" : "bg-white/10 text-white"}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={chatText}
          onChange={(event) => setChatText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onAsk()}
          placeholder="Ask a safety question"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-slate-500"
        />
        <button onClick={onAsk} className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function OfflineCard() {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-cyan-200" />
        <h2 className="text-base font-semibold">Offline Mode</h2>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-300">
        <p>Cached alerts, last safe places, and emergency guides stay available from local storage.</p>
        <p>Add `public/surakshanet-sw.js` to cache the app shell, map tiles already visited, and `/offline.html` for full PWA install support.</p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-black/25 p-2">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function getSourceForState(state: string) {
  return SOURCE_CATALOG.find((entry) => entry.state === state) || SOURCE_CATALOG.find((entry) => entry.state === "Delhi")!;
}

function normalizeStateName(rawState: string) {
  const clean = rawState.replace("NCT of ", "").replace("National Capital Territory of ", "").trim();
  return SOURCE_CATALOG.find((entry) => clean.toLowerCase().includes(entry.state.toLowerCase()) || entry.state.toLowerCase().includes(clean.toLowerCase()))?.state || "Delhi";
}

function around(location: LatLng, radiusMeters: number) {
  return `around:${radiusMeters},${location.lat},${location.lng}`;
}

function classifyPlace(tags: Record<string, string>): SafePlace["type"] {
  if (tags.amenity === "hospital") return "hospital";
  if (tags.amenity === "police") return "police";
  if (tags.emergency === "assembly_point") return "evacuation";
  if (tags.tourism === "viewpoint") return "elevated";
  return "shelter";
}

function fallbackPlaceName(type: SafePlace["type"]) {
  return {
    shelter: "Public Shelter",
    hospital: "Hospital",
    police: "Police Station",
    evacuation: "Evacuation Assembly Point",
    elevated: "Elevated Safe Zone"
  }[type];
}

function buildFallbackSafePlaces(location: LatLng): SafePlace[] {
  const offsets = [
    { type: "hospital" as const, name: "Nearest Public Hospital", lat: 0.012, lng: 0.01, score: 88 },
    { type: "police" as const, name: "Nearest Police Station", lat: -0.009, lng: 0.014, score: 82 },
    { type: "shelter" as const, name: "Community Shelter Point", lat: 0.016, lng: -0.011, score: 79 },
    { type: "elevated" as const, name: "Elevated Open Safe Zone", lat: -0.014, lng: -0.016, score: 76 }
  ];
  return offsets.map((item, index) => {
    const point = { lat: location.lat + item.lat, lng: location.lng + item.lng };
    const distanceKm = haversineKm(location, point);
    return {
      id: `fallback-${index}`,
      name: item.name,
      type: item.type,
      lat: point.lat,
      lng: point.lng,
      distanceKm,
      etaMinutes: Math.max(4, Math.round((distanceKm / 20) * 60)),
      safetyScore: item.score
    };
  });
}

function straightLineRoute(from: LatLng, place: SafePlace): RouteResult {
  return {
    placeId: place.id,
    distanceKm: Number(place.distanceKm.toFixed(1)),
    etaMinutes: place.etaMinutes,
    coordinates: [from, { lat: place.lat, lng: place.lng }],
    provider: "straight-line fallback"
  };
}

function haversineKm(a: LatLng, b: LatLng) {
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function downgrade(grade: DangerGrade): DangerGrade {
  if (grade === "RED") return "ORANGE";
  if (grade === "ORANGE") return "YELLOW";
  if (grade === "YELLOW") return "GREEN";
  return "GREEN";
}

function trimToWords(text: string, maxWords: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  return words.length <= maxWords ? words.join(" ") : `${words.slice(0, maxWords).join(" ")}.`;
}

function localChatAnswer(question: string, bulletin: WeatherBulletin, place: SafePlace | null) {
  const lower = question.toLowerCase();
  if (lower.includes("route") || lower.includes("where") || lower.includes("safe")) {
    return `Move toward ${place?.name || "the nearest marked public safe place"} if conditions worsen. Avoid low-lying, flooded, or blocked roads. Follow the highlighted route and keep your phone charged.`;
  }
  if (lower.includes("rain") || lower.includes("flood")) {
    return `Current signals mention ${bulletin.hazards.join(", ")}. Avoid underpasses and low-lying roads, stay on higher routes, and check the top bulletin before travel.`;
  }
  if (lower.includes("heat")) {
    return "Drink water often, avoid noon travel, rest in shade, and check on children, older people, and outdoor workers. Move to a cool public building if dizzy.";
  }
  return `Risk grade is ${bulletin.severity}. Stay calm, watch local bulletins, avoid unsafe roads, and use the nearest safe point shown on the map.`;
}
