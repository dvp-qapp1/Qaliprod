"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA functionality.
 * Should be included once in the app, typically in a provider or layout.
 */
export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Only register in production
        if (process.env.NODE_ENV !== "production") {
            console.log("[SW] Service worker disabled in development");
            return;
        }

        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("[SW] Service worker registered:", registration.scope);

                        // Check for updates periodically
                        setInterval(() => {
                            registration.update();
                        }, 60 * 60 * 1000); // Every hour
                    })
                    .catch((error) => {
                        console.error("[SW] Service worker registration failed:", error);
                    });
            });
        }
    }, []);

    return null;
}
