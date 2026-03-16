import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getLocaleFromPathname } from "@/modules/cores/i18n/src/services/locale.service";
import { defaultLocale } from "@/modules/cores/i18n/src/config/locales";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Extract locale from pathname (e.g., /es/dashboard → "es")
    const locale = getLocaleFromPathname(pathname) || defaultLocale;

    // Strip locale prefix for route matching (e.g., /es/dashboard → /dashboard)
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

    // Define protected routes (without locale prefix)
    const protectedRoutes = ["/dashboard"];
    const authRoutes = ["/login", "/signup"];

    // Also protect API routes (these don't have locale prefix)
    const isApiProtected = pathname.startsWith("/api/meals") || pathname.startsWith("/api/chat");
    const isProtectedRoute = isApiProtected || protectedRoutes.some((route) =>
        pathWithoutLocale.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => pathWithoutLocale.startsWith(route));
    const isOnboardingRoute = pathWithoutLocale.startsWith("/onboarding");

    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    // For authenticated users on protected routes, check onboarding status
    if (isProtectedRoute && user && !isApiProtected) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, gender, height_cm, weight_kg, goal, activity_level, age")
            .eq("user_id", user.id)
            .single();

        // Redirect to onboarding if not completed OR if critical fields are missing
        const hasRequiredFields = profile?.gender && profile?.height_cm
            && profile?.weight_kg && profile?.goal && profile?.activity_level && profile?.age;

        if (!profile?.onboarding_completed || !hasRequiredFields) {
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/onboarding`;
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/dashboard`;
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
