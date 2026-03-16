import { NextResponse } from "next/server";
import {
    geminiCircuitBreaker,
    supabaseCircuitBreaker,
} from "@/lib/resilience/circuit-breaker";

export const dynamic = "force-dynamic";

interface HealthCheck {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    checks: {
        gemini: { state: string };
        supabase: { state: string };
    };
}

/**
 * Health check endpoint for monitoring and load balancers.
 *
 * Returns:
 * - 200: All systems operational
 * - 503: One or more services degraded
 */
export async function GET(): Promise<NextResponse<HealthCheck>> {
    const checks = {
        gemini: { state: geminiCircuitBreaker.getState() },
        supabase: { state: supabaseCircuitBreaker.getState() },
    };

    const isHealthy =
        checks.gemini.state !== "OPEN" && checks.supabase.state !== "OPEN";

    const status = isHealthy ? "healthy" : "degraded";

    return NextResponse.json(
        {
            status,
            timestamp: new Date().toISOString(),
            checks,
        },
        { status: isHealthy ? 200 : 503 }
    );
}
