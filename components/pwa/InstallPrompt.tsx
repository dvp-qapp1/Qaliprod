"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { useDictionary } from "@/contexts/DictionaryContext";

export function InstallPrompt() {
    const { canInstall, isInstalled, isIOS, triggerInstall, showingInstructions, dismissInstructions } = usePWAInstall();
    const [showAutoPrompt, setShowAutoPrompt] = useState(false);

    // Auto-show on first visit (original behavior)
    useEffect(() => {
        if (isInstalled || !canInstall) {
            setShowAutoPrompt(false);
            return;
        }

        const dismissedAt = localStorage.getItem("pwa-install-dismissed");
        if (dismissedAt) {
            const dismissedDate = new Date(dismissedAt);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 1) {
                return;
            }
        }

        const timer = setTimeout(() => setShowAutoPrompt(true), 3000);
        return () => clearTimeout(timer);
    }, [canInstall, isInstalled]);

    // Visible if auto-prompted OR if Profile button requested instructions
    const showPrompt = showAutoPrompt || showingInstructions;

    const handleInstall = async () => {
        if (isIOS) {
            return;
        }
        await triggerInstall();
        setShowAutoPrompt(false);
        dismissInstructions();
    };

    const handleDismiss = () => {
        setShowAutoPrompt(false);
        dismissInstructions();
        localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    };

    const { dictionary } = useDictionary();
    const ti = dictionary.installPrompt;

    if (!showPrompt) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-[calc(4.5rem+var(--safe-area-bottom,0px))] left-3 right-3 z-[200] md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
                >
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl overflow-hidden relative">
                        {/* Background subtle decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10 rounded-full" />

                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <QaliaLogo className="w-8 h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-display font-bold text-white text-lg leading-tight">
                                    {ti.title}
                                </h3>
                                <p className="text-neutral-400 text-sm">
                                    {ti.subtitle}
                                </p>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-neutral-500 hover:text-neutral-300 transition-colors p-1"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content for iOS */}
                        {isIOS ? (
                            <div className="space-y-4">
                                <div className="bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/50">
                                    <p className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                        {ti.iosTitle}
                                    </p>
                                    <ol className="space-y-3">
                                        <li className="flex items-center gap-3 text-neutral-300 text-sm">
                                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 text-white group">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                            </div>
                                            <span dangerouslySetInnerHTML={{ __html: ti.iosStep1 }} />
                                        </li>
                                        <li className="flex items-center gap-3 text-neutral-300 text-sm">
                                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <span dangerouslySetInnerHTML={{ __html: ti.iosStep2 }} />
                                        </li>
                                    </ol>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors text-sm font-bold"
                                >
                                    {ti.gotIt}
                                </button>
                            </div>
                        ) : (
                            /* Actions for Android/Desktop */
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors text-sm font-medium"
                                >
                                    {ti.notNow}
                                </button>
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {ti.install}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
