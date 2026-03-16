import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Custom API error for operational errors (expected failures).
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

/**
 * Centralized error handler for API routes.
 * Handles Zod validation errors, operational errors, and unexpected errors.
 */
export function errorHandler(
    error: unknown,
    context?: Record<string, unknown>
): Response {
    // Zod validation errors -> 400
    if (error instanceof z.ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: "Validation failed",
                details: error.issues.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                })),
            },
            { status: 400 }
        );
    }

    // Operational errors (expected)
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: error.statusCode }
        );
    }

    // Rate limit errors
    if (error instanceof Error && error.message === "Rate limit exceeded") {
        return NextResponse.json(
            {
                success: false,
                error: "Too many requests. Please try again later.",
                upgradeUrl: "/pricing",
            },
            { status: 429 }
        );
    }

    // Circuit breaker errors
    if (error instanceof Error && error.message.includes("Circuit breaker")) {
        return NextResponse.json(
            {
                success: false,
                error: "Service temporarily unavailable. Please try again shortly.",
            },
            { status: 503 }
        );
    }

    // Unexpected errors - log and return generic message
    console.error("[API Error]", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context,
    });

    // TODO: Add Sentry integration when configured
    // Sentry.captureException(error, { contexts: { custom: context } });

    return NextResponse.json(
        {
            success: false,
            error: "Internal server error",
        },
        { status: 500 }
    );
}
