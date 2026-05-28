import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { getAllAlerts } from "../services/alerts.js";
import { haversineMeters } from "../services/geo.js";
import { config } from "../config.js";

const router = Router();
const schema = z.object({
  fromLat: z.coerce.number(),
  fromLng: z.coerce.number(),
  toLat: z.coerce.number(),
  toLng: z.coerce.number()
});

router.get("/", async (req, res, next) => {
  try {
    const input = schema.parse(req.query);
    const from = { lat: input.fromLat, lng: input.fromLng };
    const to = { lat: input.toLat, lng: input.toLng };
    const alerts = await getAllAlerts(from.lat, from.lng);
    const avoidZones = alerts
      .filter((alert) => alert.coordinates && ["severe", "extreme"].includes(alert.severity))
      .map((alert) => ({ center: alert.coordinates, radiusKm: alert.radiusKm ?? 10, title: alert.title, severity: alert.severity }));
    const routeRisk = avoidZones.reduce((risk, zone) => {
      const distance = haversineMeters(to, zone.center!);
      return risk + (distance < zone.radiusKm * 1000 ? 35 : 5);
    }, 0);
    const matrix = config.googleDistanceMatrixKey
      ? await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
          timeout: 8000,
          params: {
            origins: `${from.lat},${from.lng}`,
            destinations: `${to.lat},${to.lng}`,
            mode: "driving",
            departure_time: "now",
            traffic_model: "best_guess",
            key: config.googleDistanceMatrixKey
          }
        }).then(({ data }) => data.rows?.[0]?.elements?.[0]).catch(() => null)
      : null;
    res.json({
      providerReady: "Google Directions renders routes in the web map. Distance Matrix enriches ETA and distance when GOOGLE_DISTANCE_MATRIX_KEY is configured.",
      routeRiskScore: Math.min(100, routeRisk),
      distance: matrix?.distance?.text ?? null,
      eta: matrix?.duration_in_traffic?.text ?? matrix?.duration?.text ?? null,
      avoidZones,
      navigationUrl: `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}`,
      instructions: ["Avoid active hazard zones.", "Do not cross floodwater, fire perimeters, unstable bridges, or crowd conflict areas.", "Follow official evacuation routes when issued."]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
