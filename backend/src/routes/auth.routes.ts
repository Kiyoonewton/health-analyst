import { Router } from "express";
import { login, logout, me, registerPatient, registerStaff } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register/patient", registerPatient);
router.post("/register/staff", registerStaff);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
