import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        // Database
        DATABASE_URL: z.string().url(),
        SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

        // Gemini AI
        GEMINI_API_KEY: z.string().min(1),
        GEMINI_DAILY_BUDGET_USD: z.coerce.number().default(10),

        // Payments
        POLAR_ACCESS_TOKEN: z.string().min(1),

        // Rate Limiting
        UPSTASH_REDIS_REST_URL: z.string().url(),
        UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

        // Monitoring
        SENTRY_DSN: z.string().url().optional(),
        SENTRY_ENVIRONMENT: z.enum(["development", "staging", "production"]).default("development"),

        // Feature Flags
        ENABLE_ANALYTICS_TRIGGERS: z.coerce.boolean().default(true),
        ENABLE_GEMINI_RATE_LIMIT: z.coerce.boolean().default(true),
        ENABLE_PWA_OFFLINE: z.coerce.boolean().default(false),
        ENABLE_COMMUNITY_FEATURES: z.coerce.boolean().default(false),
    },
    client: {
        NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
        NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    },
    runtimeEnv: {
        // Server
        DATABASE_URL: process.env.DATABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_DAILY_BUDGET_USD: process.env.GEMINI_DAILY_BUDGET_USD,
        POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        SENTRY_DSN: process.env.SENTRY_DSN,
        SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
        ENABLE_ANALYTICS_TRIGGERS: process.env.ENABLE_ANALYTICS_TRIGGERS,
        ENABLE_GEMINI_RATE_LIMIT: process.env.ENABLE_GEMINI_RATE_LIMIT,
        ENABLE_PWA_OFFLINE: process.env.ENABLE_PWA_OFFLINE,
        ENABLE_COMMUNITY_FEATURES: process.env.ENABLE_COMMUNITY_FEATURES,

        // Client
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
