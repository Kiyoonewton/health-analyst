/**
 * OpenAPI 3.0 spec for the dental booking API.
 * Serves at: /api/docs
 */

const ErrorResponse = {
  type: "object",
  properties: {
    error: { type: "string", example: "Something went wrong." },
  },
};

const User = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", example: "Jane Doe" },
    email: { type: "string", format: "email", example: "jane@example.com" },
    phone: { type: "string", nullable: true, example: "+1 555-0100" },
    role: { type: "string", enum: ["PATIENT", "STAFF"] },
    clinicId: { type: "string", format: "uuid", nullable: true },
  },
};

const Service = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", example: "Cleaning" },
    durationMinutes: { type: "integer", example: 30 },
  },
};

const Clinic = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", example: "Healthalyst Dental Clinic" },
    address: { type: "string", example: "123 Main St, Toronto, ON" },
    services: { type: "array", items: Service },
  },
};

const Booking = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    timeslot: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
    notes: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    patient: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", nullable: true },
      },
    },
    service: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        durationMinutes: { type: "integer" },
      },
    },
    clinic: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        address: { type: "string" },
      },
    },
  },
};

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Healthalyst API",
    version: "1.0.0",
    description:
      "Role-based dental appointment booking API for patients and clinic staff. Auth is cookie-based (JWT in an httpOnly cookie) — log in via /api/auth/login and the cookie is sent automatically on subsequent requests.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local dev server" }],
  tags: [
    { name: "Auth", description: "Registration, login, session" },
    { name: "Clinics", description: "Clinics and the services they offer" },
    { name: "Bookings", description: "Appointment booking, for patients and staff" },
  ],
  components: {
    schemas: { Error: ErrorResponse, User, Clinic, Service, Booking },
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "httpOnly JWT cookie set by /api/auth/login or /api/auth/register/*",
      },
    },
  },
  paths: {
    "/api/auth/register/patient": {
      post: {
        tags: ["Auth"],
        summary: "Register a new patient",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string", example: "+1 555-0100" },
                  password: { type: "string", format: "password", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Patient created and logged in",
            content: { "application/json": { schema: { type: "object", properties: { user: User } } } },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
          "409": { description: "Email already registered", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/auth/register/staff": {
      post: {
        tags: ["Auth"],
        summary: "Register a new staff member",
        description:
          "Either join an existing clinic via clinicId, or create a new one by providing clinicName + clinicAddress.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password", minLength: 8 },
                  clinicId: { type: "string", format: "uuid", description: "Join an existing clinic" },
                  clinicName: { type: "string", description: "Create a new clinic (with clinicAddress)" },
                  clinicAddress: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Staff account created and logged in",
            content: { "application/json": { schema: { type: "object", properties: { user: User } } } },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
          "404": { description: "clinicId not found", content: { "application/json": { schema: ErrorResponse } } },
          "409": { description: "Email already registered", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged in",
            content: { "application/json": { schema: { type: "object", properties: { user: User } } } },
          },
          "401": { description: "Invalid email or password", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Logged out",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current logged-in user",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: { "application/json": { schema: { type: "object", properties: { user: User } } } },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/clinics": {
      get: {
        tags: ["Clinics"],
        summary: "List all clinics and their services",
        description: "Requires login (any role). Powers the clinic + service pickers in the booking form.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of clinics",
            content: { "application/json": { schema: { type: "object", properties: { clinics: { type: "array", items: Clinic } } } } },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/clinics/services": {
      post: {
        tags: ["Clinics"],
        summary: "Add a service to your own clinic",
        description: "Staff-only. The service is added to the caller's own clinic (from their session).",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Cleaning" },
                  durationMinutes: { type: "integer", minimum: 5, maximum: 480, default: 30 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Service created",
            content: { "application/json": { schema: { type: "object", properties: { service: Service } } } },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "403": { description: "Not a staff user", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        description: "Patient-only. The booking is always created for the logged-in patient.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clinicId", "serviceId", "timeslot"],
                properties: {
                  clinicId: { type: "string", format: "uuid" },
                  serviceId: { type: "string", format: "uuid" },
                  timeslot: { type: "string", format: "date-time" },
                  notes: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Booking created",
            content: { "application/json": { schema: { type: "object", properties: { booking: Booking } } } },
          },
          "400": { description: "Validation error, or service doesn't belong to clinic", content: { "application/json": { schema: ErrorResponse } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "403": { description: "Not a patient", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/bookings/mine": {
      get: {
        tags: ["Bookings"],
        summary: "List my bookings",
        description: "Patient-only. Returns only bookings belonging to the logged-in patient.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of bookings",
            content: { "application/json": { schema: { type: "object", properties: { bookings: { type: "array", items: Booking } } } } },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "403": { description: "Not a patient", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/bookings/clinic": {
      get: {
        tags: ["Bookings"],
        summary: "List bookings for my clinic",
        description: "Staff-only. Supports optional filters.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
          },
          { name: "date", in: "query", schema: { type: "string", format: "date" }, description: "YYYY-MM-DD" },
        ],
        responses: {
          "200": {
            description: "List of bookings for the caller's clinic",
            content: { "application/json": { schema: { type: "object", properties: { bookings: { type: "array", items: Booking } } } } },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "403": { description: "Not a staff user", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Get a single booking",
        description:
          "A patient may only fetch their own booking; staff may only fetch one belonging to their own clinic. A mismatched id returns 404, not 403.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Booking",
            content: { "application/json": { schema: { type: "object", properties: { booking: Booking } } } },
          },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "404": { description: "Booking not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/bookings/{id}/status": {
      patch: {
        tags: ["Bookings"],
        summary: "Update a booking's status",
        description: "Staff-only. The booking must belong to the caller's own clinic.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated booking",
            content: { "application/json": { schema: { type: "object", properties: { booking: Booking } } } },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "403": { description: "Not a staff user", content: { "application/json": { schema: ErrorResponse } } },
          "404": { description: "Booking not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/bookings/{id}/cancel": {
      patch: {
        tags: ["Bookings"],
        summary: "Cancel my booking",
        description: "Patient-only, self-service cancel of their own upcoming booking.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Cancelled booking",
            content: { "application/json": { schema: { type: "object", properties: { booking: Booking } } } },
          },
          "400": { description: "A completed booking can't be cancelled", content: { "application/json": { schema: ErrorResponse } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: ErrorResponse } } },
          "403": { description: "Not a patient", content: { "application/json": { schema: ErrorResponse } } },
          "404": { description: "Booking not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
  },
};
