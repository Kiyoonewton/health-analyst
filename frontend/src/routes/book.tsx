import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CheckCircle2, Clock, Loader2, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type Clinic, type Service } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Dental Visit — Healthalyst" },
      {
        name: "description",
        content:
          "Pick your clinic, choose a treatment and request a time slot. Your dentist's front desk confirms in minutes.",
      },
      { property: "og:title", content: "Book a Dental Visit — Healthalyst" },
      {
        property: "og:description",
        content: "Choose a clinic, a service and a time slot from your phone in under a minute.",
      },
    ],
  }),
  component: () => (
    <RequireRole role="PATIENT">
      <BookPage />
    </RequireRole>
  ),
});

const TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function BookPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [clinicId, setClinicId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const clinicsQuery = useQuery({ queryKey: ["clinics"], queryFn: api.clinics });
  const clinics: Clinic[] = clinicsQuery.data ?? [];
  const clinic = useMemo(() => clinics.find((c) => c.id === clinicId), [clinics, clinicId]);
  const services: Service[] = clinic?.services ?? [];

  const createBooking = useMutation({
    mutationFn: () =>
      api.createBooking({
        clinicId,
        serviceId,
        timeslot: new Date(`${date}T${time}`).toISOString(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      toast.success("Appointment requested — your clinic will confirm shortly.");
      navigate({ to: "/appointments" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit = clinicId && serviceId && date && time && !createBooking.isPending;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-semibold sm:text-4xl">Book a visit</h1>
        <p className="mt-2 text-muted-foreground">
          Three quick steps. You can cancel any time before your appointment.
        </p>

        <div className="mt-8 space-y-8">
          <Step index={1} title="Choose your clinic">
            {clinicsQuery.isLoading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : clinics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clinics available yet. Check back shortly.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {clinics.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClinicId(c.id);
                      setServiceId("");
                    }}
                    className={cn(
                      "rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/60",
                      clinicId === c.id && "border-primary bg-accent/40 ring-2 ring-primary/30",
                    )}
                  >
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Step>

          <Step index={2} title="Pick a service" disabled={!clinicId}>
            {!clinicId ? (
              <p className="text-sm text-muted-foreground">Select a clinic first.</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This clinic hasn't published services yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/60",
                      serviceId === s.id && "border-primary bg-accent/40 ring-2 ring-primary/30",
                    )}
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.durationMinutes ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="size-3.5" />
                        {s.durationMinutes}m
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </Step>

          <Step index={3} title="Choose date & time" disabled={!serviceId}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Time slot</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={cn(
                        "rounded-lg border border-border bg-card py-2.5 text-sm font-medium transition-all hover:border-primary/60",
                        time === t && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Anything we should know? (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Sensitive to cold, prefer morning appointments…"
                />
              </div>
            </div>
          </Step>
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border/70 bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 text-sm text-muted-foreground">
            {clinic && serviceId && time ? (
              <span className="line-clamp-2 sm:truncate">
                {services.find((s) => s.id === serviceId)?.name} · {clinic.name} · {date} {time}
              </span>
            ) : (
              "Complete the steps to request your appointment"
            )}
          </div>
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={() => createBooking.mutate()}
            className="w-full sm:w-auto"
          >
            {createBooking.isPending ? "Requesting…" : "Request appointment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({
  index,
  title,
  disabled,
  children,
}: {
  index: number;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("shadow-soft border-border/70", disabled && "opacity-70")}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-brand flex size-7 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
            {disabled ? index : <CheckCircle2 className="size-4" />}
          </span>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
