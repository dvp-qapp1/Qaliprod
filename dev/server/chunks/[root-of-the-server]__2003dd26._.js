module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/modules/cores/i18n/src/config/locales.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Supported locales configuration. */ __turbopack_context__.s([
    "defaultLocale",
    ()=>defaultLocale,
    "localeNames",
    ()=>localeNames,
    "locales",
    ()=>locales
]);
const locales = [
    'es',
    'en'
];
const defaultLocale = 'es';
const localeNames = {
    es: 'Español',
    en: 'English'
};
}),
"[project]/modules/cores/i18n/src/services/locale.service.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLocaleFromHeader",
    ()=>getLocaleFromHeader,
    "getLocaleFromPathname",
    ()=>getLocaleFromPathname,
    "hasLocalePrefix",
    ()=>hasLocalePrefix
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$intl$2d$localematcher$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@formatjs/intl-localematcher/index.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$negotiator$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/negotiator/index.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/modules/cores/i18n/src/config/locales.ts [middleware] (ecmascript)");
;
;
;
function getLocaleFromHeader(acceptLanguage) {
    const headers = {
        'accept-language': acceptLanguage
    };
    const languages = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$negotiator$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"]({
        headers
    }).languages();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$intl$2d$localematcher$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__["match"])(languages, __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["locales"], __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["defaultLocale"]);
}
function hasLocalePrefix(pathname) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["locales"].some((locale)=>pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
}
function getLocaleFromPathname(pathname) {
    for (const locale of __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["locales"]){
        if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
            return locale;
        }
    }
    return null;
}
}),
"[project]/lib/supabase/middleware.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$services$2f$locale$2e$service$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/modules/cores/i18n/src/services/locale.service.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/modules/cores/i18n/src/config/locales.ts [middleware] (ecmascript)");
;
;
;
;
async function updateSession(request) {
    let supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["createServerClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll () {
                return request.cookies.getAll();
            },
            setAll (cookiesToSet) {
                cookiesToSet.forEach(({ name, value })=>request.cookies.set(name, value));
                supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
                    request
                });
                cookiesToSet.forEach(({ name, value, options })=>supabaseResponse.cookies.set(name, value, options));
            }
        }
    });
    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    // Extract locale from pathname (e.g., /es/dashboard → "es")
    const locale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$services$2f$locale$2e$service$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["getLocaleFromPathname"])(pathname) || __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$config$2f$locales$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["defaultLocale"];
    // Strip locale prefix for route matching (e.g., /es/dashboard → /dashboard)
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    // Define protected routes (without locale prefix)
    const protectedRoutes = [
        "/dashboard"
    ];
    const authRoutes = [
        "/login",
        "/signup"
    ];
    // Also protect API routes (these don't have locale prefix)
    const isApiProtected = pathname.startsWith("/api/meals") || pathname.startsWith("/api/chat");
    const isProtectedRoute = isApiProtected || protectedRoutes.some((route)=>pathWithoutLocale.startsWith(route));
    const isAuthRoute = authRoutes.some((route)=>pathWithoutLocale.startsWith(route));
    const isOnboardingRoute = pathWithoutLocale.startsWith("/onboarding");
    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        url.searchParams.set("next", pathname);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    // For authenticated users on protected routes, check onboarding status
    if (isProtectedRoute && user && !isApiProtected) {
        const { data: profile } = await supabase.from("profiles").select("onboarding_completed, gender, height_cm, weight_kg, goal, activity_level, age").eq("user_id", user.id).single();
        // Redirect to onboarding if not completed OR if critical fields are missing
        const hasRequiredFields = profile?.gender && profile?.height_cm && profile?.weight_kg && profile?.goal && profile?.activity_level && profile?.age;
        if (!profile?.onboarding_completed || !hasRequiredFields) {
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/onboarding`;
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
    }
    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/dashboard`;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    return supabaseResponse;
}
}),
"[project]/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/middleware.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$services$2f$locale$2e$service$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/modules/cores/i18n/src/services/locale.service.ts [middleware] (ecmascript)");
;
;
;
async function proxy(request) {
    const { pathname } = request.nextUrl;
    // Skip locale check for API routes (they don't need locale prefix)
    if (pathname.startsWith("/api")) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["updateSession"])(request);
    }
    // If no locale prefix, detect and redirect
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$services$2f$locale$2e$service$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["hasLocalePrefix"])(pathname)) {
        const acceptLanguage = request.headers.get("accept-language") ?? "";
        const locale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$modules$2f$cores$2f$i18n$2f$src$2f$services$2f$locale$2e$service$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["getLocaleFromHeader"])(acceptLanguage);
        request.nextUrl.pathname = `/${locale}${pathname}`;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(request.nextUrl);
    }
    // Update Supabase session
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["updateSession"])(request);
}
const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         * - api/health (health check)
         */ "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|txt)$|api/health).*)"
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2003dd26._.js.map