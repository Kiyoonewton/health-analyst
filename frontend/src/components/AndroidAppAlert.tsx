import { Smartphone, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isNative } from "@/lib/auth-token";

const DISMISSED_KEY = "healthalyst_android_alert_dismissed";

export function AndroidAppAlert() {
    const [dismissed, setDismissed] = useState(
        () => typeof window !== "undefined" && sessionStorage.getItem(DISMISSED_KEY) === "1",
    );

    if (isNative || dismissed) return null;

    return (
        <Alert className="relative border-primary/30 bg-primary/5 pr-12">
            <Smartphone className="size-4 text-primary" />
            <AlertTitle>Get the Healthalyst Android app</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>Book and manage appointments faster with the app installed on your phone.</span>
                <Button asChild size="sm">
                    <a href="/downloads/healthanalyst.apk" download>
                        Download APK
                    </a>
                </Button>
            </AlertDescription>
            <button
                type="button"
                aria-label="Dismiss"
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => {
                    sessionStorage.setItem(DISMISSED_KEY, "1");
                    setDismissed(true);
                }}
            >
                <X className="size-4" />
            </button>
        </Alert>
    );
}
