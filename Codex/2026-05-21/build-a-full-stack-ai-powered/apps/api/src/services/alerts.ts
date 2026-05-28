import axios from "axios";
import { v5 as uuidv5 } from "uuid";
import type { Coordinates, DisasterType, EmergencyAlert } from "@surakshanet/shared";
import { config } from "../config.js";
import { cached } from "./cache.js";
import { getNasaFirmsFires } from "./hazardFeeds.js";

const NS = "3cb0bf3c-7c23-4d8d-92d8-2f17e3db79c3";

function normalizeDisaster(text: string): DisasterType {
  const value = text.toLowerCase();
  if (value.includes("earthquake")) return "earthquake";
  if (value.includes("flood")) return "flood";
  if (value.includes("cyclone") || value.includes("storm") || value.includes("hurricane")) return "cyclone";
  if (value.includes("tsunami")) return "tsunami";
  if (value.includes("fire") || value.includes("wildfire")) return "fire";
  if (value.includes("riot") || value.includes("civil unrest")) return "riot";
  if (value.includes("medical")) return "medical";
  return "weather";
}

export async function getUSGSEarthquakes(origin?: Coordinates): Promise<EmergencyAlert[]> {
  const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson";
  return cached("alerts:usgs", 180, async () => {
    const { data } = await axios.get(url, { timeout: 8000 });
    return (data.features ?? []).map((feature: any) => ({
      id: uuidv5(`usgs:${feature.id}`, NS),
      source: "USGS Earthquake Hazards Program",
      title: feature.properties.title,
      type: "earthquake",
      severity: feature.properties.mag >= 7 ? "extreme" : feature.properties.mag >= 5.5 ? "severe" : "moderate",
      certainty: "observed",
      area: feature.properties.place ?? "Unknown",
      coordinates: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
      radiusKm: Math.max(25, feature.properties.mag * 20),
      startsAt: new Date(feature.properties.time).toISOString(),
      url: feature.properties.url,
      instructions: ["Drop, cover, and hold on.", "Move away from damaged structures.", "Check official aftershock updates."]
    })) as EmergencyAlert[];
  });
}

export async function getReliefWebAlerts(): Promise<EmergencyAlert[]> {
  return cached("alerts:reliefweb", 600, async () => {
    const { data } = await axios.get("https://api.reliefweb.int/v1/disasters", {
      timeout: 8000,
      params: {
        appname: config.reliefWebAppName,
        limit: 20,
        sort: "date:desc",
        profile: "list"
      }
    });
    return (data.data ?? []).map((item: any) => ({
      id: uuidv5(`reliefweb:${item.id}`, NS),
      source: "ReliefWeb / OCHA",
      title: item.fields.name,
      type: normalizeDisaster(item.fields.name),
      severity: "severe",
      certainty: "likely",
      area: (item.fields.country ?? []).map((c: any) => c.name).join(", ") || "Global",
      url: item.href,
      instructions: ["Follow national and local emergency authority guidance.", "Move toward verified shelters and medical support."]
    })) as EmergencyAlert[];
  });
}

export async function getWeatherAlerts(lat: number, lng: number): Promise<EmergencyAlert[]> {
  if (!config.openWeatherKey) return [];
  return cached(`alerts:owm:${lat.toFixed(2)}:${lng.toFixed(2)}`, 300, async () => {
    const { data } = await axios.get("https://api.openweathermap.org/data/3.0/onecall", {
      timeout: 8000,
      params: { lat, lon: lng, appid: config.openWeatherKey, exclude: "minutely,hourly,daily" }
    });
    return (data.alerts ?? []).map((alert: any) => ({
      id: uuidv5(`openweather:${alert.sender_name}:${alert.event}:${alert.start}`, NS),
      source: `OpenWeatherMap / ${alert.sender_name}`,
      title: alert.event,
      type: normalizeDisaster(alert.event),
      severity: "severe",
      certainty: "likely",
      area: "Current location",
      coordinates: { lat, lng },
      radiusKm: 60,
      startsAt: new Date(alert.start * 1000).toISOString(),
      endsAt: new Date(alert.end * 1000).toISOString(),
      instructions: [alert.description].filter(Boolean)
    })) as EmergencyAlert[];
  });
}

export async function getAllAlerts(lat?: number, lng?: number): Promise<EmergencyAlert[]> {
  const settled = await Promise.allSettled([
    getUSGSEarthquakes(lat && lng ? { lat, lng } : undefined),
    getReliefWebAlerts(),
    lat && lng ? getWeatherAlerts(lat, lng) : Promise.resolve([]),
    lat && lng ? getNasaFirmsFires({ lat, lng }) : Promise.resolve([])
  ]);
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
