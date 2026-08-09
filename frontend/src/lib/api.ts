import { getToken, setToken } from "./auth-token";

export const API_BASE =
  (import.meta.env["VITE_API_BASE"] as string | undefined) ??
  "http://localhost:4000";

export type Role = "PATIENT" | "STAFF";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  clinicId?: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  services: Service[];
}

export interface Booking {
  id: string;
  timeslot: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient: User;
  service: Service;
  clinic: Clinic;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    credentials: "include",
  };
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  const token = await getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (Object.keys(headers).length > 0) {
    init.headers = headers;
  }
  const res = await fetch(`${API_BASE}${path}`, init);

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : typeof data === "string" && data
          ? data
          : `Request failed (${res.status})`) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

function unwrapUser(data: unknown): User {
  if (data && typeof data === "object" && "user" in data) {
    return (data as { user: User }).user;
  }
  return data as User;
}

// Web relies solely on the httpOnly cookie the server sets; native builds
// also need the raw token to send back as a Bearer header (see auth-token.ts).
async function unwrapSession(data: unknown): Promise<User> {
  if (data && typeof data === "object" && "token" in data) {
    await setToken((data as { token: string }).token);
  }
  return unwrapUser(data);
}

function unwrapList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && key in data) {
    const inner = (data as Record<string, unknown>)[key];
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

function unwrapItem<T>(data: unknown, key: string): T {
  if (data && typeof data === "object" && key in data) {
    return (data as Record<string, T>)[key] as T;
  }
  return data as T;
}

export const api = {
  me: async () => unwrapUser(await request<unknown>("/api/auth/me")),

  login: async (body: { email: string; password: string }) =>
    unwrapSession(
      await request<unknown>("/api/auth/login", { method: "POST", body }),
    ),

  registerPatient: async (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
    unwrapSession(
      await request<unknown>("/api/auth/register/patient", {
        method: "POST",
        body,
      }),
    ),

  registerStaff: async (body: {
    name: string;
    email: string;
    password: string;
    clinicId?: string;
    clinicName?: string;
    clinicAddress?: string;
  }) =>
    unwrapSession(
      await request<unknown>("/api/auth/register/staff", {
        method: "POST",
        body,
      }),
    ),

  logout: async () => {
    await setToken(null);
    return request<unknown>("/api/auth/logout", { method: "POST" });
  },

  clinics: async () =>
    unwrapList<Clinic>(await request<unknown>("/api/clinics"), "clinics"),

  addService: async (body: { name: string; durationMinutes?: number }) =>
    unwrapItem<Service>(
      await request<unknown>("/api/clinics/services", { method: "POST", body }),
      "service",
    ),

  createBooking: async (body: {
    clinicId: string;
    serviceId: string;
    timeslot: string;
    notes?: string;
  }) =>
    unwrapItem<Booking>(
      await request<unknown>("/api/bookings", { method: "POST", body }),
      "booking",
    ),

  myBookings: async () =>
    unwrapList<Booking>(
      await request<unknown>("/api/bookings/mine"),
      "bookings",
    ),

  clinicBookings: async (params: { status?: string; date?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.date) qs.set("date", params.date);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return unwrapList<Booking>(
      await request<unknown>(`/api/bookings/clinic${suffix}`),
      "bookings",
    );
  },

  booking: async (id: string) =>
    unwrapItem<Booking>(
      await request<unknown>(`/api/bookings/${id}`),
      "booking",
    ),

  setStatus: async (id: string, status: BookingStatus) =>
    unwrapItem<Booking>(
      await request<unknown>(`/api/bookings/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
      "booking",
    ),

  cancelBooking: async (id: string) =>
    unwrapItem<Booking>(
      await request<unknown>(`/api/bookings/${id}/cancel`, { method: "PATCH" }),
      "booking",
    ),
};
