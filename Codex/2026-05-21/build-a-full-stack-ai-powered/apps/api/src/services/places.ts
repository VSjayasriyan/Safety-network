import axios from "axios";
import { v5 as uuidv5 } from "uuid";
import type { Coordinates, SafePlace, SafePlaceType } from "@surakshanet/shared";
import { config } from "../config.js";
import { cached } from "./cache.js";
import { haversineMeters } from "./geo.js";
import { query } from "../db/pool.js";

const NS = "262b47a5-8817-4397-bc31-82e406f2b499";
const overpassTypes: Record<SafePlaceType, string> = {
  hospital: '["amenity"="hospital"]',
  police: '["amenity"="police"]',
  shelter: '["amenity"="shelter"]',
  fire_station: '["amenity"="fire_station"]',
  emergency_camp: '["emergency"="assembly_point"]',
  restaurant: '["amenity"="restaurant"]',
  pharmacy: '["amenity"="pharmacy"]',
  office: '["office"]',
  public_zone: '["leisure"="park"]'
};

const googlePlaceSearches: Array<{ type: SafePlaceType; googleType?: string; keyword?: string }> = [
  { type: "hospital", googleType: "hospital" },
  { type: "police", googleType: "police" },
  { type: "fire_station", googleType: "fire_station" },
  { type: "restaurant", googleType: "restaurant" },
  { type: "pharmacy", googleType: "pharmacy" },
  { type: "shelter", keyword: "emergency shelter" },
  { type: "emergency_camp", keyword: "relief camp emergency camp" },
  { type: "office", keyword: "office building public building" },
  { type: "public_zone", keyword: "community center public safe place" }
];

function inferOsmType(tags: Record<string, string>): SafePlaceType {
  if (tags.amenity === "hospital") return "hospital";
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "shelter") return "shelter";
  if (tags.amenity === "fire_station") return "fire_station";
  if (tags.amenity === "restaurant") return "restaurant";
  if (tags.amenity === "pharmacy") return "pharmacy";
  if (tags.emergency === "assembly_point") return "emergency_camp";
  if (tags.office) return "office";
  return "public_zone";
}

export async function getDatabasePlaces(origin: Coordinates, radiusMeters: number): Promise<SafePlace[]> {
  const rows = await query<any>(
    `SELECT id, name, type, source, address, phone, open_now,
      capacity_score, accessibility_score,
      ST_Y(geom::geometry) AS lat,
      ST_X(geom::geometry) AS lng,
      ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
     FROM safe_places
     WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
     ORDER BY distance_meters ASC LIMIT 80`,
    [origin.lng, origin.lat, radiusMeters]
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    source: row.source,
    address: row.address,
    contact: row.phone,
    openNow: row.open_now,
    capacityScore: Number(row.capacity_score),
    accessibilityScore: Number(row.accessibility_score),
    coordinates: { lat: Number(row.lat), lng: Number(row.lng) },
    distanceMeters: Number(row.distance_meters),
    safetyScore: 0,
    reasons: []
  }));
}

export async function getOsmPlaces(origin: Coordinates, radiusMeters: number): Promise<SafePlace[]> {
  return cached(`places:osm:${origin.lat.toFixed(3)}:${origin.lng.toFixed(3)}:${radiusMeters}`, 900, async () => {
    const filters = Object.entries(overpassTypes)
      .map(([type, filter]) => `node${filter}(around:${radiusMeters},${origin.lat},${origin.lng});way${filter}(around:${radiusMeters},${origin.lat},${origin.lng});relation${filter}(around:${radiusMeters},${origin.lat},${origin.lng});`)
      .join("");
    const queryBody = `[out:json][timeout:25];(${filters});out center tags 120;`;
    const { data } = await axios.post("https://overpass-api.de/api/interpreter", queryBody, {
      timeout: 12000,
      headers: { "Content-Type": "text/plain" }
    });
    return (data.elements ?? []).map((item: any) => {
      const tags = item.tags ?? {};
      const lat = item.lat ?? item.center?.lat;
      const lng = item.lon ?? item.center?.lon;
      const type = inferOsmType(tags);
      const coords = { lat, lng };
      return {
        id: uuidv5(`osm:${item.type}:${item.id}`, NS),
        name: tags.name ?? tags.amenity ?? tags.office ?? "Verified public location",
        type,
        coordinates: coords,
        distanceMeters: haversineMeters(origin, coords),
        openNow: tags.opening_hours ? undefined : true,
        address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" "),
        contact: tags.phone,
        source: "OpenStreetMap / HOT",
        safetyScore: 0,
        reasons: []
      } satisfies SafePlace;
    }).filter((place: SafePlace) => Number.isFinite(place.coordinates.lat) && Number.isFinite(place.coordinates.lng));
  });
}

export async function getGooglePlaces(origin: Coordinates, radiusMeters: number): Promise<SafePlace[]> {
  if (!config.googleMapsKey) return [];
  const results = await Promise.allSettled(googlePlaceSearches.map(async (search) => {
    const { data } = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      timeout: 8000,
      params: {
        location: `${origin.lat},${origin.lng}`,
        radius: radiusMeters,
        type: search.googleType,
        keyword: search.keyword,
        key: config.googleMapsKey
      }
    });
    return (data.results ?? []).map((item: any) => {
      const coords = { lat: item.geometry.location.lat, lng: item.geometry.location.lng };
      return {
        id: uuidv5(`google:${item.place_id}`, NS),
        name: item.name,
        type: search.type,
        coordinates: coords,
        distanceMeters: haversineMeters(origin, coords),
        openNow: item.opening_hours?.open_now,
        address: item.vicinity,
        source: "Google Places",
        safetyScore: 0,
        reasons: []
      } satisfies SafePlace;
    });
  }));
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

export async function getNearbyPlaces(origin: Coordinates, radiusMeters = 5000): Promise<SafePlace[]> {
  const settled = await Promise.allSettled([
    getDatabasePlaces(origin, radiusMeters),
    getOsmPlaces(origin, radiusMeters),
    getGooglePlaces(origin, radiusMeters)
  ]);
  const places = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  return Array.from(new Map(places.map((place) => [place.id, place])).values())
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 120);
}
