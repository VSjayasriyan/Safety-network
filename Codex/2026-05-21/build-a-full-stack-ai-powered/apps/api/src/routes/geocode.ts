import axios from "axios";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";

const router = Router();
const schema = z.object({
  address: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional()
});

router.get("/", async (req, res, next) => {
  try {
    if (!config.googleMapsKey) {
      res.status(503).json({ error: "GOOGLE_MAPS_API_KEY is not configured." });
      return;
    }
    const input = schema.parse(req.query);
    const { data } = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      timeout: 8000,
      params: {
        address: input.address,
        latlng: input.lat !== undefined && input.lng !== undefined ? `${input.lat},${input.lng}` : undefined,
        key: config.googleMapsKey
      }
    });
    res.json({ results: data.results ?? [], status: data.status });
  } catch (error) {
    next(error);
  }
});

export default router;
