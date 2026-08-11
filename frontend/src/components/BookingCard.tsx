import { CalendarDays, Clock, MapPin, StickyNote, User as UserIcon } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { Booking } from "@/lib/api";
import { formatSlot } from "@/lib/format";

export function BookingCard({
    booking,
    showPatient = false,
    actions,
}: {
    booking: Booking;
    showPatient?: boolean;
    actions?: React.ReactNode;
}) {
    return (
        <Card className="shadow-soft border-border/70">
            <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="font-display text-base font-semibold">
                            {booking.service?.name ?? "Appointment"}
                        </h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="size-4" />
                            {formatSlot(booking.timeslot)}
                        </p>
                    </div>
                    <StatusBadge status={booking.status} />
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    {showPatient && booking.patient ? (
                        <p className="flex min-w-0 items-start gap-1.5">
                            <UserIcon className="mt-0.5 size-4 shrink-0" />
                            <span className="break-words">
                                <span className="text-foreground">{booking.patient.name}</span>
                                {" · "}
                                {booking.patient.phone ?? booking.patient.email}
                            </span>
                        </p>
                    ) : null}
                    {booking.clinic ? (
                        <p className="flex min-w-0 items-start gap-1.5">
                            <MapPin className="mt-0.5 size-4 shrink-0" />
                            <span className="break-words">
                                {booking.clinic.name}
                                {booking.clinic.address ? ` · ${booking.clinic.address}` : ""}
                            </span>
                        </p>
                    ) : null}
                    {booking.service?.durationMinutes ? (
                        <p className="flex items-center gap-1.5">
                            <Clock className="size-4 shrink-0" />
                            {booking.service.durationMinutes} min
                        </p>
                    ) : null}
                    {booking.notes ? (
                        <p className="flex items-start gap-1.5">
                            <StickyNote className="mt-0.5 size-4 shrink-0" />
                            <span>{booking.notes}</span>
                        </p>
                    ) : null}
                </div>

                {actions ? <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">{actions}</div> : null}
            </CardContent>
        </Card>
    );
}