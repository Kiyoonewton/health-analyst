import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarCheck, HeartPulse, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AndroidAppAlert } from "@/components/AndroidAppAlert";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { api, type Role } from "@/lib/api";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "Healthalyst — Book Your Appointment Online" },
            {
                name: "description",
                content:
                    "Book dental appointments in seconds. Patients choose a clinic, service and time slot; clinic staff manage every request from one front-desk dashboard.",
            },
            { property: "og:title", content: "Healthalyst — Book Your Appointment Online" },
            {
                property: "og:description",
                content:
                    "Patient and clinic-staff logins, instant booking requests and a live front-desk view of every appointment.",
            },
        ],
    }),
    component: Landing,
});

type Mode = "login" | "register";

function Landing() {
    const { user, isLoading, refresh } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState<Role>("PATIENT");
    const [mode, setMode] = useState<Mode>("login");

    useEffect(() => {
        if (!isLoading && user) {
            navigate({ to: user.role === "STAFF" ? "/staff" : "/book", replace: true });
        }
    }, [isLoading, user, navigate]);

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main>
                <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
                    <AndroidAppAlert />
                </div>
                <section className="bg-hero">
                    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                                <Sparkles className="size-3.5" /> Same-day requests · No phone calls
                            </span>
                            <h1 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">
                                Dental care booked in three taps.
                            </h1>
                            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                                Patients pick a clinic, a treatment and a time. The clinic's front desk sees the
                                request the moment it lands — no double bookings, no voicemail tag.
                            </p>
                            <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
                                {[
                                    { icon: CalendarCheck, text: "Live appointment requests" },
                                    { icon: ShieldCheck, text: "Private to you and your clinic" },
                                    { icon: Smartphone, text: "Built for booking on mobile" },
                                    { icon: HeartPulse, text: "Every service, every duration" },
                                ].map(({ icon: Icon, text }) => (
                                    <li key={text} className="flex items-center gap-2 text-muted-foreground">
                                        <Icon className="size-4 text-primary" />
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Card className="shadow-lift border-border/60">
                            <CardHeader>
                                <CardTitle className="text-xl">Welcome back</CardTitle>
                                <CardDescription>Choose how you use Healthalyst.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="PATIENT">I'm a patient</TabsTrigger>
                                        <TabsTrigger value="STAFF">Clinic staff</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="PATIENT" className="pt-5">
                                        <AuthForms role="PATIENT" mode={mode} setMode={setMode} onDone={refresh} />
                                    </TabsContent>
                                    <TabsContent value="STAFF" className="pt-5">
                                        <AuthForms role="STAFF" mode={mode} setMode={setMode} onDone={refresh} />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
            <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
                Healthalyst · Appointments handled with care
            </footer>
        </div>
    );
}

function AuthForms({
    role,
    mode,
    setMode,
    onDone,
}: {
    role: Role;
    mode: Mode;
    setMode: (m: Mode) => void;
    onDone: () => Promise<void>;
}) {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [clinicName, setClinicName] = useState("");
    const [clinicAddress, setClinicAddress] = useState("");
    const [clinicId, setClinicId] = useState("");
    const [joinExisting, setJoinExisting] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            if (mode === "login") {
                return api.login({ email: email.trim(), password });
            }
            if (role === "PATIENT") {
                return api.registerPatient({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    ...(phone.trim() ? { phone: phone.trim() } : {}),
                });
            }
            return api.registerStaff({
                name: name.trim(),
                email: email.trim(),
                password,
                ...(joinExisting
                    ? { clinicId: clinicId.trim() }
                    : { clinicName: clinicName.trim(), clinicAddress: clinicAddress.trim() }),
            });
        },
        onSuccess: async (user) => {
            await onDone();
            toast.success(mode === "login" ? `Welcome back, ${user.name}` : `Account created`);
            navigate({ to: user.role === "STAFF" ? "/staff" : "/book", replace: true });
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const isRegister = mode === "register";

    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim() || !password) {
                    toast.error("Email and password are required");
                    return;
                }
                if (isRegister && !name.trim()) {
                    toast.error("Please enter your name");
                    return;
                }
                if (isRegister && role === "STAFF") {
                    if (joinExisting && !clinicId.trim()) {
                        toast.error("Enter the clinic ID you're joining");
                        return;
                    }
                    if (!joinExisting && (!clinicName.trim() || !clinicAddress.trim())) {
                        toast.error("Clinic name and address are required");
                        return;
                    }
                }
                mutation.mutate();
            }}
        >
            {isRegister ? (
                <div className="space-y-2">
                    <Label htmlFor={`${role}-name`}>Full name</Label>
                    <Input
                        id={`${role}-name`}
                        value={name}
                        autoComplete="name"
                        onChange={(e) => setName(e.target.value)}
                        placeholder={role === "STAFF" ? "Dr. Amara Obi" : "Jane Doe"}
                    />
                </div>
            ) : null}

            <div className="space-y-2">
                <Label htmlFor={`${role}-email`}>Email</Label>
                <Input
                    id={`${role}-email`}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`${role}-password`}>Password</Label>
                <PasswordInput
                    id={`${role}-password`}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />
            </div>

            {isRegister && role === "PATIENT" ? (
                <div className="space-y-2">
                    <Label htmlFor="patient-phone">Phone (optional)</Label>
                    <Input
                        id="patient-phone"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                    />
                </div>
            ) : null}

            {isRegister && role === "STAFF" ? (
                <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/40 p-4">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={joinExisting ? "outline" : "default"}
                            onClick={() => setJoinExisting(false)}
                        >
                            New clinic
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={joinExisting ? "default" : "outline"}
                            onClick={() => setJoinExisting(true)}
                        >
                            Join existing
                        </Button>
                    </div>
                    {joinExisting ? (
                        <div className="space-y-2">
                            <Label htmlFor="clinic-id">Clinic ID</Label>
                            <Input
                                id="clinic-id"
                                value={clinicId}
                                onChange={(e) => setClinicId(e.target.value)}
                                placeholder="clinic_123"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="clinic-name">Clinic name</Label>
                                <Input
                                    id="clinic-name"
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                    placeholder="Healthalyst Lekki"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clinic-address">Clinic address</Label>
                                <Input
                                    id="clinic-address"
                                    value={clinicAddress}
                                    onChange={(e) => setClinicAddress(e.target.value)}
                                    placeholder="12 Admiralty Way, Lekki"
                                />
                            </div>
                        </>
                    )}
                </div>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
                {mutation.isPending
                    ? "Please wait…"
                    : isRegister
                        ? role === "STAFF"
                            ? "Create staff account"
                            : "Create patient account"
                        : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                {isRegister ? "Already registered?" : "New here?"}{" "}
                <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode(isRegister ? "login" : "register")}
                >
                    {isRegister ? "Sign in instead" : `Create a ${role === "STAFF" ? "staff" : "patient"} account`}
                </button>
            </p>
        </form>
    );
}
