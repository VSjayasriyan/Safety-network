import axios from "axios";
import type { Coordinates, EmergencyAlert } from "@surakshanet/shared";
import { config } from "../config.js";
import { cached } from "./cache.js";

export async function getNasaFirmsFires(origin: Coordinates): Promise<EmergencyAlert[]> {
  if (!config.nasaFirmsKey) return [];
  return cached(`hazards:firms:${origin.lat.toFixed(1)}:${origin.lng.toFixed(1)}`, 900, async () => {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${config.nasaFirmsKey}/VIIRS_SNPP_NRT/world/1`;
    const { data } = await axios.get<string>(url, { timeout: 12000 });
    return data
      .split("\n")
      .slice(1, 60)
      .map((line, index) => {
        const [lat, lng, brightness, scan, track, acqDate, acqTime, satellite, instrument, confidence] = line.split(",");
        return {
          id: `firms-${acqDate}-${acqTime}-${index}`,
          source: "FIRMS NASA",
          title: `Satellite fire detection (${confidence ?? "unknown"} confidence)`,
          type: "fire",
          severity: Number(brightness) > 350 ? "severe" : "moderate",
          certainty: "observed",
          area: "Satellite hotspot",
          coordinates: { lat: Number(lat), lng: Number(lng) },
          radiusKm: 8,
          instructions: ["Avoid smoke and fire perimeter.", "Move crosswind or upwind.", "Follow fire authority evacuation orders."]
        } satisfies EmergencyAlert;
      })
      .filter((alert) => Number.isFinite(alert.coordinates.lat) && Number.isFinite(alert.coordinates.lng));
  });
}

export async function getFemaDisasterDeclarations(): Promise<unknown> {
  return cached("hazards:fema:declarations", 3600, async () => {
    const { data } = await axios.get("https://www.fema.gov/openfema-data-hub/arcgis/rest/services/public/DisasterDeclarationsSummaries_v2/FeatureServer/0/query", {
      timeout: 8000,
      params: { where: "1=1", outFields: "*", orderByFields: "declarationDate DESC", resultRecordCount: 10, f: "json" }
    });
    return data;
  });
}
