import { Router } from "express";
import { createService, listClinics } from "../controllers/clinic.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Public-ish (still requires login, but any role): populates the
// clinic + service pickers in the patient booking form.
router.get("/", requireAuth, listClinics);

router.post("/services", requireAuth, requireRole("STAFF"), createService);

export default router;
