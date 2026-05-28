import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";

const router = Router();
const sosSchema = z.object({
  userId: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  message: z.string().optional(),
  contacts: z.array(z.object({ name: z.string(), phone: z.string() })).default([])
});

router.post("/", async (req, res, next) => {
  try {
    const input = sosSchema.parse(req.body);
    const liveLocationUrl = `https://maps.google.com/?q=${input.lat},${input.lng}`;
    const rows = await query<{ id: string }>(
      `INSERT INTO sos_events(user_id, geom, message, shared_with)
       VALUES($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5)
       RETURNING id`,
      [input.userId ?? null, input.lng, input.lat, input.message ?? "Emergency SOS", JSON.stringify(input.contacts)]
    );
    res.status(201).json({
      id: rows[0]?.id ?? "offline-sos",
      delivery: "queued",
      message: "SOS event recorded. Share links generated for WhatsApp, SMS, and email.",
      liveLocationUrl,
      shareLinks: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(input.message ?? `🚨 Emergency SOS ${liveLocationUrl}`)}`,
        sms: `sms:?&body=${encodeURIComponent(input.message ?? `🚨 Emergency SOS ${liveLocationUrl}`)}`,
        email: `mailto:?subject=${encodeURIComponent("SurakshaNet Emergency Alert")}&body=${encodeURIComponent(input.message ?? `🚨 Emergency SOS ${liveLocationUrl}`)}`
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
