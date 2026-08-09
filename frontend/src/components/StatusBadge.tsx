import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/api";

const styles: Record<BookingStatus, string> = {
    PENDING: "bg-warning/20 text-warning-foreground border-warning/40",
    CONFIRMED: "bg-success/15 text-success border-success/40",
    CANCELLED: "bg-destructive/12 text-destructive border-destructive/35",
    COMPLETED: "bg-info/15 text-info border-info/40",
};

const labels: Record<BookingStatus, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
    return (
        <Badge variant="outline" className={cn("font-medium", styles[status])}>
            {labels[status]}
        </Badge>
    );
}