import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
    hasLocalePrefix,
    getLocaleFromHeader,
} from "@/modules/cores/i18n/src/services/locale.service";

/**
 * Proxy handler for locale detection and Supabase session management.
 * Redirects to locale-prefixed paths and updates auth session.
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip locale check for API routes (they don't need locale prefix)
    if (pathname.startsWith("/api")) {
        return await updateSession(request);
    }

    // If no locale prefix, detect and redirect
    if (!hasLocalePrefix(pathname)) {
        const acceptLanguage = request.headers.get("accept-language") ?? "";
        const locale = getLocaleFromHeader(acceptLanguage);

        request.nextUrl.pathname = `/${locale}${pathname}`;
        return NextResponse.redirect(request.nextUrl);
    }

    // Update Supabase session
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         * - api/health (health check)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|txt)$|api/health).*)",
    ],
};
