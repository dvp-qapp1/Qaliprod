/**
 * Runtime feature flags for gradual rollouts and quick rollbacks.
 * Read from environment variables at runtime.
 */

function getFlag(envVar: string, defaultValue: boolean): boolean {
    const value = process.env[envVar];
    if (value === undefined) return defaultValue;
    return value === "true";
}

/**
 * Feature flags configuration.
 * Set via environment variables for runtime control.
 */
export const FEATURES = {
    /**
     * Enable database triggers for automatic daily calorie aggregation.
     */
    ANALYTICS_TRIGGERS: getFlag("ENABLE_ANALYTICS_TRIGGERS", true),

    /**
     * Enable rate limiting for Gemini API calls.
     */
    GEMINI_RATE_LIMIT: getFlag("ENABLE_GEMINI_RATE_LIMIT", true),

    /**
     * Enable PWA offline support.
     */
    PWA_OFFLINE: getFlag("ENABLE_PWA_OFFLINE", false),

    /**
     * Enable community features (shared meals, social).
     */
    COMMUNITY_FEATURES: getFlag("ENABLE_COMMUNITY_FEATURES", false),
} as const;

/**
 * Check if a specific feature is enabled.
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
    return FEATURES[feature];
}
