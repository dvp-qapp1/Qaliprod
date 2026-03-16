"use client";

import { usePathname, useRouter } from "next/navigation";
import { type Locale, locales } from "@/modules/cores/i18n/src/config/locales";
import { useLocale } from "@/contexts/DictionaryContext";
import { motion } from "framer-motion";

/**
 * Language Switcher Component - Minimalist UX Pro Version
 * Uses a pill design with a sliding highlight background for a premium feel.
 */
export function LanguageSwitcher() {
    const pathname = usePathname();
    const router = useRouter();
    const currentLocale = useLocale();

    const switchLocale = (newLocale: Locale) => {
        if (newLocale === currentLocale) return;

        const segments = pathname.split("/");
        if (locales.includes(segments[1] as Locale)) {
            segments[1] = newLocale;
        }
        const newPath = segments.join("/");
        router.push(newPath);
    };

    return (
        <div className="relative flex items-center bg-slate-100/50 dark:bg-slate-900/10 p-1 rounded-full border border-slate-900/5 backdrop-blur-sm w-fit">
            {locales.map((locale) => {
                const isActive = currentLocale === locale;
                return (
                    <button
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className={`
                            relative flex-1 px-5 py-2 min-w-[60px] rounded-full text-[11px] font-black tracking-[0.2em] uppercase transition-colors duration-300 z-10
                            ${isActive
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            }
                        `}
                        aria-label={`Change language to ${locale === 'en' ? 'English' : 'Spanish'}`}
                        aria-pressed={isActive}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-pill"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm rounded-full -z-10"
                            />
                        )}
                        <span className="relative">{locale}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Compact Language Switcher (mobile/subtle version)
 * Single button that toggles between languages.
 */
export function LanguageSwitcherCompact() {
    const pathname = usePathname();
    const router = useRouter();
    const currentLocale = useLocale();

    const toggleLocale = () => {
        const newLocale: Locale = currentLocale === "es" ? "en" : "es";
        const segments = pathname.split("/");
        if (locales.includes(segments[1] as Locale)) {
            segments[1] = newLocale;
        }
        router.push(segments.join("/"));
    };

    return (
        <button
            onClick={toggleLocale}
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            aria-label={`Switch to ${currentLocale === "es" ? "English" : "Spanish"}`}
        >
            <span className="text-[10px] font-black tracking-tighter text-slate-800 group-hover:text-emerald-600 uppercase transition-colors">
                {currentLocale === "es" ? "EN" : "ES"}
            </span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full scale-0 group-hover:scale-100 transition-transform" />
        </button>
    );
}
