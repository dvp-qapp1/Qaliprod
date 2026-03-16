"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/modules/cores/i18n/src/interfaces/i18n.interface";
import type { Locale } from "@/modules/cores/i18n/src/config/locales";

interface DictionaryContextValue {
    dictionary: Dictionary;
    locale: Locale;
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

interface DictionaryProviderProps {
    children: ReactNode;
    dictionary: Dictionary;
    locale: Locale;
}

/**
 * Provider component for dictionary context.
 * Used to pass translations to client components.
 */
export function DictionaryProvider({
    children,
    dictionary,
    locale,
}: DictionaryProviderProps) {
    return (
        <DictionaryContext.Provider value={{ dictionary, locale }}>
            {children}
        </DictionaryContext.Provider>
    );
}

/**
 * Hook to access the dictionary in client components.
 *
 * @returns Dictionary and current locale
 * @throws Error if used outside DictionaryProvider
 */
export function useDictionary(): DictionaryContextValue {
    const context = useContext(DictionaryContext);
    if (!context) {
        throw new Error("useDictionary must be used within a DictionaryProvider");
    }
    return context;
}

/**
 * Hook to get just the current locale.
 *
 * @returns Current locale (es | en)
 */
export function useLocale(): Locale {
    const { locale } = useDictionary();
    return locale;
}
