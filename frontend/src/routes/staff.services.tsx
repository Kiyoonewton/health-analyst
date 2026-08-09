import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Copy, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api, type Clinic } from "@/lib/api";

export const Route = createFileRoute("/staff/services")({
  head: () => ({
    meta: [
      { title: "Clinic Services — BrightSmile Staff" },
      {
        name: "description",
        content:
          "Manage the treatments patients can book at your clinic, including appointment duration for each service.",
      },
      { property: "og:title", content: "Clinic Services — BrightSmile Staff" },
      {
        property: "og:description",
        content: "Add and review bookable treatments and durations for your dental clinic.",
      },
    ],
  }),
  component: () => (
    <RequireRole role="STAFF">
      <ServicesPage />
    </RequireRole>
  ),
});

function ServicesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");

  const clinicsQuery = useQuery({ queryKey: ["clinics"], queryFn: api.clinics });
  const clinic: Clinic | undefined = (clinicsQuery.data ?? []).find((c) => c.id === user?.clinicId);

  const addService = useMutation({
    mutationFn: () =>
      api.addService({
        name: name.trim(),
        ...(Number(duration) > 0 ? { durationMinutes: Number(duration) } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clinics"] });
      setName("");
      toast.success("Service added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-semibold sm:text-4xl">Clinic services</h1>
        <p className="mt-2 text-muted-foreground">
          {clinic ? clinic.name : "Your clinic"} — these are the treatments patients can request.
        </p>

        {clinic ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 -ml-2 text-muted-foreground"
            onClick={() => {
              void navigator.clipboard?.writeText(clinic.id);
              toast.success("Clinic ID copied — share it with colleagues to join");
            }}
          >
            <Copy className="mr-2 size-3.5" /> Clinic ID: {clinic.id}
          </Button>
        ) : null}

        <Card className="shadow-soft mt-8 border-border/70">
          <CardContent className="p-5">
            <form
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) {
                  toast.error("Enter a service name");
                  return;
                }
                addService.mutate();
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="service-name">Service name</Label>
                <Input
                  id="service-name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Teeth whitening"
                />
              </div>
              <div className="space-y-2 sm:w-32">
                <Label htmlFor="service-duration">Minutes</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min={5}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={addService.isPending}>
                <Plus className="mr-2 size-4" /> Add
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-3">
          {clinicsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (clinic?.services ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-medium">No services yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first treatment so patients can book.
              </p>
            </div>
          ) : (
            (clinic?.services ?? []).map((s) => (
              <Card key={s.id} className="shadow-soft border-border/70">
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium">{s.name}</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {s.durationMinutes} min
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}