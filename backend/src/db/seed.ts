import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./index";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const insertClinic = db.prepare("INSERT INTO clinics (id, name, address) VALUES (?, ?, ?)");
  const insertService = db.prepare(
    "INSERT INTO services (id, clinic_id, name, duration_minutes) VALUES (?, ?, ?, ?)"
  );
  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, phone, password_hash, role, clinic_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const healthalystId = randomUUID();
  insertClinic.run(healthalystId, "Healthalyst Dental Clinic", "12 Adeola Odeku St, Victoria Island, Lagos");
  for (const [name, mins] of [
    ["Check-up & Cleaning", 30],
    ["Tooth Extraction", 45],
    ["Teeth Whitening", 60],
    ["Root Canal", 90],
  ] as const) {
    insertService.run(randomUUID(), healthalystId, name, mins);
  }

  const familyCareId = randomUUID();
  insertClinic.run(familyCareId, "Family Care Dental", "5 Allen Avenue, Ikeja, Lagos");
  for (const [name, mins] of [
    ["Check-up & Cleaning", 30],
    ["Braces Consultation", 45],
    ["Cavity Filling", 40],
  ] as const) {
    insertService.run(randomUUID(), familyCareId, name, mins);
  }

  insertUser.run(randomUUID(), "Dr. Amaka Obi", "staff@healthalyst.test", null, passwordHash, "STAFF", healthalystId);
  insertUser.run(randomUUID(), "Dr. Femi Balogun", "staff@familycare.test", null, passwordHash, "STAFF", familyCareId);
  insertUser.run(randomUUID(), "Isaac Patient", "patient@test.test", "+2348012345678", passwordHash, "PATIENT", null);

  console.log("Seeded 2 clinics, 2 staff accounts, 1 patient account.");
  console.log("Login with password123 for all seeded accounts:");
  console.log("  staff@healthalyst.test  (Healthalyst Dental Clinic staff)");
  console.log("  staff@familycare.test   (Family Care Dental staff)");
  console.log("  patient@test.test       (patient)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
