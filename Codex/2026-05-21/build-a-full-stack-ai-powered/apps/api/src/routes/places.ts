import { Router } from "express";
import { z } from "zod";
import { getAllAlerts } from "../services/alerts.js";
import { getNearbyPlaces } from "../services/places.js";
import { scoreSafePlace } from "../services/safetyScoring.js";

const router = Router();
const schema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusMeters: z.coerce.number().min(500).max(50000).default(5000)
});

router.get("/", async (req, res, next) => {
  try {
    const input = schema.parse(req.query);
    const origin = { lat: input.lat, lng: input.lng };
    const [places, alerts] = await Promise.all([
      getNearbyPlaces(origin, input.radiusMeters),
      getAllAlerts(origin.lat, origin.lng)
    ]);
    const ranked = places.map((place) => scoreSafePlace(place, alerts)).sort((a, b) => b.safetyScore - a.safetyScore);
    res.json({ places: ranked, best: ranked[0] ?? null });
  } catch (error) {
    next(error);
  }
});

export default router;
