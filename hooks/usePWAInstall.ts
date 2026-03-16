"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePWAInstallReturn {
    canInstall: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    showingInstructions: boolean;
    triggerInstall: () => Promise<boolean>;
    requestInstall: () => Promise<boolean>;
    dismissInstructions: () => void;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
    interface Navigator {
        standalone?: boolean;
    }
}

// ── Global singleton so every hook instance shares the same prompt ──
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalInstalled = false;
let globalShowInstructions = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
}
function notify() { listeners.forEach((cb) => cb()); }
function getSnapshot() { return globalDeferredPrompt; }
function getInstalledSnapshot() { return globalInstalled; }
function getShowInstructionsSnapshot() { return globalShowInstructions; }

// Capture the event as early as possible (module-level)
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        globalDeferredPrompt = e as BeforeInstallPromptEvent;
        notify();
    });
    window.addEventListener("appinstalled", () => {
        globalInstalled = true;
        globalDeferredPrompt = null;
        notify();
    });
}

/**
 * Hook for managing PWA installation.
 * Uses a module-level singleton so the beforeinstallprompt event
 * is never lost, regardless of which component mounts first.
 */
export function usePWAInstall(): UsePWAInstallReturn {
    const deferredPrompt = useSyncExternalStore(subscribe, getSnapshot, () => null);
    const installed = useSyncExternalStore(subscribe, getInstalledSnapshot, () => false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const ua = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(ua));
    }, []);

    // Check if already running as installed PWA
    const isStandalone =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true);

    const isInstalled = installed || isStandalone;

    const showingInstructions = useSyncExternalStore(subscribe, getShowInstructionsSnapshot, () => false);

    const triggerInstall = useCallback(async (): Promise<boolean> => {
        if (!globalDeferredPrompt) return false;

        try {
            await globalDeferredPrompt.prompt();
            const { outcome } = await globalDeferredPrompt.userChoice;

            if (outcome === "accepted") {
                globalInstalled = true;
                globalDeferredPrompt = null;
                notify();
                return true;
            }
        } catch (error) {
            console.error("Error installing PWA:", error);
        }

        return false;
    }, []);

    // High-level install action: shows native prompt (Android) or instructions popup (iOS)
    const requestInstall = useCallback(async (): Promise<boolean> => {
        // Android/desktop: try native prompt first
        if (globalDeferredPrompt) {
            return triggerInstall();
        }
        // iOS or no prompt available: show instructions
        globalShowInstructions = true;
        notify();
        return false;
    }, [triggerInstall]);

    const dismissInstructions = useCallback(() => {
        globalShowInstructions = false;
        notify();
    }, []);

    const canInstall = isIOS ? !isInstalled : (deferredPrompt !== null && !isInstalled);

    return {
        canInstall,
        isInstalled,
        isIOS,
        showingInstructions,
        triggerInstall,
        requestInstall,
        dismissInstructions,
    };
}
