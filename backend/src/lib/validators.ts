import { z } from "zod";

export const registerPatientSchema = z.object({
  name: z.string().min(2, "Name is too short."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(7).optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerStaffSchema = z.object({
  name: z.string().min(2, "Name is too short."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  // Join an existing clinic ...
  clinicId: z.string().optional(),
  // ... or stand up a brand new one (first staff member becomes its admin).
  clinicName: z.string().min(2).optional(),
  clinicAddress: z.string().min(3).optional(),
}).refine((data) => data.clinicId || (data.clinicName && data.clinicAddress), {
  message: "Provide either clinicId (to join a clinic) or clinicName + clinicAddress (to create one).",
  path: ["clinicId"],
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const createBookingSchema = z.object({
  clinicId: z.string().min(1, "Select a clinic."),
  serviceId: z.string().min(1, "Select a service."),
  timeslot: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "timeslot must be a valid ISO date-time string.",
  }),
  notes: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export const createServiceSchema = z.object({
  name: z.string().min(2),
  durationMinutes: z.number().int().min(5).max(480).default(30),
});
