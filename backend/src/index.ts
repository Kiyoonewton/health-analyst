import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import clinicRoutes from "./routes/clinic.routes";
import bookingRoutes from "./routes/booking.routes";
import { openApiSpec } from "./docs/openapi.spec";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true, // required so the browser sends/receives the session cookie
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/bookings", bookingRoutes);

// API docs — GET /api/docs (Swagger UI), GET /api/docs.json (raw OpenAPI spec)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "Dental Booking API" }));
app.get("/api/docs.json", (_req, res) => res.json(openApiSpec));

// 404
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// Central error handler — keeps stack traces out of API responses
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our end." });
  }
);

app.listen(PORT, () => {
  console.log(`Dental booking API listening on http://localhost:${PORT}`);
});
