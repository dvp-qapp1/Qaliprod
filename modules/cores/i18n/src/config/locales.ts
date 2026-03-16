/** Supported locales configuration. */
export const locales = ['es', 'en'] as const;

/** Default locale (Spanish). */
export const defaultLocale = 'es';

/** Locale type. */
export type Locale = (typeof locales)[number];

/**
 * Language names for display.
 */
export const localeNames: Record<Locale, string> = {
    es: 'Español',
    en: 'English',
};
