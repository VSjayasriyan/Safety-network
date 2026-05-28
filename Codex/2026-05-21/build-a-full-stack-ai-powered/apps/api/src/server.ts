import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import alerts from "./routes/alerts.js";
import places from "./routes/places.js";
import ai from "./routes/ai.js";
import incidents from "./routes/incidents.js";
import sos from "./routes/sos.js";
import sources from "./routes/sources.js";
import safeRoute from "./routes/safeRoute.js";
import geocode from "./routes/geocode.js";
import { config } from "./config.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "surakshanet-api" }));
app.use("/api/alerts", alerts);
app.use("/api/places", places);
app.use("/api/ai", ai);
app.use("/api/incidents", incidents);
app.use("/api/sos", sos);
app.use("/api/sources", sources);
app.use("/api/routes/safe", safeRoute);
app.use("/api/geocode", geocode);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
});

app.listen(config.port, () => {
  console.log(`SurakshaNet API listening on http://localhost:${config.port}`);
});
