import { Router } from "express";
import { z } from "zod";
import { getAllAlerts } from "../services/alerts.js";

const router = Router();
const locationSchema = z.object({ lat: z.coerce.number().optional(), lng: z.coerce.number().optional() });

router.get("/", async (req, res, next) => {
  try {
    const { lat, lng } = locationSchema.parse(req.query);
    res.json({ alerts: await getAllAlerts(lat, lng) });
  } catch (error) {
    next(error);
  }
});

export default router;
