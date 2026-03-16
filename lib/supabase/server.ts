import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/env";

interface CookieToSet {
    name: string;
    value: string;
    options: CookieOptions;
}

/**
 * Server-side Supabase client with cookie-based auth.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: CookieToSet[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Cookies can only be set in Server Actions or Route Handlers
                        // This error can be safely ignored in Server Components
                    }
                },
            },
        }
    );
}

/**
 * Get the authenticated user from the current session.
 */
export async function getUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        return { user: null, error };
    }

    return { user, error: null };
}

/**
 * Admin client with service role key.
 * Use only in trusted server contexts (webhooks, admin operations).
 */
export function createAdminClient() {
    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
            cookies: {
                getAll() {
                    return [];
                },
                setAll() { },
            },
        }
    );
}
