import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";

const router = Router();
const incidentSchema = z.object({
  type: z.string(),
  description: z.string().min(5),
  severity: z.number().min(1).max(5),
  lat: z.number(),
  lng: z.number(),
  userId: z.string().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const input = incidentSchema.parse(req.body);
    const rows = await query<{ id: string }>(
      `INSERT INTO incident_reports(user_id, type, description, severity, geom)
       VALUES($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography)
       RETURNING id`,
      [input.userId ?? null, input.type, input.description, input.severity, input.lng, input.lat]
    );
    res.status(201).json({ id: rows[0]?.id ?? "offline-accepted" });
  } catch (error) {
    next(error);
  }
});

export default router;
