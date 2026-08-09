import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { BookingCard } from "@/components/BookingCard";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { api, type Booking } from "@/lib/api";

export const Route = createFileRoute("/appointments")({
    head: () => ({
        meta: [
            { title: "My Dental Appointments — BrightSmile" },
            {
                name: "description",
                content:
                    "See the status of every appointment you've requested, with clinic, treatment and time slot details, and cancel in one tap.",
            },
            { property: "og:title", content: "My Dental Appointments — BrightSmile" },
            {
                property: "og:description",
                content: "Track and cancel your dental appointment requests from any device.",
            },
        ],
    }),
    component: () => (
        <RequireRole role="PATIENT">
            <AppointmentsPage />
        </RequireRole>
    ),
});

function AppointmentsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["my-bookings"], queryFn: api.myBookings });
    const bookings: Booking[] = data ?? [];

    const cancel = useMutation({
        mutationFn: (id: string) => api.cancelBooking(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
            toast.success("Appointment cancelled");
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const upcoming = bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED");
    const past = bookings.filter((b) => b.status === "CANCELLED" || b.status === "COMPLETED");

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-semibold sm:text-4xl">My appointments</h1>
                        <p className="mt-2 text-muted-foreground">Only you can see these bookings.</p>
                    </div>
                    <Button asChild>
                        <Link to="/book">
                            <CalendarPlus className="mr-2 size-4" /> New booking
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
                        <p className="font-medium">No appointments yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Request a visit and it'll show up here instantly.
                        </p>
                        <Button asChild className="mt-5">
                            <Link to="/book">Book your first visit</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="mt-8 space-y-8">
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Upcoming ({upcoming.length})
                            </h2>
                            {upcoming.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nothing upcoming.</p>
                            ) : (
                                upcoming.map((b) => (
                                    <BookingCard
                                        key={b.id}
                                        booking={b}
                                        actions={
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={cancel.isPending}
                                                onClick={() => cancel.mutate(b.id)}
                                            >
                                                Cancel appointment
                                            </Button>
                                        }
                                    />
                                ))
                            )}
                        </section>

                        {past.length > 0 ? (
                            <section className="space-y-3">
                                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    History ({past.length})
                                </h2>
                                {past.map((b) => (
                                    <BookingCard key={b.id} booking={b} />
                                ))}
                            </section>
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
}