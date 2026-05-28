import axios from "axios";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { getAllAlerts } from "../services/alerts.js";
import { getNearbyPlaces } from "../services/places.js";
import { scoreSafePlace } from "../services/safetyScoring.js";

const router = Router();
const chatSchema = z.object({
  message: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  language: z.string().default("en")
});

router.post("/chat", async (req, res, next) => {
  try {
    const input = chatSchema.parse(req.body);
    const origin = input.lat && input.lng ? { lat: input.lat, lng: input.lng } : undefined;
    const alerts = await getAllAlerts(origin?.lat, origin?.lng);
    const places = origin
      ? (await getNearbyPlaces(origin, 8000)).map((place) => scoreSafePlace(place, alerts)).sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 8)
      : [];
    try {
      const { data } = await axios.post(`${config.aiServiceUrl}/chat`, { ...input, alerts, places }, { timeout: 12000 });
      res.json(data);
    } catch {
      const best = places[0];
      res.json({
        answer: best
          ? `The safest nearby option appears to be ${best.name}, about ${Math.round(best.distanceMeters)}m away, with a safety score of ${best.safetyScore}. Move only if the route is clear and follow official instructions.`
          : "Share your location to rank nearby hospitals, shelters, police stations, and public safe zones.",
        recommendedPlace: best ?? null,
        actions: ["Check official alerts", "Share live location with emergency contacts", "Avoid flooded, burning, or crowded areas"]
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
