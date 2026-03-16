import type { Metadata, Viewport } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { DictionaryProvider } from "@/contexts/DictionaryContext";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";
import { getDictionary } from "@/modules/cores/i18n/src/services/dictionary.service";
import type { LangLayoutProps } from "@/modules/cores/i18n/src/interfaces/i18n.interface";
import "../globals.css";

// Display font for headings - distinctive and modern
const outfit = Outfit({
    variable: "--font-display",
    subsets: ["latin"],
    weight: ["400", "600", "700", "800", "900"],
});

// Body font for readable text
const dmSans = DM_Sans({
    variable: "--font-body",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
});

// Monospace for numbers and stats
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    weight: ["400", "700"],
});

// PWA Viewport configuration
export const viewport: Viewport = {
    themeColor: "#10B981",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

/** Generate static params for all locales. */
export function generateStaticParams() {
    return locales.map((lang) => ({ lang }));
}

/** Generate metadata based on locale. */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang: langParam } = await params;
    const lang: Locale = locales.includes(langParam as Locale)
        ? (langParam as Locale)
        : defaultLocale;

    const isSpanish = lang === "es";

    return {
        title: isSpanish
            ? "Qalia | Nutrición Inteligente con IA"
            : "Qalia | Smart Nutrition with AI",
        description: isSpanish
            ? "Analiza tus comidas y recibe coaching nutricional personalizado con Kili, tu asistente IA."
            : "Analyze your meals and receive personalized nutrition coaching with Kili, your AI assistant.",
        keywords: isSpanish
            ? ["nutrición", "IA", "salud", "tracking", "calorías", "coach nutricional"]
            : ["nutrition", "AI", "health", "tracking", "calories", "nutrition coach"],
        authors: [{ name: "Qalia Team" }],
        manifest: "/manifest.json",
        metadataBase: new URL(
            process.env.NEXT_PUBLIC_APP_URL || "https://qalia.app"
        ),
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: "Qalia",
        },
        formatDetection: {
            telephone: false,
        },
        openGraph: {
            title: isSpanish
                ? "Qalia | Nutrición Inteligente con IA"
                : "Qalia | Smart Nutrition with AI",
            description: isSpanish
                ? "Tu coach nutricional personal impulsado por inteligencia artificial."
                : "Your personal nutrition coach powered by artificial intelligence.",
            siteName: "Qalia",
            locale: isSpanish ? "es_ES" : "en_US",
            type: "website",
            images: [
                {
                    url: "/og-image.png",
                    width: 1200,
                    height: 630,
                    alt: isSpanish
                        ? "Qalia - Nutrición Inteligente con IA"
                        : "Qalia - Smart Nutrition with AI",
                    type: "image/png",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: isSpanish
                ? "Qalia | Nutrición Inteligente con IA"
                : "Qalia | Smart Nutrition with AI",
            description: isSpanish
                ? "Analiza tus comidas y recibe coaching nutricional personalizado con IA"
                : "Analyze your meals and receive personalized nutrition coaching with AI",
            images: ["/og-image.png"],
        },
        icons: {
            icon: [
                { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
                { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            ],
            apple: [
                {
                    url: "/icons/apple-touch-icon.png",
                    sizes: "180x180",
                    type: "image/png",
                },
            ],
        },
    };
}

/**
 * Language layout wrapper.
 * Provides dictionary context to all child components.
 */
export default async function LangLayout({ children, params }: LangLayoutProps) {
    const { lang: langParam } = await params;
    // Validate locale, fallback to default if invalid
    const lang: Locale = locales.includes(langParam as Locale)
        ? (langParam as Locale)
        : defaultLocale;
    const dictionary = await getDictionary(lang);

    return (
        <html lang={lang} suppressHydrationWarning={true}>
            <body
                className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-body antialiased`}
                suppressHydrationWarning={true}
            >
                <DictionaryProvider dictionary={dictionary} locale={lang}>
                    <AppProviders>
                        {children}
                    </AppProviders>
                </DictionaryProvider>
            </body>
        </html>
    );
}
