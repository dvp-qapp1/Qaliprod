import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/env";

/**
 * Browser-side Supabase client.
 * Use for auth and real-time subscriptions in client components.
 */
export function createClient() {
    return createBrowserClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}
