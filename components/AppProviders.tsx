"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InstallPrompt, ServiceWorkerRegistration } from "@/components/pwa";

interface AppProvidersProps {
    children: React.ReactNode;
}

/**
 * Client-side providers and wrappers for the app.
 * Includes ErrorBoundary, PWA components, and any future providers (Auth, Theme, etc.)
 */
export function AppProviders({ children }: AppProvidersProps) {
    return (
        <ErrorBoundary>
            <ServiceWorkerRegistration />
            {children}
            <InstallPrompt />
        </ErrorBoundary>
    );
}
