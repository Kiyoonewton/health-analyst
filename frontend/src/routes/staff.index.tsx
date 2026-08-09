import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { BookingCard } from "@/components/BookingCard";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type Booking, type BookingStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "Front Desk — Clinic Appointment Dashboard | Healthalyst" },
      {
        name: "description",
        content:
          "Clinic staff dashboard: see incoming patient booking requests for your clinic and confirm, complete or cancel them in one click.",
      },
      { property: "og:title", content: "Front Desk — Clinic Appointment Dashboard" },
      {
        property: "og:description",
        content: "Every booking request for your clinic, updated live, with patient and slot details.",
      },
    ],
  }),
  component: () => (
    <RequireRole role="STAFF">
      <StaffDashboard />
    </RequireRole>
  ),
});

const FILTERS: Array<{ label: string; value: BookingStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function StaffDashboard() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [date, setDate] = useState("");

  const queryKey = ["clinic-bookings", status, date] as const;
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      api.clinicBookings({
        ...(status !== "ALL" ? { status } : {}),
        ...(date ? { date } : {}),
      }),
    refetchInterval: 15_000,
  });
  const bookings: Booking[] = data ?? [];

  const setBookingStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: BookingStatus }) => api.setStatus(id, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clinic-bookings"] });
      toast.success("Booking updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const counts = FILTERS.slice(1).map((f) => ({
    label: f.label,
    value: bookings.filter((b) => b.status === f.value).length,
  }));

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Front desk</h1>
            <p className="mt-2 text-muted-foreground">
              Booking requests for your clinic only — refreshed automatically.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map((c) => (
            <Card key={c.label} className="shadow-soft border-border/70">
              <CardContent className="p-4">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">{c.label}</p>
                <p className="font-display mt-1 text-2xl font-semibold">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={cn(
                  "rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/60",
                  status === f.value && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-end gap-2">
            <Input
              type="date"
              aria-label="Filter by date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            {date ? (
              <Button variant="ghost" size="sm" onClick={() => setDate("")}>
                Clear
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}>
                <CalendarDays className="mr-2 size-4" /> Today
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">No bookings match this view</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New patient requests appear here the moment they're made.
              </p>
            </div>
          ) : (
            bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                showPatient
                actions={
                  <>
                    {b.status !== "CONFIRMED" && b.status !== "CANCELLED" ? (
                      <Button
                        size="sm"
                        disabled={setBookingStatus.isPending}
                        onClick={() => setBookingStatus.mutate({ id: b.id, next: "CONFIRMED" })}
                      >
                        Confirm
                      </Button>
                    ) : null}
                    {b.status === "CONFIRMED" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={setBookingStatus.isPending}
                        onClick={() => setBookingStatus.mutate({ id: b.id, next: "COMPLETED" })}
                      >
                        Mark completed
                      </Button>
                    ) : null}
                    {b.status !== "CANCELLED" && b.status !== "COMPLETED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setBookingStatus.isPending}
                        onClick={() => setBookingStatus.mutate({ id: b.id, next: "CANCELLED" })}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </>
                }
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}