import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ lang: string }> }
) {
    const { lang: langParam } = await params;
    // Validate locale, fallback to default if invalid
    const lang: Locale = locales.includes(langParam as Locale)
        ? (langParam as Locale)
        : defaultLocale;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // Get the correct origin from headers (Cloud Run sets x-forwarded-host)
    const headersList = await headers();
    const host =
        headersList.get("x-forwarded-host") ||
        headersList.get("host") ||
        "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const origin = `${protocol}://${host}`;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user has completed onboarding
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("user_id", user.id)
                    .single();

                // Redirect to onboarding if not completed (with locale)
                if (!profile?.onboarding_completed) {
                    return NextResponse.redirect(`${origin}/${lang}/onboarding`);
                }
            }

            return NextResponse.redirect(`${origin}/${lang}/dashboard`);
        }
    }

    // Return to login with error (with locale)
    return NextResponse.redirect(`${origin}/${lang}/login?error=auth_error`);
}
