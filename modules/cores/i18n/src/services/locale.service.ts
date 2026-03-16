import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { locales, defaultLocale, type Locale } from '../config/locales';

/**
 * Detect locale from Accept-Language header.
 *
 * @param acceptLanguage - Header value
 * @returns Matched locale
 */
export function getLocaleFromHeader(acceptLanguage: string): Locale {
    const headers = { 'accept-language': acceptLanguage };
    const languages = new Negotiator({ headers }).languages();
    return match(languages, locales, defaultLocale) as Locale;
}

/**
 * Check if pathname has locale prefix.
 *
 * @param pathname - URL pathname
 * @returns True if locale present
 */
export function hasLocalePrefix(pathname: string): boolean {
    return locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
}

/**
 * Extract locale from pathname.
 *
 * @param pathname - URL pathname
 * @returns Locale or null if not found
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
    for (const locale of locales) {
        if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
            return locale;
        }
    }
    return null;
}
