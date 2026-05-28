import { Router } from "express";
import { emergencySourceCatalog, productionConnectorNotes } from "../services/sourceCatalog.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ sources: emergencySourceCatalog, connectorNotes: productionConnectorNotes });
});

export default router;
