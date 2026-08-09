import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/api";

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            navigate({ to: "/", replace: true });
            return;
        }
        if (user.role !== role) {
            navigate({ to: user.role === "STAFF" ? "/staff" : "/book", replace: true });
        }
    }, [isLoading, user, role, navigate]);

    if (isLoading || !user || user.role !== role) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}
