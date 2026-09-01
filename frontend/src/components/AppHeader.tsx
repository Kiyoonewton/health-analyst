import { Browser } from "@capacitor/browser";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, LogOut, Menu, Stethoscope } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAMY_URL = "https://www.namyapp.com/explore";

interface NavItem {
    to: string;
    label: string;
}

const patientNav: NavItem[] = [
    { to: "/book", label: "Book a visit" },
    { to: "/appointments", label: "My appointments" },
];

const staffNav: NavItem[] = [
    { to: "/staff", label: "Front desk" },
    { to: "/staff/services", label: "Services" },
];

export function AppHeader() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    const items = user?.role === "STAFF" ? staffNav : user?.role === "PATIENT" ? patientNav : [];

    async function handleSignOut() {
        setOpen(false);
        await signOut();
        navigate({ to: "/", replace: true });
    }

    async function openNamy() {
        setOpen(false);
        await Browser.open({ url: NAMY_URL });
    }

    return (
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
                <Link to="/" className="flex items-center gap-2">
                    <span className="bg-brand flex size-9 items-center justify-center rounded-xl text-primary-foreground">
                        <Stethoscope className="size-5" />
                    </span>
                    <span className="font-display text-lg font-semibold tracking-tight">Healthalyst</span>
                </Link>

                <nav className="ml-6 hidden items-center gap-1 md:flex">
                    {items.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                                pathname === item.to && "bg-secondary text-foreground",
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <button
                        type="button"
                        onClick={openNamy}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        Explore on Namy
                    </button>
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    {user ? (
                        <>
                            <div className="hidden items-center gap-2 sm:flex">
                                <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                                    {initials(user.name)}
                                </span>
                                <div className="leading-tight">
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user.role === "STAFF" ? "Clinic staff" : "Patient"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSignOut}
                                aria-label="Sign out"
                                className="hidden md:inline-flex"
                            >
                                <LogOut className="size-4" />
                            </Button>
                            <Sheet open={open} onOpenChange={setOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu">
                                        <Menu className="size-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-72">
                                    <div className="mt-8 flex flex-col gap-1">
                                        <p className="px-3 pb-3 text-sm text-muted-foreground">
                                            Signed in as {user.name}
                                        </p>
                                        {items.map((item) => (
                                            <Link
                                                key={item.to}
                                                to={item.to}
                                                onClick={() => setOpen(false)}
                                                className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary"
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={openNamy}
                                            className="rounded-lg px-3 py-3 text-left text-base font-medium hover:bg-secondary"
                                        >
                                            Explore on Namy
                                        </button>
                                        <Button variant="outline" className="mt-4" onClick={handleSignOut}>
                                            <LogOut className="mr-2 size-4" /> Sign out
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </>
                    ) : (
                        <Button asChild size="sm">
                            <Link to="/">
                                <CalendarCheck className="mr-2 size-4" /> Sign in
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}