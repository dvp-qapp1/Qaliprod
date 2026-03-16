import 'server-only';
import type { Locale } from '../config/locales';
import type { Dictionary } from '../interfaces/i18n.interface';

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
    es: () => import('../../dictionaries/es.json').then((m) => m.default),
    en: () => import('../../dictionaries/en.json').then((m) => m.default),
};

/**
 * Get dictionary for locale.
 * Server-only function - use DictionaryContext for client components.
 *
 * @param locale - Target locale
 * @returns Translated dictionary
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
    return dictionaries[locale]();
}
