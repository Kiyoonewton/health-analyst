import { Router } from "express";
import {
  cancelMyBooking,
  createBooking,
  getBooking,
  listClinicBookings,
  listMyBookings,
  updateBookingStatus,
} from "../controllers/booking.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// Patient-only
router.post("/", requireRole("PATIENT"), createBooking);
router.get("/mine", requireRole("PATIENT"), listMyBookings);
router.patch("/:id/cancel", requireRole("PATIENT"), cancelMyBooking);

// Staff-only
router.get("/clinic", requireRole("STAFF"), listClinicBookings);
router.patch("/:id/status", requireRole("STAFF"), updateBookingStatus);

// Either role — ownership is enforced inside the controller
router.get("/:id", requireRole("PATIENT", "STAFF"), getBooking);

export default router;
